import type { APIRoute } from 'astro';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
export const prerender = true;
const parts = [import.meta.env.FBC_CC_V23_00,import.meta.env.FBC_CC_V23_01,import.meta.env.FBC_CC_V23_02,import.meta.env.FBC_CC_V23_03,import.meta.env.FBC_CC_V23_04,import.meta.env.FBC_CC_V23_05,import.meta.env.FBC_CC_V23_06,import.meta.env.FBC_CC_V23_07];
const expected = '830ba28b2cfd1773435e45f3d12301a750a60203de23adc5ecdad5a78e962414';
export function packageStatus(): string {
  const missing = parts.map((p,i) => typeof p !== 'string' || !p.length ? i : -1).filter(i => i >= 0);
  if (missing.length) return 'missing-' + (missing.length === 8 ? 'all' : missing.join('-'));
  const incomplete = parts.map((p,i) => p.length !== 13060 ? i : -1).filter(i => i >= 0);
  if (incomplete.length) return 'incomplete-' + incomplete.join('-');
  try {
    const bytes = brotliDecompressSync(Buffer.from(parts.join(''), 'base64'), {maxOutputLength:400000});
    if (bytes.length !== 358082) return 'incorrect-length';
    if (createHash('sha256').update(bytes).digest('hex') !== expected) return 'incorrect-integrity';
    return 'verified-v23';
  } catch { return 'invalid-compression'; }
}
export const GET: APIRoute = () => Response.json({version:'2.3',status:packageStatus()});
