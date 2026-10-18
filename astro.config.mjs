import { defineConfig } from 'astro/config';
const repository = process.env.GITHUB_REPOSITORY;
const owner = repository?.split('/')[0];
const repo = repository?.split('/')[1];
export default defineConfig({
  output: 'static',
  vite: { ssr: { optimizeDeps: { include: ['picomatch', 'yaml'] } } },
  site: process.env.SITE_URL || (owner ? `https://${owner}.github.io` : 'https://example.com'),
  base: process.env.BASE_PATH || (repo && repo !== `${owner}.github.io` ? `/${repo}` : '/'),
  trailingSlash: 'always',
});



