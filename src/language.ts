export type Language = 'ar' | 'en';

export const translations = {
  ar: {
    login: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    welcome: 'مرحباً بعودتك',
    dashboard: 'لوحة التحكم',
    jobs: 'الوظائف',
    addJob: 'إضافة فرصة',
    masterCV: 'السيرة الذاتية الماستر',
    atsCV: 'السيرة الذاتية ATS',
    tailoredCV: 'سيرة مخصصة للوظيفة',
    portfolio: 'البورتفوليو',
    certificates: 'الشهادات',
    awards: 'التكريم',
    logout: 'تسجيل الخروج'
  },
  en: {
    login: 'Sign In',
    email: 'Email',
    password: 'Password',
    welcome: 'Welcome Back',
    dashboard: 'Dashboard',
    jobs: 'Jobs',
    addJob: 'Add Opportunity',
    masterCV: 'Master CV',
    atsCV: 'ATS Resume',
    tailoredCV: 'Tailored Resume',
    portfolio: 'Technical Portfolio',
    certificates: 'Certificates',
    awards: 'Awards',
    logout: 'Sign Out'
  }
};

export function getLanguage(): Language {
  try {
    return localStorage.getItem('masar_language') === 'en'
      ? 'en'
      : 'ar';
  } catch {
    return 'ar';
  }
}

export function setLanguage(lang: Language) {
  localStorage.setItem('masar_language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  window.dispatchEvent(new Event('masar-language-change'));
}

export function t(lang: Language, key: keyof typeof translations.ar) {
  return translations[lang][key];
}
