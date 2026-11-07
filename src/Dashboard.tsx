import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarClock,
  MessageSquareText,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Upload,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe
} from 'lucide-react';
import { Job, emptyJob, roles, statuses, today, businessDate, followWindow, eligible, followDue } from './logic';
import { listJobs, saveJob, deleteJob, saveJobs } from './storage';
import { supabase } from './supabase';

const translations = {
  ar: {
    toggleBtn: 'English',
    dir: 'rtl',
    fmtLocale: 'ar-EG',
    userRole: 'مهندس سوائل الحفر',
    tabs: [
      { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
      { id: 'jobs', label: 'الفرص والتحديثات', icon: BriefcaseBusiness },
      { id: 'weekly', label: 'المتابعة الأسبوعية', icon: CalendarClock },
      { id: 'compare', label: 'مقارنة الفرص', icon: SlidersHorizontal },
      { id: 'messages', label: 'مساعد الرسائل', icon: MessageSquareText },
      { id: 'profile', label: 'الملف المهني', icon: ShieldCheck }
    ],
    stats: {
      total: { label: 'إجمالي الفرص', hint: 'كل الفرص في مكان واحد' },
      active: { label: 'طلبات نشطة', hint: 'خطوات المتابعة أقرب' },
      due: { label: 'تحتاج إلى متابعة', hint: 'إجراءات مستحقة هذا الأسبوع' },
      match: { label: 'ملاءمة مرتفعة', hint: 'فرص تطابق ملفك المهني' }
    },
    banner: {
      tag: 'بوصلة هذا الأسبوع',
      title: 'الفرصة الأقوى تبدأ بقرار أوضح.',
      desc: 'راجع الإعلانات الرسمية وارتباطها بأقوى المتطلبات بخبرتك، ثم حصّن رسالتك الفردية الآن.',
      action: 'افتح مراجعة الأسبوع'
    },
    quickList: {
      title: 'على قائمة اهتمامك',
      followUp: 'متابعات مستحقة',
      verify: 'تحديث التحقق من الإعلانات',
      profile: 'ملف مهني دقيق'
    },
    addBtn: '+ إضافة فرصة',
    loading: 'جاري تحميل البيانات...',
    noJobs: 'لا توجد فرص مسجلة حالياً.'
  },
  en: {
    toggleBtn: 'العربية',
    dir: 'ltr',
    fmtLocale: 'en-US',
    userRole: 'Fluids Specialist',
    tabs: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'jobs', label: 'Opportunities & Updates', icon: BriefcaseBusiness },
      { id: 'weekly', label: 'Weekly Follow-up', icon: CalendarClock },
      { id: 'compare', label: 'Compare Offers', icon: SlidersHorizontal },
      { id: 'messages', label: 'Message Assistant', icon: MessageSquareText },
      { id: 'profile', label: 'Professional Profile', icon: ShieldCheck }
    ],
    stats: {
      total: { label: 'Total Opportunities', hint: 'All opportunities in one place' },
      active: { label: 'Active Applications', hint: 'In-progress follow-ups' },
      due: { label: 'Requires Follow-up', hint: 'Actions due this week' },
      match: { label: 'High Match', hint: 'Strong profile alignment' }
    },
    banner: {
      tag: "This Week's Focus",
      title: 'The strongest opportunity begins with a clearer decision.',
      desc: 'Review official announcements, target key requirements with your fluids expertise, and sharpen your direct messaging.',
      action: 'Open Weekly Review'
    },
    quickList: {
      title: 'On Your Radar',
      followUp: 'Due Follow-ups',
      verify: 'Verification Updates',
      profile: 'Verified Engineering Profile'
    },
    addBtn: '+ Add Opportunity',
    loading: 'Loading data...',
    noJobs: 'No opportunities recorded yet.'
  }
};

const safeUrl = (s: string) => {
  try {
    const u = new URL(s);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
};

const initials = (s: string) =>
  s
    .split(' ')
    .map(x => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function Dashboard() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = translations[lang];

  const fmt = (s: string) =>
    new Date(s + 'T12:00:00').toLocaleDateString(t.fmtLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

  // دالة تحويل وعرض الأرقام طبقاً للغة المختارة
  const formatNum = (val: number) => new Intl.NumberFormat(t.fmtLocale).format(val);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('overview');

  async function load() {
    setError('');
    try {
      const records = await listJobs();
      setJobs(records);
      setLoaded(true);
    } catch (e) {
      setLoaded(false);
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (toast) {
      const tId = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(tId);
    }
  }, [toast]);

  const active = jobs.filter(j => ['معروض', 'مؤهل', 'applied', 'qualified'].includes(j.status));
  const due = jobs.filter(j => followDue(j));
  const eligibleList = jobs.filter(j => eligible(j));

  const statCards = [
    { label: t.stats.total.label, val: formatNum(jobs.length), hint: t.stats.total.hint, tone: 'teal' },
    { label: t.stats.active.label, val: formatNum(active.length), hint: t.stats.active.hint, tone: 'blue' },
    { label: t.stats.due.label, val: formatNum(due.length), hint: t.stats.due.hint, tone: 'amber' },
    { label: t.stats.match.label, val: formatNum(eligibleList.length), hint: t.stats.match.hint, tone: 'emerald' }
  ];

  return (
    <div dir={t.dir} className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans transition-all duration-300">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <Check size={18} /> <span>{toast}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            م
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight">مسار | Masar</h1>
            <p className="text-xs text-slate-500 font-medium">{t.userRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* زر تبديل اللغة المزدوج */}
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-xs text-slate-700 transition"
          >
            <Globe size={15} />
            <span>{t.toggleBtn}</span>
          </button>

          <button
            type="button"
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus size={16} />
            <span>{t.addBtn}</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-white border-e border-slate-200 p-4 flex flex-col gap-1">
          {t.tabs.map(item => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition ${
                  active ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={17} className={active ? 'text-emerald-700' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content View */}
        <main className="flex-1 p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex justify-between items-center">
              <span>{error}</span>
              <button onClick={load} className="underline font-bold">إعادة المحاولة / Retry</button>
            </div>
          )}

          {tab === 'overview' && (
            <>
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statCards.map((c, i) => (
                  <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                    <span className="text-xs text-slate-500 font-medium">{c.label}</span>
                    <span className="text-3xl font-black text-slate-800 my-2">{c.val}</span>
                    <span className="text-[11px] text-slate-400">{c.hint}</span>
                  </div>
                ))}
              </div>

              {/* Action Banner */}
              <div className="bg-emerald-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="space-y-1 text-center md:text-start">
                  <span className="bg-emerald-800 text-emerald-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold">
                    {t.banner.tag}
                  </span>
                  <h3 className="text-lg font-bold">{t.banner.title}</h3>
                  <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">{t.banner.desc}</p>
                </div>
                <button
                  onClick={() => setTab('weekly')}
                  className="bg-white text-emerald-950 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-50 flex items-center gap-2 whitespace-nowrap shadow-sm transition"
                >
                  <span>{t.banner.action}</span>
                  {lang === 'ar' ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                </button>
              </div>

              {/* Radar Items Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-slate-800 mb-3">{t.quickList.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                    📌 {t.quickList.followUp} ({formatNum(due.length)})
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                    ⚡ {t.quickList.verify}
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-600">
                    🛡️ {t.quickList.profile}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab !== 'overview' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
              محتوى التبويب قيد المعاينة ({tab})
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
