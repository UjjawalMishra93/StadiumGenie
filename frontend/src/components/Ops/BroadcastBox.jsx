import React, { useState } from 'react';
import { Send, Radio } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const LANGUAGES = ['en', 'es', 'fr', 'ar'];
const LANG_NAMES = { en: '🇺🇸 English', es: '🇪🇸 Spanish', fr: '🇫🇷 French', ar: '🇸🇦 Arabic' };

export default function BroadcastBox() {
  const [message, setMessage] = useState('');
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLangs, setSelectedLangs] = useState(['en', 'es', 'fr', 'ar']);

  const handleGenerate = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    setTranslations(null);
    try {
      const res = await fetch(`${API_BASE}/api/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), languages: selectedLangs }),
      });
      if (!res.ok) throw new Error('Broadcast generation failed');
      const data = await res.json();
      setTranslations(data.translations);
    } catch {
      setError('Could not generate broadcast. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = (lang) => {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Radio size={18} className="text-brand-red" aria-hidden="true" />
        <h3 className="font-bold text-lg">Broadcast Announcement</h3>
      </div>

      <div>
        <label htmlFor="broadcast-message" className="block text-sm font-medium text-brand-muted mb-1.5">
          Staff message (English)
        </label>
        <textarea
          id="broadcast-message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder='e.g. "Zone 3 is at capacity — please use Gate D instead"'
          rows={3}
          className="input-field resize-none"
        />
      </div>

      {/* Language selection */}
      <div>
        <p className="text-sm font-medium text-brand-muted mb-2">Translate into:</p>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLang(lang)}
              aria-pressed={selectedLangs.includes(lang)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                selectedLangs.includes(lang)
                  ? 'border-brand-gold text-brand-gold bg-brand-gold/10'
                  : 'border-brand-border text-brand-muted hover:border-brand-muted'
              }`}
            >
              {LANG_NAMES[lang]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}

      <button
        id="generate-broadcast-btn"
        onClick={handleGenerate}
        disabled={loading || !message.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        aria-label="Generate multilingual broadcast"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />Generating…</>
          : <><Send size={16} aria-hidden="true" />Generate Broadcast</>
        }
      </button>

      {/* Translation results */}
      {translations && (
        <div className="space-y-2 animate-fade-in" aria-live="polite" aria-label="Generated translations">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Generated Translations</p>
          {Object.entries(translations).map(([lang, text]) => (
            <div key={lang} className="bg-brand-border rounded-xl px-4 py-3">
              <p className="text-xs text-brand-muted mb-1">{LANG_NAMES[lang] || lang}</p>
              <p className="text-sm text-white leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
