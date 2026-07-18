import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** Counter for generating unique per-session message IDs. */
let msgIdCounter = 0;

/**
 * Returns the next unique message ID string.
 * @returns {string}
 */
function nextMsgId() {
  return `msg_${Date.now()}_${msgIdCounter++}`;
}

/**
 * Custom hook for streaming chat with the StadiumGenie `/api/chat` endpoint via SSE.
 *
 * @param {object} [options={}]
 * @param {boolean} [options.accessibilityMode=false] - Whether to request simplified AI responses.
 * @returns {{
 *   messages: Array<{id: string, role: string, content: string, meta?: object, isError?: boolean}>,
 *   isStreaming: boolean,
 *   streamingText: string,
 *   sendMessage: (userText: string) => Promise<void>,
 *   clearMessages: () => void
 * }}
 */
export function useChat({ accessibilityMode = false } = {}) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isStreaming) return;

    const userMsg = { id: nextMsgId(), role: 'user', content: userText };
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
        // Send messages without the id field (backend doesn't need it)
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          accessibilityMode,
        }),
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
        id: nextMsgId(),
        role: 'assistant',
        content: fullText,
        meta,
      }]);
      setStreamingText('');
    } catch (err) {
      setMessages(prev => [...prev, {
        id: nextMsgId(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        isError: true,
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  }, [messages, isStreaming, accessibilityMode]);

  /** Resets the conversation to an empty state. */
  const clearMessages = () => setMessages([]);

  return { messages, isStreaming, streamingText, sendMessage, clearMessages };
}
