const fs = require('fs');
const path = require('path');

const errors = JSON.parse(fs.readFileSync(path.join(__dirname, '../master_errors.json'), 'utf8'));

// ========== دوال مساعدة ==========
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== قوالب التصميم الجديد (مأخوذة من HTML الذي أرسلته) ==========
function getMainLayout(content, pageTitle, metaDesc, canonicalUrl) {
  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover">
    <title>${escapeHtml(pageTitle)} | cylma</title>
    <meta name="description" content="${escapeHtml(metaDesc)}">
    <link rel="canonical" href="https://cylma.com${canonicalUrl}">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap');
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .font-mono, code, pre, .code-font { font-family: 'Fira Code', 'JetBrains Mono', monospace; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f1219; }
        ::-webkit-scrollbar-thumb { background: #2a3441; border-radius: 6px; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    </style>
</head>
<body class="bg-[#0a0e17] text-gray-200 selection:bg-cyan-500/30 antialiased">
    <!-- Toast notification -->
    <div id="toast" class="fixed bottom-6 right-6 z-50 bg-cyan-600/90 backdrop-blur-md border border-cyan-400/40 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 transition-all duration-300 translate-y-20 opacity-0">
        <i data-lucide="clipboard-check" class="w-4 h-4"></i>
        <span id="toastMsg">Copied to clipboard</span>
    </div>

    <!-- Header (مطابق للتصميم الجديد) -->
    <header class="border-b border-slate-800/70 bg-[#0a0e17]/85 backdrop-blur-xl sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
            <a href="/" class="flex items-center gap-2.5 group transition-all">
                <div class="relative w-8 h-8">
                    <div class="absolute inset-0 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-full blur-md opacity-70 group-hover:opacity-100 transition"></div>
                    <div class="relative bg-[#0f1222] rounded-full w-full h-full flex items-center justify-center border border-white/10">
                        <span class="text-xl font-black tracking-tighter bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">c</span>
                    </div>
                </div>
                <span class="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-300 to-indigo-400 bg-clip-text text-transparent">cylma</span>
            </a>
            <div class="flex-1 max-w-md relative hidden sm:block">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"></i>
                <input type="text" id="globalSearchInput" placeholder="Search by error code, log snippet, or title..." class="w-full bg-slate-900/70 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 transition">
            </div>
            <div class="flex gap-1 text-xs">
                <a href="/privacy" class="px-2 py-1 text-slate-400 hover:text-cyan-300">Privacy</a>
                <a href="/terms" class="px-2 py-1 text-slate-400 hover:text-cyan-300">Terms</a>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        ${content}
    </main>

    <footer class="border-t border-slate-800/40 bg-[#070b12] mt-16 py-6 text-center text-[11px] text-slate-500">
        <div class="max-w-7xl mx-auto flex flex-wrap justify-center gap-6">
            <a href="/" class="hover:text-cyan-300">© 2026 cylma</a>
            <a href="/privacy" class="hover:text-cyan-300">Privacy</a>
            <a href="/terms" class="hover:text-cyan-300">Terms</a>
            <a href="/contact" class="hover:text-cyan-300">Contact</a>
        </div>
    </footer>

    <script>
        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toastMsg').innerText = msg;
            toast.classList.remove('translate-y-20', 'opacity-0');
            setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 2000);
        }
        function copyTextById(id) {
            const text = document.getElementById(id).innerText;
            navigator.clipboard.writeText(text);
            showToast('Copied to clipboard');
        }
        lucide.createIcons();
    </script>
