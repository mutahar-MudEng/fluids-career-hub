import {createClient} from '@supabase/supabase-js';

const url=import.meta.env.VITE_SUPABASE_URL?.trim();
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
function configurationError(){
  if(!url||!key||url.includes('YOUR_PROJECT')||key.includes('YOUR_PUBLIC_KEY'))return 'أضف إعدادات مشروع Supabase في ملف .env.local أو إعدادات الاستضافة، ثم أعد بناء التطبيق. راجع README_AR.md.';
  try{const parsed=new URL(url);if(parsed.protocol!=='https:'&&!(import.meta.env.DEV&&['localhost','127.0.0.1'].includes(parsed.hostname)))return 'يجب استخدام رابط Supabase آمن يبدأ بـ https://.';}catch{return 'رابط Supabase غير صالح.';}
  if(key.startsWith('sb_secret_'))return 'لا تستخدم مفتاح Supabase السري في الواجهة. استخدم Publishable Key فقط.';
  if(!key.startsWith('sb_publishable_')){
    try{const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role!=='anon')return 'استخدم Publishable Key أو مفتاح anon فقط؛ لا تستخدم service_role.';}catch{return 'مفتاح المشروع غير صالح. استخدم Publishable Key من إعدادات Supabase.';}
  }
  return '';
}
export const configError=configurationError();
export const supabase=configError?null:createClient(url!,key!,{auth:{storage:sessionStorage,storageKey:'masar-auth-session',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
