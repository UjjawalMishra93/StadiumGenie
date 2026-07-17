import React, { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  'Wheelchair Access',
  'Visual Impairment',
  'Hearing Impairment',
  'Mobility Assistance',
  'Medical Support',
  'Other',
];

export default function AssistRequestForm({ onSubmitted }) {
  const [form, setForm] = useState({ category: '', description: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.location) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError('Could not submit. Please ask a nearby staff member.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="card p-5 animate-fade-in" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold">Request Submitted!</p>
            <p className="text-sm text-brand-muted">A staff member is being notified. We'll come to you.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4 animate-fade-in" aria-label="Assistance request form">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <AlertCircle size={20} className="text-brand-gold" aria-hidden="true" />
        Request Assistance
      </h3>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2" role="alert">{error}</p>
      )}

      <div>
        <label htmlFor="assist-category" className="block text-sm font-medium text-brand-muted mb-1.5">Type of assistance</label>
        <select
          id="assist-category"
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="input-field"
          required
        >
          <option value="">Select category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="assist-location" className="block text-sm font-medium text-brand-muted mb-1.5">Your current location</label>
        <input
          id="assist-location"
          type="text"
          placeholder="e.g. Section 114, Level 2, Gate A"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          className="input-field"
          required
        />
      </div>

      <div>
        <label htmlFor="assist-description" className="block text-sm font-medium text-brand-muted mb-1.5">Additional details</label>
        <textarea
          id="assist-description"
          placeholder="Briefly describe what you need…"
          rows={3}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="input-field resize-none"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
        {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
        {loading ? 'Submitting…' : 'Send Request'}
      </button>
    </form>
  );
}
