const fs = require('fs');
const path = require('path');
const errors = JSON.parse(fs.readFileSync(path.join(__dirname, '../master_errors.json'), 'utf8'));
const header = fs.readFileSync(path.join(__dirname, '../templates/header.html'), 'utf8');
const footer = fs.readFileSync(path.join(__dirname, '../templates/footer.html'), 'utf8');
const sidebar = fs.readFileSync(path.join(__dirname, '../templates/sidebar.html'), 'utf8');
const gaCode = fs.existsSync(path.join(__dirname, '../templates/ga.html')) ? fs.readFileSync(path.join(__dirname, '../templates/ga.html'), 'utf8') : '';
function escapeHtml(str) { return str ? str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])) : ''; }
function getBreadcrumbs(category, title) { return `<div class="text-xs mb-4"><a href="/">Home</a> / <a href="/tag/${category}">${category}</a> / ${escapeHtml(title)}</div>`; }
function getRelatedErrors(currentSlug, category) { const related = errors.filter(e => e.category === category && e.slug !== currentSlug).slice(0,3); if(related.length===0) return ''; return `<div><h3>Related Errors</h3><ul>${related.map(r => `<li><a href="/error/${r.slug}/">${escapeHtml(r.title)}</a></li>`).join('')}</ul></div>`; }
function buildHomePage(articles, page=1, perPage=12) { const start=(page-1)*perPage; const paginated=articles.slice(start, start+perPage); const cards=paginated.map(a=>`<div onclick="location.href='/error/${a.slug}/'"><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.description?.substring(0,100))}</p></div>`).join(''); const totalPages=Math.ceil(articles.length/perPage); let pagination=''; for(let i=1;i<=totalPages;i++) pagination+=`<a href="${i===1?'/':`/page/${i}`}">${i}</a>`; return `<!DOCTYPE html><html><head><title>cylma</title>${gaCode}</head><body>${header}<main>${cards}<div>${pagination}</div></main>${footer}</body></html>`; }
function buildErrorPage(err) { return `<!DOCTYPE html><html><head><title>${escapeHtml(err.title)}</title>${gaCode}</head><body>${header}<main>${getBreadcrumbs(err.category, err.title)}<h1>${escapeHtml(err.title)}</h1><pre>${escapeHtml(err.rawLog||'')}</pre>${err.solution}${getRelatedErrors(err.slug, err.category)}</main>${sidebar}${footer}</body></html>`; }
function buildSitemap(articles) { return `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://cylma.com/</loc><priority>1.0</priority></url>${articles.map(a=>`<url><loc>https://cylma.com/error/${a.slug}/</loc><priority>${a.category==='software'?'0.8':'0.7'}</priority></url>`).join('')}</urlset>`; }
const articles = errors.map(e => ({ ...e, slug: e.slug || e.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60) }));
const dist = path.join(__dirname, '../dist');
if(fs.existsSync(dist)) fs.rmSync(dist, {recursive:true});
fs.mkdirSync(dist); fs.mkdirSync(path.join(dist,'error')); fs.mkdirSync(path.join(dist,'tag'));
const totalPages = Math.ceil(articles.length/12);
for(let i=1;i<=totalPages;i++) { const html = buildHomePage(articles, i, 12); const dir = i===1 ? dist : path.join(dist,`page/${i}`); if(i!==1) fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'index.html'), html); }
for(const art of articles) { const dir = path.join(dist,'error',art.slug); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'index.html'), buildErrorPage(art)); }
fs.writeFileSync(path.join(dist,'sitemap.xml'), buildSitemap(articles));
fs.writeFileSync(path.join(dist,'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://cylma.com/sitemap.xml');
console.log(`Generated ${articles.length} error pages.`);
