import type { APIRoute } from 'astro';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';

export const prerender = false;

// This repository is public. Never commit the dashboard's member data or photos.
// Production-only, build-scoped secret values are substituted into this SERVER
// endpoint. Keep Netlify team-login protection enabled for ALL deployments.
const parts = [
  import.meta.env.FBC_CC_V23_00,
  import.meta.env.FBC_CC_V23_01,
  import.meta.env.FBC_CC_V23_02,
  import.meta.env.FBC_CC_V23_03,
  import.meta.env.FBC_CC_V23_04,
  import.meta.env.FBC_CC_V23_05,
  import.meta.env.FBC_CC_V23_06,
  import.meta.env.FBC_CC_V23_07,
];
const expectedDigest = '830ba28b2cfd1773435e45f3d12301a750a60203de23adc5ecdad5a78e962414';
let verifiedHtml: string | undefined;

function loadDashboard(): string {
  if (verifiedHtml !== undefined) return verifiedHtml;
  if (parts.some(part => typeof part !== 'string' || part.length !== 13060)) {
    throw new Error('Private dashboard package is incomplete');
  }
  const encoded = parts.join('');
  if (encoded.length !== 104480 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error('Invalid private dashboard package');
  }
  const bytes = brotliDecompressSync(Buffer.from(encoded, 'base64'), { maxOutputLength: 400000 });
  if (bytes.length !== 358082 || createHash('sha256').update(bytes).digest('hex') !== expectedDigest) {
    throw new Error('Private dashboard integrity check failed');
  }
  verifiedHtml = bytes.toString('utf8');
  return verifiedHtml;
}

const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'private, no-store, max-age=0',
  'Netlify-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-FBC-Version': '2.3',
};

export const GET: APIRoute = () => {
  try {
    return new Response(loadDashboard(), { status: 200, headers });
  } catch {
    // Fail closed. Do not log, interpolate, or return any secret package value.
    return new Response(
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FBC Command Center</title><body style="font-family:system-ui;max-width:560px;margin:60px auto;padding:24px"><h1>FBC Command Center</h1><p>The private dashboard package is not available in this deployment. Your saved records have not been changed.</p><p>Keep this site private and check the production build configuration before continuing.</p></body></html>',
      { status: 503, headers: { ...headers, 'Retry-After': '60' } },
    );
  }
};
