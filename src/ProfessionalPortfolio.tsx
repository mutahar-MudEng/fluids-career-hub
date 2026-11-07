import CareerDocuments from './CareerDocuments';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import './professional-portfolio.css';

type Lang = 'ar' | 'en';
type Kind = 'competency' | 'certificate' | 'award';
type Level = '' | 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
type PortfolioRecord = {
  id: string;
  owner_id: string;
  kind: Kind;
  title_en: string;
  title_ar: string;
  issuer: string;
  issued_on: string | null;
  evidence_url: string;
  level: Level;
  notes: string;
  verified: boolean;
};
type Draft = Omit<PortfolioRecord, 'owner_id'>;
const blank = (kind: Kind = 'certificate'): Draft => ({
  id: crypto.randomUUID(), kind, title_en: '', title_ar: '', issuer: '',
  issued_on: null, evidence_url: '', level: '', notes: '', verified: false
});
const skills: { en: string; ar: string }[] = [
  {en:'Complete Fluid Report',ar:'إعداد تقرير سوائل الحفر الكامل'},
  {en:'Fluid Blending',ar:'خلط السوائل'},
  {en:'Fluid Displacement',ar:'إزاحة السوائل'},
  {en:'Product and Fluid Logistics',ar:'لوجستيات المواد والسوائل'},
  {en:'Solids Control',ar:'التحكم بالمواد الصلبة'},
  {en:'Volume Accounting',ar:'محاسبة أحجام السوائل'},
  {en:'Stuck Pipe',ar:'التعامل مع انحشار الأنابيب'},
  {en:'Narrow ECD',ar:'إدارة نافذة ECD الضيقة'},
  {en:'Wellbore Instability',ar:'عدم استقرار جدار البئر'},
  {en:'Well Control',ar:'التحكم بالبئر'},
  {en:'Flat Rheology Fluid Execution',ar:'تشغيل سوائل الريولوجيا المستقرة'},
  {en:'Extended Reach Execution',ar:'عمليات الحفر بعيد المدى ERD'},
  {en:'High Density Brines Execution',ar:'تشغيل المحاليل الملحية عالية الكثافة'},
  {en:'High Performance WBM Execution',ar:'تشغيل طين مائي عالي الأداء'},
  {en:'HTHP Execution',ar:'عمليات الضغط والحرارة المرتفعين'},
  {en:'Open Hole Completion Execution',ar:'إكمال المقاطع المفتوحة'},
  {en:'RDF Execution',ar:'تشغيل سوائل حفر المكمن RDF'},
  {en:'Virtual Completion Solution Execution',ar:'حلول الإكمال الافتراضي'},
  {en:'Inflow Testing',ar:'اختبارات التدفق إلى داخل البئر'},
  {en:'Wellbore Clean-Up (Fluids)',ar:'تنظيف البئر بالسوائل'},
  {en:'RheoProfiler',ar:'استخدام RheoProfiler'},
  {en:'Fluid Check Evaluate and Treat',ar:'فحص السوائل وتقييمها ومعالجتها'},
  {en:'Virtual Hydraulics Execution',ar:'استخدام Virtual Hydraulics'},
  {en:'Lost Circulation',ar:'معالجة الفاقد'},
  {en:'Poor Hole Cleaning',ar:'معالجة ضعف تنظيف البئر'},
  {en:'Deep Water Operations',ar:'عمليات المياه العميقة'},
];
const txt = {
 ar: {heading:'السجل المهني',intro:'الكفاءات مأخوذة كعناوين فقط من ملف Excel؛ المستويات والتوثيق تُدخل بعد التحقق.',competency:'مصفوفة الكفاءات',certificate:'الشهادات والدورات',award:'التكريم والإنجازات',add:'إضافة سجل',save:'حفظ',cancel:'إلغاء',remove:'حذف',titleAr:'العنوان بالعربية',titleEn:'العنوان بالإنجليزية',issuer:'الجهة المانحة أو المصدر',date:'تاريخ الإصدار',url:'رابط التحقق (اختياري)',level:'مستوى الكفاءة (تقدير يدوي)',notes:'ملاحظات',verified:'تم التحقق من الوثيقة',unrated:'لم يقيّم',notice:'لا تصنف أي كفاءة أو شهادة على أنها موثقة تلقائيًا.',loading:'جارٍ تحميل السجلات...',empty:'لا توجد سجلات بعد.',error:'تعذّر الوصول إلى السجلات. تأكد من إنشاء جدول professional_records وسياسات RLS.',auth:'يجب تسجيل الدخول لحفظ البيانات.', search:'ابحث في السجلات...', edit:'تعديل',deleteConfirm:'هل تريد حذف هذا السجل؟',private:'خاصة بحسابك',needTitle:'اكتب العنوان على الأقل.',badUrl:'يجب أن يبدأ رابط التحقق بـ https://',noAutomatic:'لا تُملأ مستويات الكفاءات تلقائيًا من أسماء المهندسين في الملف.'},
 en: {heading:'Professional Portfolio',intro:'Competency headings come from the Excel template only. Enter proficiency and evidence after checking.',competency:'Competency Matrix',certificate:'Certificates & CPD',award:'Awards & Recognition',add:'Add record',save:'Save',cancel:'Cancel',remove:'Delete',titleAr:'Arabic title',titleEn:'English title',issuer:'Issuer / Source',date:'Issue date',url:'Verification URL (optional)',level:'Proficiency (manual assessment)',notes:'Notes',verified:'Document independently checked',unrated:'Not assessed',notice:'No competency or certificate is automatically considered verified.',loading:'Loading records...',empty:'No records yet.',error:'Unable to access records. Check professional_records table and RLS.',auth:'Sign in to save records.',search:'Search records...',edit:'Edit',deleteConfirm:'Delete this record?',private:'Private to your account',needTitle:'Enter at least one title.',badUrl:'Verification URL must start with https://',noAutomatic:'No proficiency levels are inferred from colleague names in the workbook.'}
};
const categories: Kind[] = ['competency','certificate','award'];

