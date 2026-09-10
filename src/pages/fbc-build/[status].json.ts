import type { APIRoute, GetStaticPaths } from 'astro';
import { packageStatus } from '../fbc-package-status.json';
export const prerender = true;
// The generated filename contains only a validation result, never member data,
// keys, package contents, or other sensitive values. It permits deploy checks
// while keeping the full website behind Netlify's owner/team login.
export const getStaticPaths: GetStaticPaths = () => [{ params: { status: packageStatus() } }];
export const GET: APIRoute = ({params}) => Response.json({version:'2.3',status:params.status});
