import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarClock,
  SlidersHorizontal,
  MessageSquareText,
  ShieldCheck,
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
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
    stats: [
      { label: 'إجمالي الفرص', hint: 'كل الفرص في مكان واحد', tone: 'teal' },
      { label: 'طلبات نشطة', hint: 'خطوات المتابعة أقرب', tone: 'blue' },
      { label: 'تحتاج إلى متابعة', hint: 'إجراءات مستحقة هذا الأسبوع', tone: 'amber' },
      { label: 'ملاءمة مرتفعة', hint: 'فرص تطابق ملفك المهني', tone: 'emerald' }
    ],
    banner: {
      tag: 'بوصلة هذا الأسبوع',
      title: 'الفرصة الأقوى تبدأ بقرار أوضح.',
      desc: 'راجع الإعلانات الرسمية وارتباطها بأقوى المتطلبات بخبرتك، ثم حصّن رسالتك الفردية الآن.',
      action: 'افتح مراجعة الأسبوع'
    },
    quick: {
      title: 'على قائمة اهتمامك',
      follow: 'متابعات مستحقة',
      verify: 'تحديث التحقق من الإعلانات',
      profile: 'ملف مهني دقيق'
    },
    addBtn: '+ إضافة فرصة',
    retry: 'إعادة المحاولة'
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
    stats: [
      { label: 'Total Opportunities', hint: 'All opportunities in one place', tone: 'teal' },
      { label: 'Active Applications', hint: 'In-progress follow-ups', tone: 'blue' },
      { label: 'Follow-up Needed', hint: 'Actions due this week', tone: 'amber' },
      { label: 'High Match', hint: 'Strong profile alignment', tone: 'emerald' }
    ],
    banner: {
      tag: "This Week's Focus",
      title: 'The strongest opportunity begins with a clearer decision.',
      desc: 'Review official announcements, target key requirements with your fluids expertise, and sharpen your direct messaging.',
      action: 'Open Weekly Review'
    },
    quick: {
      title: 'On Your Radar',
      follow: 'Due Follow-ups',
      verify: 'Verification Updates',
      profile: 'Verified Engineering Profile'
    },
    addBtn: '+ Add Opportunity',
    retry: 'Retry'
  }
};

export default function Dashboard() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const t = translations[lang];

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

  const statVals = [jobs.length, active.length, due.length, eligibleList.length];

  return (
    <div dir={t.dir} className="shell">
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* شريط الرأس الأصلي مع زر تبديل اللغة */}
      <header className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="brand-logo" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            م
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>مسار | Masar</h1>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.userRole}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Globe size={16} />
            {t.toggleBtn}
          </button>
          <button type="button" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', background: '#047857', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            {t.addBtn}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* القائمة الجانبية الأصلية */}
        <aside className="sidebar">
          {t.tabs.map(item => {
            const Icon = item.icon;
            const isCur = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`tab-btn ${isCur ? 'active' : ''}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isCur ? '#ecfdf5' : 'transparent',
                  color: isCur ? '#065f46' : '#475569',
                  fontWeight: isCur ? 700 : 500,
                  cursor: 'pointer',
                  marginBottom: '4px'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* مساحة العمل الأصلية */}
        <main className="content" style={{ flex: 1, padding: '1.5rem' }}>
          {error && (
            <div className="alert-error" style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>{error}</span>
              <button onClick={load} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>{t.retry}</button>
            </div>
          )}

          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* صف البطاقات الأربع مع دعم الأرقام الثنائي */}
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {t.stats.map((s, idx) => (
                  <div key={idx} className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '14px' }}>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{s.label}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0.5rem 0' }}>
                      {formatNum(statVals[idx])}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{s.hint}</div>
                  </div>
                ))}
              </div>

              {/* بنر التركيز الأسبوعي */}
              <div className="action-banner" style={{ background: '#064e3b', color: '#fff', padding: '1.5rem', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ background: '#065f46', color: '#a7f3d0', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                    {t.banner.tag}
                  </span>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.15rem' }}>{t.banner.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#d1fae5' }}>{t.banner.desc}</p>
                </div>
                <button
                  onClick={() => setTab('weekly')}
                  style={{ background: '#fff', color: '#064e3b', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
                >
                  {t.banner.action}
                  {lang === 'ar' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </div>

              {/* قائمة الاهتمام السريع */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '14px' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700 }}>{t.quick.title}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid #f1f5f9' }}>
                    📌 {t.quick.follow} ({formatNum(due.length)})
                  </div>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid #f1f5f9' }}>
                    ⚡ {t.quick.verify}
                  </div>
                  <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid #f1f5f9' }}>
                    🛡️ {t.quick.profile}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab !== 'overview' && (
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '14px', textAlign: 'center', color: '#64748b' }}>
              {t.tabs.find(x => x.id === tab)?.label} - Under Review
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
