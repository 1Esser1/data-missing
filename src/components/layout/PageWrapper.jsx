import { useState } from 'react';
import { Search } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import SkeletonText, { TranslationProgressBar } from '../ui/SkeletonText';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
];

function SearchTrigger({ theme }) {
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
        border: `1.5px solid ${theme.borderMed}`,
        borderRadius: '0.45rem',
        backgroundColor: hovered ? theme.hoverBg : theme.cardBg,
        color: theme.textMuted,
        fontSize: '0.75rem', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <Search size={14} />
      <span>Search</span>
      <kbd style={{
        fontSize: '0.65rem', color: theme.textMuted,
        backgroundColor: theme.tagBg, border: `1px solid ${theme.borderMed}`,
        borderRadius: '3px', padding: '0.05rem 0.3rem',
      }}>
        Ctrl K
      </kbd>
    </button>
  );
}

function PageWrapper({ children, title, subtitle }) {
  const { isRTL, language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      backgroundColor: theme.pageBg,
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
            backgroundColor: theme.headerBg,
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: isRTL ? 'right' : 'left',
          }}>
            <div>
              <h1 style={{
                fontSize: '1.1rem', fontWeight: '700',
                color: theme.text,
                marginBottom: subtitle ? '0.15rem' : 0,
              }}>
                <SkeletonText width={140} height="1.1rem">{title}</SkeletonText>
              </h1>
              {subtitle && (
                <p style={{ fontSize: '0.8rem', color: theme.textMuted }}>
                  <SkeletonText width={220} height="0.8rem">{subtitle}</SkeletonText>
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <SearchTrigger theme={theme} />
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '0.35rem',
                      border: language === lang.code ? '1.5px solid #CC2027' : `1.5px solid ${theme.borderMed}`,
                      backgroundColor: language === lang.code ? '#CC2027' : theme.cardBg,
                      color: language === lang.code ? 'white' : theme.textSub,
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
