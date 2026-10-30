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
        title="Dil / Language / Язык"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 4 : 6,
          padding: compact ? '5px 8px' : '6px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)',
          background: open ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
          color: '#cbd5e1',
          fontSize: 13,
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>{current.flag}</span>
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
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
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
                  padding: '10px 14px',
                  border: 'none',
                  background: isActive ? 'rgba(56,189,248,0.12)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#cbd5e1',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 18 }}>{lang.flag}</span>
                <span>{lang.label}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

