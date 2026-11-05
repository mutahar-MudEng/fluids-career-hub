import {type Job,emptyJob,statuses} from './logic';
export const fieldMap={id:'id',company:'company',role:'role',country:'country',city:'city',url:'official_url',posted:'published_on',applied:'applied_on',status:'application_status',reference:'application_reference',confirmation:'confirmation',lastFollow:'last_follow_up',nextFollow:'next_follow_up',visa:'visa_sponsorship',rotation:'rotation',housing:'housing',tickets:'tickets',fit:'fit_score',gaps:'gaps',requirements:'requirements',verification:'verification_status',verifiedDate:'verified_on',notes:'verification_notes',policy:'follow_up_policy',weekend:'weekend',reviewed:'reviewed_on'} as const satisfies Record<keyof Job,string>;
const dateFields=['posted','applied','lastFollow','nextFollow','verifiedDate','reviewed'] as const;
export function validDate(v:string){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
export function validateJob(j:Job){
  for(const key of Object.keys(fieldMap) as (keyof Job)[]){if(typeof j[key]!=='string'||j[key].length>10000)throw new Error('أحد حقول السجل غير صالح أو طويل جدًا.');}
  if(!/^[A-Za-z0-9_-]{1,100}$/.test(j.id)||!j.company.trim()||!j.role.trim())throw new Error('أدخل الشركة والمسمى ومعرّف سجل صالحًا.');
  if(!statuses.includes(j.status)||!['5-7','7-10'].includes(j.policy)||!['5,6','0,6'].includes(j.weekend))throw new Error('حالة الطلب أو إعدادات المتابعة غير صالحة.');
  if(!['بحاجة إلى إعادة تحقق','مفتوح ومؤكد','مغلق','لم يُعثر على مصدر رسمي'].includes(j.verification))throw new Error('حالة التحقق غير صالحة.');
  if(j.fit!==''&&(!Number.isInteger(Number(j.fit))||Number(j.fit)<0||Number(j.fit)>100))throw new Error('درجة الملاءمة يجب أن تكون عددًا صحيحًا بين 0 و100.');
  for(const k of dateFields){if(j[k]&&!validDate(j[k]))throw new Error('أحد التواريخ غير صالح.');}
  if(j.lastFollow&&(!j.applied||j.lastFollow<j.applied))throw new Error('تاريخ آخر متابعة يجب أن يأتي بعد تاريخ التقديم.');
  if(j.url){try{if(!['https:','http:'].includes(new URL(j.url).protocol))throw new Error();}catch{throw new Error('رابط الإعلان غير صالح.');}}
  if(j.verification==='مفتوح ومؤكد'&&(!j.url||!j.verifiedDate))throw new Error('يلزم رابط رسمي وتاريخ تحقق لتأكيد فتح الإعلان.');
  return j;
}
export function toRow(job:Job,userId:string){const j=validateJob(job);const row:Record<string,unknown>={user_id:userId};for(const k of Object.keys(fieldMap) as (keyof Job)[]){row[fieldMap[k]]=k==='fit'?(j.fit===''?null:Number(j.fit)):dateFields.includes(k as typeof dateFields[number])?(j[k]||null):j[k];}return row;}
export function fromRow(row:Record<string,unknown>):Job{const j=emptyJob();for(const k of Object.keys(fieldMap) as (keyof Job)[]){const value=row[fieldMap[k]];j[k]=value==null?'':String(value);}return validateJob(j);}