export default function ProfessionalPortfolio({lang = 'ar'}: {lang?: Lang}) {
  const t=txt[lang];
  const [kind,setKind]=useState<Kind>('competency');
  const [docMode,setDocMode]=useState(false);
  const [records,setRecords]=useState<PortfolioRecord[]>([]);
  const [draft,setDraft]=useState<Draft|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  useEffect(()=>{let active=true;(async()=>{
    if(!supabase){setError(t.auth);setLoading(false);return;}
    const {data,error}=await supabase.from('professional_records').select('*').order('title_en');
    if(active){if(error)setError(error.message);else setRecords((data||[]) as PortfolioRecord[]);setLoading(false)}
  })();return()=>{active=false}},[]);
  const shown=useMemo(()=>records.filter(r=>r.kind===kind && [r.title_ar,r.title_en,r.issuer,r.notes].join(' ').toLowerCase().includes(search.toLowerCase())),[records,kind,search]);
  const savedSkills = new Map(records.filter(r=>r.kind==='competency').map(r=>[r.title_en,r]));
  async function persist(){
    if(!draft||busy||!supabase)return;
    if(!(draft.title_ar.trim()||draft.title_en.trim())){setError(t.needTitle);return;}
    if(draft.evidence_url.trim() && !/^https:\/\//i.test(draft.evidence_url.trim())){setError(t.badUrl);return;}
    setBusy(true);setError('');
    try{
      const {data:{user},error:authError}=await supabase.auth.getUser();
      if(authError||!user)throw new Error(t.auth);
      const payload={...draft,owner_id:user.id,issued_on:draft.issued_on||null};
      const {data,error}=await supabase.from('professional_records').upsert(payload).select().single();
      if(error)throw error;
      setRecords(old=>[...old.filter(x=>x.id!==data.id),data as PortfolioRecord]);setDraft(null);
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  async function remove(r:PortfolioRecord){
    if(!supabase||!confirm(t.deleteConfirm))return;
    setBusy(true);setError('');
    const {error}=await supabase.from('professional_records').delete().eq('id',r.id);
    if(error)setError(error.message);else setRecords(old=>old.filter(x=>x.id!==r.id));
    setBusy(false);
  }
  const levels: Level[]=['','Basic','Intermediate','Advanced','Expert'];
  return <section className="portfolio" dir={lang==='ar'?'rtl':'ltr'}>
    <header className="portfolio-heading"><div><h2>{t.heading}</h2><p>{t.intro}</p></div><span className="portfolio-chip">🔒 {t.private}</span></header>
    <div className="portfolio-tabs"><button className={docMode?'active':''} onClick={()=>setDocMode(true)}>{lang==='ar'?'السيرة الذاتية والبورتفوليو':'CV & Portfolio'}</button>{categories.map(k=><button key={k} className={kind===k?'active':''} onClick={()=>{setDocMode(false);setKind(k);setDraft(null)}}>{t[k]}</button>)}</div>
    {docMode?<CareerDocuments lang={lang}/>:<>
    {error&&<p className="portfolio-error" role="alert">{error}</p>}
    {loading?<p>{t.loading}</p>:<>
      <div className="portfolio-toolbar"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} aria-label={t.search}/><button className="portfolio-main-button" onClick={()=>setDraft(blank(kind))}>+ {t.add}</button></div>
      {kind==='competency'&&<p className="portfolio-notice">{t.noAutomatic}</p>}
      <div className="portfolio-table-wrap"><table className="portfolio-table"><thead><tr><th>#</th><th>{lang==='ar'?t.titleAr:t.titleEn}</th><th>{kind==='competency'?t.level:t.issuer}</th><th>{kind==='competency'?t.issuer:t.date}</th><th>{t.verified}</th><th/></tr></thead><tbody>
      {(kind==='competency'?skills.filter(s=>[s.en,s.ar].join(' ').toLowerCase().includes(search.toLowerCase())).map((s,i)=>({row:savedSkills.get(s.en),name:lang==='ar'?s.ar:s.en,index:i+1,template:s})):shown.map((r,i)=>({row:r,name:lang==='ar'?(r.title_ar||r.title_en):(r.title_en||r.title_ar),index:i+1,template:null}))).map(item=><tr key={item.template?.en??item.row!.id}><td>{item.index}</td><td>{item.name}</td><td>{kind==='competency'?item.row?.level||t.unrated:item.row?.issuer||'—'}</td><td>{kind==='competency'?item.row?.issuer||'—':item.row?.issued_on||'—'}</td><td>{item.row?.verified?'✓':'—'}</td><td><button onClick={()=>setDraft(item.row?{...item.row}:{...blank('competency'),title_en:item.template!.en,title_ar:item.template!.ar})}>{t.edit}</button>{item.row&&<button onClick={()=>remove(item.row!)} disabled={busy}>{t.remove}</button>}</td></tr>)}</tbody></table></div>
      {kind!=='competency'&&!shown.length&&<p>{t.empty}</p>}
    </>}
    {draft&&<div className="portfolio-dialog-backdrop" role="presentation"><div className="portfolio-dialog" role="dialog" aria-modal="true" aria-label={t.add}><h3>{t[draft.kind]} — {t.add}</h3><div className="portfolio-fields">
      <label>{t.titleAr}<input dir="rtl" value={draft.title_ar} onChange={e=>setDraft({...draft,title_ar:e.target.value})}/></label>
      <label>{t.titleEn}<input dir="ltr" value={draft.title_en} onChange={e=>setDraft({...draft,title_en:e.target.value})}/></label>
      <label>{t.issuer}<input value={draft.issuer} onChange={e=>setDraft({...draft,issuer:e.target.value})}/></label>
      {draft.kind==='competency'?<label>{t.level}<select value={draft.level} onChange={e=>setDraft({...draft,level:e.target.value as Level})}>{levels.map(v=><option key={v} value={v}>{v||t.unrated}</option>)}</select></label>:<label>{t.date}<input type="date" value={draft.issued_on||''} onChange={e=>setDraft({...draft,issued_on:e.target.value||null})}/></label>}
      <label>{t.url}<input dir="ltr" value={draft.evidence_url} onChange={e=>setDraft({...draft,evidence_url:e.target.value})}/></label>
      <label className="portfolio-full">{t.notes}<textarea rows={3} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>
      <label className="portfolio-check"><input type="checkbox" checked={draft.verified} onChange={e=>setDraft({...draft,verified:e.target.checked})}/>{t.verified}</label>
      </div><p className="portfolio-notice">{t.notice}</p><footer><button onClick={()=>setDraft(null)}>{t.cancel}</button><button className="portfolio-main-button" disabled={busy} onClick={persist}>{busy?'…':t.save}</button></footer></div></div>}
    </>}
  </section>
}
