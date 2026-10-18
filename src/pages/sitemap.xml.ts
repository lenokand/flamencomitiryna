import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
 const base=import.meta.env.BASE_URL.replace(/\/$/, '');
 const urls=['','ru/'].map(p=>new URL(`${base}/${p}`,site).href);
 return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});
};
