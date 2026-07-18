import { sanitizeString } from '../middleware/sanitize.js';

describe('sanitizeString', () => {
  it('should strip script tags and their content', () => {
    const input = 'Hello <script>alert("xss")</script> world';
    expect(sanitizeString(input)).not.toContain('<script>');
    expect(sanitizeString(input)).not.toContain('alert');
    expect(sanitizeString(input)).toContain('Hello');
  });

  it('should strip arbitrary HTML tags', () => {
    const input = '<b>Bold</b> and <em>italic</em>';
    const result = sanitizeString(input);
    expect(result).not.toContain('<b>');
    expect(result).not.toContain('<em>');
    expect(result).toContain('Bold');
    expect(result).toContain('italic');
  });

  it('should remove javascript: URI schemes', () => {
    const input = 'Click javascript:void(0)';
    expect(sanitizeString(input)).not.toContain('javascript:');
  });

  it('should truncate input exceeding MAX_INPUT_LENGTH (4000 chars)', () => {
    const longInput = 'a'.repeat(5000);
    expect(sanitizeString(longInput).length).toBeLessThanOrEqual(4000);
  });

  it('should preserve safe plain text unchanged', () => {
    const input = 'Where is Gate A?';
    expect(sanitizeString(input)).toBe('Where is Gate A?');
  });

  it('should handle empty string without error', () => {
    expect(sanitizeString('')).toBe('');
  });
});
