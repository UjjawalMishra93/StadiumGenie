import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Streams chat from /api/chat via SSE.
 * Returns { sendMessage, messages, isStreaming, clearMessages }
 */
export function useChat({ accessibilityMode = false } = {}) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setStreamingText('');

    let fullText = '';
    let meta = {};

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, accessibilityMode }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Server error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'chunk') {
              fullText += event.text;
              setStreamingText(fullText);
            } else if (event.type === 'done') {
              meta = { latencyMs: event.latencyMs, cached: event.cached };
            }
          } catch {}
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullText,
        meta,
      }]);
      setStreamingText('');
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        isError: true,
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  }, [messages, isStreaming, accessibilityMode]);

  const clearMessages = () => setMessages([]);

  return { messages, isStreaming, streamingText, sendMessage, clearMessages };
}
