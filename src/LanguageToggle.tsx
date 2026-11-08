import { useEffect, useState } from 'react';
import { getLanguage, setLanguage, Language } from './language';

export default function LanguageToggle() {
  const [lang, setLang] = useState<Language>(getLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir =
      lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  function toggle() {
    const next = lang === 'ar' ? 'en' : 'ar';
    setLanguage(next);
    setLang(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch language"
      style={{
        padding: '9px 16px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        background: '#176b5b',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 600
      }}
    >
      {lang === 'ar' ? 'English' : 'العربية'}
    </button>
  );
}
