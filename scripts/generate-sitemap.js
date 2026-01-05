import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSitemap() {
  console.log('Starting sitemap generation...');

  const baseUrl = 'https://forecastpit.com';
  const now = new Date().toISOString();

  // Static pages for ForecastPit
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/arena', priority: '0.9', changefreq: 'daily' },
    { path: '/seasons', priority: '0.8', changefreq: 'daily' },
    { path: '/markets', priority: '0.8', changefreq: 'daily' },
    { path: '/activity', priority: '0.8', changefreq: 'daily' },
    { path: '/experiment', priority: '0.7', changefreq: 'monthly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms', priority: '0.3', changefreq: 'yearly' },
  ];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  staticPages.forEach(page => {
    sitemap += `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  sitemap += `</urlset>
`;

  // Write sitemap to public folder
  const publicPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, sitemap, 'utf8');

  console.log('Sitemap generated successfully!');
  console.log(`Total URLs: ${staticPages.length}`);
  console.log(`Location: ${publicPath}`);
}

generateSitemap();
