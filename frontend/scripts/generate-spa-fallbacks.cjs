const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('generate-spa-fallbacks: dist/index.html not found! Skipping.');
  process.exit(0);
}

const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// 1. Always generate 404.html (Crucial for Vercel, Netlify, GitHub Pages, Render static)
const fallback404 = path.join(distDir, '404.html');
fs.writeFileSync(fallback404, htmlContent);
console.log('✔ Created dist/404.html fallback for Vercel SPA routing');

// 2. Generate static directory fallbacks for all direct routes
const routes = [
  'catalog',
  'designs',
  'tracking',
  'wizard',
  'developers',
  'developers/login',
  'admin',
  'admin/login',
];

routes.forEach((route) => {
  const routeDir = path.join(distDir, route);
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  fs.writeFileSync(path.join(routeDir, 'index.html'), htmlContent);
  console.log(`✔ Created dist/${route}/index.html`);
});

console.log('All SPA fallbacks generated successfully!');
