import type { APIRoute } from 'astro';
import { brotliDecompressSync } from 'node:zlib';
import { createHash } from 'node:crypto';
export const prerender = true;
const parts = [import.meta.env.FBC_CC_V23_00,import.meta.env.FBC_CC_V23_01,import.meta.env.FBC_CC_V23_02,import.meta.env.FBC_CC_V23_03,import.meta.env.FBC_CC_V23_04,import.meta.env.FBC_CC_V23_05,import.meta.env.FBC_CC_V23_06,import.meta.env.FBC_CC_V23_07];
const expected = '830ba28b2cfd1773435e45f3d12301a750a60203de23adc5ecdad5a78e962414';
export const GET: APIRoute = () => {
  const configured = parts.some(p => typeof p === 'string' && p.length > 0);
  if (!configured && process.env.CONTEXT !== 'production') return Response.json({version:'2.3',configured:false});
  if (parts.some(p => typeof p !== 'string' || p.length !== 13060)) throw new Error('FBC private package: missing or incomplete build settings. No private values logged.');
  let valid = false;
  try {
    const bytes = brotliDecompressSync(Buffer.from(parts.join(''), 'base64'), {maxOutputLength:400000});
    valid = bytes.length === 358082 && createHash('sha256').update(bytes).digest('hex') === expected;
  } catch { /* Never log secret data. */ }
  if (!valid) throw new Error('FBC private package integrity verification failed. No private values logged.');
  console.info('FBC v2.3 private package verified: complete and SHA-256 correct.');
  return Response.json({version:'2.3',configured:true,integrityVerified:true});
};
