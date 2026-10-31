import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type LangCode } from '@/i18n';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ?? SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code: LangCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem('familytree_language', code);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Dil / Language / Ýazyk"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 6 : 8,
          padding: compact ? '4px 8px' : '5px 12px',
          borderRadius: 6,
          border: '1px solid #2d303b',
          background: open ? '#22242d' : '#1a1c22',
          color: '#dedbd2',
          fontSize: 12.5,
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'background 0.12s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.04em',
          padding: '1px 5px',
          borderRadius: 4,
          background: '#252834',
          color: '#d4af37',
          border: '1px solid #3d4253',
          lineHeight: 1.3,
        }}>
          {current.badge}
        </span>
        {!compact && <span>{current.label}</span>}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: '#17181f',
          border: '1px solid #2d303b',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          zIndex: 9999,
          minWidth: 150,
        }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as LangCode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 12px',
                  border: 'none',
                  background: isActive ? 'rgba(197, 155, 39, 0.15)' : 'transparent',
                  color: isActive ? '#d4af37' : '#dedbd2',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#22242d'; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: isActive ? '#342918' : '#22242e',
                  color: isActive ? '#d4af37' : '#9ea0a8',
                  border: isActive ? '1px solid #6b521e' : '1px solid #333647',
                  minWidth: 26,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}>
                  {lang.badge}
                </span>
                <span>{lang.label}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.8, color: '#d4af37' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

