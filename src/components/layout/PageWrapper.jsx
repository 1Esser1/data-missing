import { useState } from 'react';
import { Search } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useLanguage } from '../../i18n/LanguageContext';
import SkeletonText, { TranslationProgressBar } from '../ui/SkeletonText';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
];

function SearchTrigger() {
  const [hovered, setHovered] = useState(false);

  function open() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  }

  return (
    <button
      onClick={open}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Search (Ctrl+K)"
      style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.35rem 0.75rem',
        border: '1.5px solid #E5E7EB',
        borderRadius: '0.45rem',
        backgroundColor: hovered ? '#F9FAFB' : 'white',
        color: '#9CA3AF',
        fontSize: '0.75rem', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <Search size={14} />
      <span>Search</span>
      <kbd style={{
        fontSize: '0.65rem', color: '#C4C4C4',
        backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
        borderRadius: '3px', padding: '0.05rem 0.3rem',
      }}>
        Ctrl K
      </kbd>
    </button>
  );
}

function PageWrapper({ children, title, subtitle }) {
  const { isRTL, language, setLanguage } = useLanguage();

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      backgroundColor: '#F8F9FB',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      <TranslationProgressBar />
      <Sidebar />
      <div style={{
        marginLeft: isRTL ? 0 : '240px',
        marginRight: isRTL ? '240px' : 0,
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {title && (
          <div style={{
            padding: '1.25rem 2rem',
            backgroundColor: 'white',
            borderBottom: '1px solid #F0F0F0',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: isRTL ? 'right' : 'left',
          }}>
            <div>
              <h1 style={{
                fontSize: '1.1rem', fontWeight: '700',
                color: '#111827',
                marginBottom: subtitle ? '0.15rem' : 0,
              }}>
                <SkeletonText width={140} height="1.1rem">{title}</SkeletonText>
              </h1>
              {subtitle && (
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                  <SkeletonText width={220} height="0.8rem">{subtitle}</SkeletonText>
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <SearchTrigger />
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '0.35rem',
                      border: language === lang.code ? '1.5px solid #CC2027' : '1.5px solid #E5E7EB',
                      backgroundColor: language === lang.code ? '#CC2027' : 'white',
                      color: language === lang.code ? 'white' : '#6B7280',
                      fontSize: '0.72rem', fontWeight: '700',
                      cursor: 'pointer', lineHeight: 1,
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <NotificationBell />
            </div>
          </div>
        )}
        <div style={{ padding: '1.5rem 2rem', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageWrapper;