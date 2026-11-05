// Optional hosted acceptance check. Use disposable users created in YOUR Supabase project.
// Credentials are read from non-VITE environment variables and never written to the report.
import {createClient} from '@supabase/supabase-js';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {emptyJob} from '../src/logic';
import {toRow,fromRow} from '../src/fields';
const url=process.env.VITE_SUPABASE_URL,key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const emailA=process.env.MASAR_TEST_EMAIL_A,passwordA=process.env.MASAR_TEST_PASSWORD_A,emailB=process.env.MASAR_TEST_EMAIL_B,passwordB=process.env.MASAR_TEST_PASSWORD_B;
if(!url||!key||!emailA||!passwordA||!emailB||!passwordB)throw new Error('Configure the Supabase URL/public key and two disposable test users in .env.local. See README_AR.md.');
if(key.startsWith('sb_secret_'))throw new Error('Use only a publishable or legacy anon key.');
function client(){return createClient(url!,key!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
const a=client(),b=client(),anon=client();
const table='career_jobs';let owner='',created=false;
const job={...emptyJob(),id:'acceptance-'+crypto.randomUUID(),company:'MASAR DISPOSABLE ACCEPTANCE TEST',role:'Mud Engineer',fit:'87',visa:'Test sponsorship',housing:'Test housing',tickets:'Test tickets'};
try{
 const loginA=await a.auth.signInWithPassword({email:emailA,password:passwordA});if(loginA.error)throw loginA.error;owner=loginA.data.user.id;
 const loginB=await b.auth.signInWithPassword({email:emailB,password:passwordB});if(loginB.error)throw loginB.error;assert.notEqual(owner,loginB.data.user.id);
 const anonRead=await anon.from(table).select('id').eq('id',job.id);assert.ok(anonRead.error||anonRead.data?.length===0,'Anonymous reader must not see records');
 const insert=await a.from(table).insert(toRow(job,owner)).select();if(insert.error)throw insert.error;created=true;assert.equal(insert.data.length,1);
 const changed={...job,fit:'93',rotation:'28/28'};const update=await a.from(table).update(toRow(changed,owner)).eq('user_id',owner).eq('id',job.id).select();if(update.error)throw update.error;assert.equal(update.data.length,1);
 const fresh=client();const newLogin=await fresh.auth.signInWithPassword({email:emailA,password:passwordA});if(newLogin.error)throw newLogin.error;
 const read=await fresh.from(table).select('*').eq('user_id',owner).eq('id',job.id).single();if(read.error)throw read.error;assert.deepEqual(fromRow(read.data),changed);await fresh.auth.signOut();
 const hidden=await b.from(table).select('id').eq('id',job.id);assert.equal(hidden.data?.length,0);
 const deniedUpdate=await b.from(table).update({company:'FORGED'}).eq('user_id',owner).eq('id',job.id).select('id');assert.ok(deniedUpdate.error||deniedUpdate.data?.length===0);
 const deniedInsert=await b.from(table).insert({...toRow(job,owner),id:job.id+'-forged'});assert.ok(deniedInsert.error,'Cross-owner insert must be rejected');
 await writeFile('verification-results.json',JSON.stringify({checkedAt:new Date().toISOString(),result:'passed',checks:['authenticated insert','update','fresh-session reload','all-field equality','anonymous denial','two-user read/update/insert isolation']},null,2));
 console.log('PASS: hosted database persistence, all-field readback and two-user RLS isolation. Report: verification-results.json');
}finally{
 if(created){const cleanup=await a.from(table).delete().eq('user_id',owner).in('id',[job.id,job.id+'-forged']);if(cleanup.error)console.error('Remove the disposable acceptance record manually:',job.id);}
 await a.auth.signOut();await b.auth.signOut();
}