</body>
</html>`;
}

// ========== الصفحة الرئيسية ==========
function buildHomePage(articles) {
  // تجميع التصنيفات
  const categoryMap = new Map();
  articles.forEach(err => {
    const cat = err.category || 'software';
    if (!categoryMap.has(cat)) categoryMap.set(cat, { name: cat, count: 0, icon: 'bug' });
    categoryMap.get(cat).count++;
  });
  const categoriesList = Array.from(categoryMap.entries()).map(([id, info]) => ({
    id, name: info.name, count: info.count, icon: info.icon || 'bug', color: 'cyan'
  })).slice(0, 12);

  const categoriesHtml = categoriesList.map(cat => `
    <div onclick="filterErrorsByCategory('${cat.id}')" class="snap-start flex-shrink-0 w-[120px] bg-slate-900/40 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-3 text-center cursor-pointer transition-all" data-cat="${cat.id}">
      <i data-lucide="${cat.icon}" class="w-5 h-5 mx-auto text-cyan-400 mb-2"></i>
      <div class="text-[11px] font-bold">${escapeHtml(cat.name)}</div>
      <div class="text-[9px] text-slate-500">${cat.count} fixes</div>
    </div>
  `).join('');

  const quickChips = categoriesList.slice(0, 6).map(cat => `
    <button onclick="filterErrorsByCategory('${cat.id}')" class="px-2.5 py-1 text-[10px] rounded-full bg-slate-800 text-slate-300 hover:bg-cyan-500/30 transition">${escapeHtml(cat.name)}</button>
  `).join('');

  const errorsJson = JSON.stringify(articles.map(e => ({
    hash: e.slug,
    technology: e.category,
    code: e.title.substring(0, 30),
    title: e.title,
    explanation: e.description || '',
    categoryId: e.category
  })));

  const content = `
    <div class="space-y-10">
      <div class="text-center max-w-2xl mx-auto space-y-3">
        <div class="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-[11px] font-mono text-cyan-300">${articles.length} RESOLVED ERRORS</div>
        <h1 class="text-4xl sm:text-5xl font-black tracking-tight text-white">Search less. <span class="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">Resolve faster.</span></h1>
        <p class="text-slate-400 text-sm max-w-lg mx-auto">Real logs, deep root-cause analysis, and battle-tested fixes from production crashes & trading EAs.</p>
      </div>

      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2"><i data-lucide="grid-3x3" class="w-3.5 h-3.5"></i> ALL TECHNOLOGIES</h2>
          <span class="text-[10px] text-slate-500 hidden sm:block">← scroll →</span>
        </div>
        <div id="categoriesScroll" class="flex overflow-x-auto pb-3 gap-3 scroll-smooth snap-x">${categoriesHtml}</div>
      </div>

      <div class="space-y-4">
        <div class="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800/60 pb-3">
          <div class="flex items-center gap-2"><i data-lucide="activity" class="w-5 h-5 text-cyan-400"></i><h2 class="text-lg font-bold text-white">Recently resolved crashes</h2></div>
          <div class="flex flex-wrap gap-2">
            <button id="filterAllBtn" onclick="filterErrorsByCategory('all')" class="px-3 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">All</button>
            <div id="filterQuickChips" class="flex gap-2 flex-wrap">${quickChips}</div>
          </div>
        </div>
        <div id="errorCardsGrid" class="grid grid-cols-1 md:grid-cols-2 gap-5"></div>
      </div>
    </div>
    <script>
      const errorsData = ${errorsJson};
      let currentFilter = 'all';

      function renderCards() {
        const container = document.getElementById('errorCardsGrid');
        let filtered = currentFilter === 'all' ? errorsData : errorsData.filter(e => e.categoryId === currentFilter);
        if (filtered.length === 0) { container.innerHTML = '<div class="col-span-2 text-center py-12 text-slate-400 text-sm">⚠️ No resolved errors in this category yet.</div>'; return; }
        container.innerHTML = filtered.map(err => \`
          <div onclick="window.location.href='/error/\${err.hash}/'" class="bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800 rounded-2xl p-5 transition-all cursor-pointer group">
            <div class="flex justify-between items-start"><span class="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">\${err.technology}</span><span class="text-[10px] font-mono text-rose-400/80">\${err.code}</span></div>
            <h3 class="text-md font-bold text-white mt-2 group-hover:text-cyan-300 transition">\${escapeHtml(err.title)}</h3>
            <p class="text-xs text-slate-400 mt-1 line-clamp-2">\${escapeHtml(err.explanation?.substring(0,110) || '')}...</p>
            <div class="mt-3 flex items-center gap-1 text-[11px] text-cyan-400"><i data-lucide="arrow-right-circle" class="w-3.5 h-3.5"></i><span>View diagnosis</span></div>
          </div>
        \`).join('');
        lucide.createIcons();
      }

      window.filterErrorsByCategory = (cat) => {
        currentFilter = cat;
        renderCards();
        document.querySelectorAll('#categoriesScroll > div').forEach(div => div.classList.remove('ring-2', 'ring-cyan-500'));
        const activeCat = document.querySelector(\`#categoriesScroll div[data-cat="\${cat}"]\`);
        if (activeCat) activeCat.classList.add('ring-2', 'ring-cyan-500');
        const allBtn = document.getElementById('filterAllBtn');
        if (cat === 'all') allBtn.classList.add('ring-2', 'ring-cyan-500');
        else allBtn.classList.remove('ring-2', 'ring-cyan-500');
      };
      function escapeHtml(str) { return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]); }
      renderCards();
      document.getElementById('globalSearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const term = e.target.value.trim().toLowerCase();
          const match = errorsData.find(err => err.title.toLowerCase().includes(term) || err.explanation?.toLowerCase().includes(term));
          if (match) window.location.href = '/error/' + match.hash;
          else showToast('No matching error');
          e.target.value = '';
        }
      });
    </script>
  `;
  return getMainLayout(content, 'cylma | Developer Logs & Error Resolutions', '52,000+ resolved errors across 40+ technologies', '/');
}

// ========== صفحة التفاصيل (خطأ فردي) ==========
function buildErrorPage(err) {
  const contentHtml = err.solution || '<p class="text-rose-400">Solution not yet generated.</p>';
  const stepsHtml = err.steps ? err.steps.map((step, i) => `
    <div class="flex gap-3"><div class="bg-slate-800 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-cyan-400">${i+1}</div><p class="text-slate-300 text-sm">${escapeHtml(step)}</p></div>
  `).join('') : '<p class="text-slate-300 text-sm">No steps yet.</p>';

  const content = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-8 space-y-6">
        <a href="/" class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"><i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Back to explorer</a>
        <div class="flex flex-wrap gap-2 items-center">
          <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">${escapeHtml(err.technology || err.category)}</span>
          <span class="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">${escapeHtml(err.code || 'ERROR')}</span>
          <span class="text-[10px] text-slate-500 ml-auto">✅ verified resolution</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-black text-white leading-tight">${escapeHtml(err.title)}</h1>
        <div class="bg-[#0c1022] border border-slate-800 rounded-2xl p-5 relative group">
          <div class="absolute top-3 right-3"><button onclick="copyTextById('detailRawLog')" class="p-1.5 bg-slate-800/70 rounded-lg hover:bg-slate-700 transition"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button></div>
          <p class="text-[10px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1"><span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> ORIGINAL LOG / STACK TRACE</p>
          <pre id="detailRawLog" class="text-xs code-font text-rose-300/90 whitespace-pre-wrap break-all font-mono">${escapeHtml(err.rawLog || err.description || 'No log')}</pre>
        </div>
        <div class="bg-slate-900/30 border border-slate-800/70 rounded-2xl p-6">
          <div class="flex items-center gap-2 text-white font-bold mb-3"><i data-lucide="help-circle" class="w-5 h-5 text-cyan-400"></i><h2>Root cause · Why does this happen?</h2></div>
          <p class="text-slate-300 text-sm leading-relaxed">${escapeHtml(err.explanation || 'No explanation.')}</p>
        </div>
        <div class="bg-slate-900/30 border border-slate-800/70 rounded-2xl p-6">
          <div class="flex items-center gap-2 text-white font-bold mb-4"><i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400"></i><h2>Step‑by‑step resolution</h2></div>
          <div id="detailSteps" class="space-y-4 text-sm text-slate-300">${stepsHtml}</div>
          <div class="mt-6 bg-[#0a0e18] rounded-xl overflow-hidden border border-slate-800">
            <div class="flex justify-between items-center bg-slate-900/70 px-4 py-2 border-b border-slate-800"><span class="text-[11px] font-mono text-slate-400">🔧 Fix / patch</span><button onclick="copyTextById('detailCodeSnippet')" class="text-[10px] text-cyan-400 hover:text-cyan-300">Copy code</button></div>
            <pre id="detailCodeSnippet" class="p-4 text-xs code-font text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">${escapeHtml(err.codeSnippet || '// No code')}</pre>
          </div>
        </div>
      </div>
      <aside class="lg:col-span-4 space-y-6">
        <div class="bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div class="absolute top-2 right-2 text-[9px] font-mono text-slate-500">Ad</div>
          <i data-lucide="shield-check" class="w-8 h-8 text-indigo-400 mb-2"></i>
          <h3 class="text-sm font-bold text-white">Prevent silent crashes</h3>
          <p class="text-xs text-slate-300 mt-1">Real‑time error intelligence · Memory & API failure detection. Free 14d trial.</p>
          <button onclick="showToast('🔧 Trial demo — contact cylma enterprise')" class="mt-4 w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 text-white text-xs font-bold py-2 rounded-xl transition">Try free →</button>
        </div>
        <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <p class="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1"><i data-lucide="book-open" class="w-3 h-3"></i> Impact metrics</p>
          <p class="text-lg font-black text-white mt-1">${Math.floor(Math.random()*10000)+50000}</p>
          <p class="text-xs text-slate-400">production errors dissected</p>
        </div>
      </aside>
    </div>
    <script>
      function copyTextById(id) {
        const text = document.getElementById(id).innerText;
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard');
      }
    </script>
  `;
  return getMainLayout(content, err.title, (err.explanation || '').substring(0, 160), `/error/${err.slug}`);
}

// ========== صفحات قانونية ==========
function buildLegalPage(title, contentBody, metaDesc) {
  const content = `<div class="max-w-3xl mx-auto bg-slate-900/30 border border-slate-800/60 rounded-2xl p-8 space-y-5"><h1 class="text-2xl font-black text-white">${escapeHtml(title)}</h1><div class="text-sm text-slate-300 space-y-4">${contentBody}</div></div>`;
  return getMainLayout(content, `${title} | cylma`, metaDesc, `/${title.toLowerCase().replace(/\s/g, '')}`);
}

// ========== Sitemap ==========
function buildSitemap(articles) {
  const urls = articles.map(a => `<url><loc>https://cylma.com/error/${a.slug}/</loc><lastmod>${new Date(a.updatedAt).toISOString().split('T')[0]}</lastmod><priority>0.8</priority></url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://cylma.com/</loc><priority>1.0</priority></url>${urls}</urlset>`;
}

// ========== تنفيذ البناء ==========
const articles = errors.map(e => ({
  slug: e.slug || e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
  title: e.title,
  category: e.category,
  description: e.description,
  solution: e.solution,
  codeSnippet: e.codeExample,
  rawLog: e.rawLog || e.description?.substring(0, 300),
  explanation: e.explanation || e.description,
  steps: e.steps || (e.solution ? e.solution.split(/\.\s+/) : []),
  technology: e.technology || (e.category === 'software' ? 'Software' : (e.category === 'automotive' ? 'Automotive' : 'Electronics')),
  code: e.code || 'ERROR',
  updatedAt: e.updatedAt || new Date().toISOString()
}));

const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true });
fs.mkdirSync(distDir);
fs.mkdirSync(path.join(distDir, 'error'));

fs.writeFileSync(path.join(distDir, 'index.html'), buildHomePage(articles));

for (const art of articles) {
  const dir = path.join(distDir, 'error', art.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), buildErrorPage(art));
}

const privacyBody = '<p>cylma respects your privacy. We do not collect personal data directly. We use Google AdSense for ads, which may use cookies for personalization.</p>';
fs.writeFileSync(path.join(distDir, 'privacy.html'), buildLegalPage('Privacy Policy', privacyBody, 'Privacy policy for cylma'));
const termsBody = '<p>All solutions are provided "as is". Use at your own risk. We are not liable for any damages.</p>';
fs.writeFileSync(path.join(distDir, 'terms.html'), buildLegalPage('Terms of Service', termsBody, 'Terms of service'));
const contactBody = '<p>Email: support@cylma.com</p><p>Advertising: ads@cylma.com</p>';
fs.writeFileSync(path.join(distDir, 'contact.html'), buildLegalPage('Contact', contactBody, 'Contact cylma'));

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), buildSitemap(articles));
fs.writeFileSync(path.join(distDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://cylma.com/sitemap.xml');

console.log(`✅ تم تحديث الموقع بالتصميم الجديد. ${articles.length} صفحة.`);
