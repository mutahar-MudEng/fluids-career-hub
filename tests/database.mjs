// Runs the real SQL migration against an isolated PostgreSQL-compatible PGlite database.
// No hosted account, network, real credentials or professional data are used.
import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'masar-rls-'));
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
let db;
try{
 db=new PGlite(dir);
 await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values ('${a}'),('${b}');`);
 await db.exec(await fs.readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
 async function identity(id){await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub='${id}';`)}
 await identity(a);
 await db.query(`insert into public.career_jobs(id,company,role,fit_score,visa_sponsorship,housing,tickets) values ('test-row','Persistence Test','Mud Engineer',85,'Sponsored','Provided','Provided')`);
 assert.equal((await db.query('select * from public.career_jobs')).rows.length,1);
 await db.query("update public.career_jobs set fit_score=91,rotation='28/28' where id='test-row'");
 await assert.rejects(()=>db.query("insert into public.career_jobs(id,company,role,fit_score) values ('bad-fit','Test','Mud Engineer',101)"));
 await assert.rejects(()=>db.query("insert into public.career_jobs(id,company,role,applied_on) values ('bad-date','Test','Mud Engineer','2026-02-30')"));
 await assert.rejects(()=>db.query("insert into public.career_jobs(id,company,role,verification_status) values ('bad-proof','Test','Mud Engineer','مفتوح ومؤكد')"));
 await identity(b);
 assert.equal((await db.query('select * from public.career_jobs')).rows.length,0);
 assert.equal((await db.query("update public.career_jobs set company='Forged' where id='test-row' returning id")).rows.length,0);
 assert.equal((await db.query("delete from public.career_jobs where id='test-row' returning id")).rows.length,0);
 await assert.rejects(()=>db.query('insert into public.career_jobs(user_id,id,company,role) values ($1,$2,$3,$4)',[a,'forged','Forged','Mud Engineer']));
 await db.exec('reset role; set role anon;');
 await assert.rejects(()=>db.query('select * from public.career_jobs'));
 await assert.rejects(()=>db.query("insert into public.career_jobs(id,company,role) values ('anon','Forged','Mud Engineer')"));
 await db.close();
 db=new PGlite(dir); // New database connection after restart: no browser memory involved.
 await identity(a);
 const rows=(await db.query("select fit_score,rotation,housing,tickets,visa_sponsorship from public.career_jobs where id='test-row'")).rows;
 assert.deepEqual(rows,[{fit_score:91,rotation:'28/28',housing:'Provided',tickets:'Provided',visa_sponsorship:'Sponsored'}]);
 await db.query("delete from public.career_jobs where id='test-row'");
 assert.equal((await db.query('select * from public.career_jobs')).rows.length,0);
 console.log('PASS: SQL schema, create/update/reload after database restart/delete, score/date/proof constraints, anonymous denial and two-user RLS isolation.');
}finally{if(db)await db.close();await fs.rm(dir,{recursive:true,force:true});}
