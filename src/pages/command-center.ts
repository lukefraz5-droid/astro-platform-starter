import type { APIRoute } from 'astro';
import launcher from '../lib/fbc-main-launcher.html?raw';
export const prerender = false;
// No family records are committed or returned by this endpoint. The owner
// selects their existing FBC HTML file, which stays in the browser. Keep
// Netlify owner/team sign-in protection enabled for all deployments.
export const GET: APIRoute = () => new Response(launcher, {
  status: 200,
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0',
    'Netlify-CDN-Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-FBC-Version': '2.3-browser-private',
  },
});
