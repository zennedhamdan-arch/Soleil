import { describe, it, expect } from 'vitest';
import { sameOrigin, safeJson, dbMessage } from '../lib/http';
describe('HTTP security boundaries', () => {
  it('accepts same-origin requests behind a trusted preview proxy', () => {
    expect(
      sameOrigin(
        new Request('http://localhost:3000/api/enquiries', {
          headers: { host: '3000-preview.e2b.app', origin: 'https://3000-preview.e2b.app' },
        }),
      ),
    ).toBe(true);
  });
  it('accepts the forwarded host used by Vercel', () => {
    expect(
      sameOrigin(
        new Request('http://internal/api/admin', {
          headers: {
            host: 'internal',
            'x-forwarded-host': 'soleilgarden.example',
            origin: 'https://soleilgarden.example',
          },
        }),
      ),
    ).toBe(true);
  });
  it('rejects missing, malformed and foreign origins', () => {
    for (const origin of ['', 'null', 'invalid', 'https://evil.example'])
      expect(
        sameOrigin(new Request('https://soleilgarden.example/api/admin', { headers: { origin } })),
      ).toBe(false);
  });
  it('limits the request stream even without Content-Length', async () => {
    await expect(
      safeJson(
        new Request('https://site.example', {
          method: 'POST',
          body: JSON.stringify({ message: 'x'.repeat(21000) }),
        }),
      ),
    ).rejects.toThrow('PAYLOAD_TOO_LARGE');
  });
  it('parses a bounded request and never exposes raw database errors', async () => {
    expect(
      await safeJson(new Request('https://site.example', { method: 'POST', body: '{"a":1}' })),
    ).toEqual({ a: 1 });
    expect(dbMessage('internal password query stack trace')).toBe(
      'We could not save your changes. Please try again.',
    );
  });
});
