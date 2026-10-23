import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { handleChat } from '../../lib/chat';

export const prerender = false;
export const ALL: APIRoute = ({ request }) => handleChat(request, env);
