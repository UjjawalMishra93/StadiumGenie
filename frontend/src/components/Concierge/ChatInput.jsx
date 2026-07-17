import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'auto'; // browser auto-detects

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 border-t border-brand-border" aria-label="Chat input">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            id="chat-input"
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask in any language… (Enter to send)"
            rows={1}
            disabled={disabled}
            className="input-field resize-none max-h-32 overflow-y-auto pr-10"
            style={{ minHeight: '44px' }}
            aria-label="Chat message"
            aria-disabled={disabled}
          />
        </div>

        {/* Voice input */}
        {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            aria-pressed={isListening}
            className={`p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold flex-shrink-0 ${
              isListening
                ? 'bg-brand-red text-white animate-pulse-slow'
                : 'bg-brand-border text-brand-muted hover:text-white'
            }`}
          >
            {isListening ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
          </button>
        )}

        {/* Send */}
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="Send message"
          className="btn-primary p-3 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled
            ? <span className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            : <Send size={18} aria-hidden="true" />
          }
        </button>
      </div>
    </form>
  );
}
