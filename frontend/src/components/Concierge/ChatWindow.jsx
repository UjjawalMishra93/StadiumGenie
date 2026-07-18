import React, { useEffect, useRef } from 'react';
import { Volume2, Bot, User, Zap } from 'lucide-react';

// ─── Static Data ───────────────────────────────────────────────────────────────

/**
 * Suggested starter questions shown on the empty chat screen.
 * Covers navigation, sustainability, multilingual accessibility, and amenities pillars.
 */
const SUGGESTED_QUESTIONS = [
  { text: '🗺️ Where is Gate A and how crowded is it?',           desc: 'Grounds navigation & live density' },
  { text: '🚇 What is the most sustainable way to get home?',     desc: 'Eco-routing & CO₂ comparison' },
  { text: '♿ मुझे accessible restroom चाहिए',                   desc: 'Multilingual accessibility support' },
  { text: '🍔 Where is the nearest food court with vegan options?', desc: 'Stadium amenities' },
];

// ──────────────────────────────────────────────────────────────────────────────

/**
 * Speaks the given text aloud using the Web Speech API.
 * Cancels any currently playing speech before starting.
 *
 * @param {string} text - The text to synthesize.
 */
function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

/**
 * Escapes HTML special characters and applies minimal markdown-like formatting
 * (bold via `**text**`, newlines to `<br>`).
 * Safe to use with `dangerouslySetInnerHTML` since all tags are stripped first.
 *
 * @param {string} text - Raw AI response text.
 * @returns {string} HTML-safe formatted string.
 */
function escapeAndFormat(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/**
 * Renders a single chat message bubble with avatar, content, and action buttons.
 *
 * @param {{ message: object, isAccessibilityMode: boolean }} props
 */
function MessageBubble({ message, isAccessibilityMode }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}
      role="listitem"
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-brand-red' : 'bg-gradient-to-br from-blue-600 to-purple-600'
      }`} aria-hidden="true">
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-red text-white rounded-tr-sm'
            : message.isError
              ? 'bg-red-900/30 text-red-300 border border-red-800 rounded-tl-sm'
              : 'bg-brand-border text-white rounded-tl-sm'
        } ${isAccessibilityMode ? 'text-base' : ''}`}
          dangerouslySetInnerHTML={{
            __html: escapeAndFormat(message.content)
          }}
        />

        {/* AI message actions */}
        {!isUser && !message.isError && (
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => speakText(message.content)}
              className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-gold transition-colors focus:outline-none focus:ring-1 focus:ring-brand-gold rounded"
              aria-label="Read aloud"
              title="Read aloud"
            >
              <Volume2 size={13} aria-hidden="true" />
              <span>Listen</span>
            </button>
            {message.meta?.cached && (
              <span className="text-xs text-brand-muted flex items-center gap-1">
                <Zap size={11} aria-hidden="true" className="text-brand-gold" /> cached
              </span>
            )}
            {message.meta?.latencyMs && (
              <span className="text-xs text-brand-muted">{message.meta.latencyMs}ms</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Scrollable chat message list with streaming support and an empty-state welcome screen.
 *
 * @param {{
 *   messages: Array<{id: string, role: string, content: string, meta?: object, isError?: boolean}>,
 *   isStreaming: boolean,
 *   streamingText: string,
 *   isAccessibilityMode: boolean
 * }} props
 */
export default function ChatWindow({ messages, isStreaming, streamingText, isAccessibilityMode }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
      role="list"
      aria-label="Conversation"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.length === 0 && !isStreaming && (
        <div className="h-full flex flex-col items-center justify-center text-center py-6 animate-fade-in max-w-sm mx-auto">
          {/* FIFA WC2026 Branded Header */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-red to-brand-gold flex items-center justify-center mb-4 shadow-lg shadow-brand-red/10">
            <Bot size={28} aria-hidden="true" className="text-white" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold mb-1">
            FIFA World Cup 2026 · Host Venue
          </span>
          <h3 className="text-xl font-black mb-2 text-white">AT&T Stadium Concierge</h3>
          <p className="text-brand-muted text-sm max-w-xs mb-5">
            Welcome to the future of smart stadium assistants. Ask me anything in any language.
          </p>

          <div className="w-full space-y-2.5">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider text-left pl-1">Suggested Questions</p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {SUGGESTED_QUESTIONS.map(q => (
                <div
                  key={q.text}
                  className="text-xs text-left bg-brand-border/60 hover:bg-brand-border border border-brand-border/30 rounded-xl p-3 transition-all duration-200"
                >
                  <p className="font-semibold text-white">{q.text}</p>
                  <p className="text-[10px] text-brand-muted mt-0.5">{q.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Use stable message.id as key — avoids the index-as-key anti-pattern */}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} isAccessibilityMode={isAccessibilityMode} />
      ))}

      {/* Streaming placeholder */}
      {isStreaming && streamingText && (
        <div className="flex gap-3 animate-slide-up" role="status" aria-live="polite">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center" aria-hidden="true">
            <Bot size={14} />
          </div>
          <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-sm bg-brand-border text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: escapeAndFormat(streamingText)
            }}
          />
        </div>
      )}

      {isStreaming && !streamingText && (
        <div className="flex gap-3" role="status" aria-label="Generating response">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center" aria-hidden="true">
            <Bot size={14} />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-brand-border flex gap-1 items-center">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }} aria-hidden="true" />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
