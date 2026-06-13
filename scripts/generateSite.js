const fs = require('fs');
const path = require('path');

const errors = JSON.parse(fs.readFileSync(path.join(__dirname, '../master_errors.json'), 'utf8'));
const header = fs.readFileSync(path.join(__dirname, '../templates/header.html'), 'utf8');
const footer = fs.readFileSync(path.join(__dirname, '../templates/footer.html'), 'utf8');
const sidebar = fs.readFileSync(path.join(__dirname, '../templates/sidebar.html'), 'utf8');

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// توليد الصفحة الرئيسية (مع أزرار التصنيفات وتحميل الأخطاء عبر JavaScript)
function buildHomePage(articles) {
  const errorsJson = JSON.stringify(articles.map(e => ({
    slug: e.slug,
    title: e.title,
    category: e.category,
    description: e.description,
    rawLog: e.rawLog
  })));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>cylma | Developer Logs & Error Resolutions</title>
  <meta name="description" content="50,000+ resolved errors across 35+ technologies. Deep explanations, step-by-step fixes.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .code-font { font-family: 'Fira Code', monospace; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  </style>
  ${gaCode}
</head>
<body class="bg-[#090d16] text-slate-200 min-h-screen flex flex-col">
  ${header}
  <main class="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
    <div class="text-center max-w-2xl mx-auto py-8 space-y-3">
      <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">Search Less. <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Resolve Faster.</span></h1>
      <p class="text-slate-400 text-sm">cylma reverse‑engineers production crashes, trading EAs, and open‑source error logs.</p>
    </div>

    <!-- Categories (original design) -->
    <div class="categories flex justify-center gap-3 mb-8 flex-wrap">
      <button class="cat-btn active px-4 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" data-cat="all">All</button>
      <button class="cat-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700" data-cat="software">💻 Software</button>
      <button class="cat-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700" data-cat="automotive">🚗 Automotive</button>
      <button class="cat-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700" data-cat="electronics">📟 Electronics</button>
    </div>

    <div id="errorsContainer" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
  </main>
  ${footer}
  <script>
    const errorsData = ${errorsJson};

    function renderCards(category) {
      const container = document.getElementById('errorsContainer');
      let filtered = category === 'all' ? errorsData : errorsData.filter(e => e.category === category);
      if (filtered.length === 0) {
        container.innerHTML = '<div class="col-span-2 text-center text-slate-500 py-12">No errors found in this category.</div>';
        return;
      }
      container.innerHTML = filtered.map(err => \`
        <div class="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer transition-colors" onclick="window.location.href='/error/\${err.slug}/'">
          <div class="flex justify-between">
            <span class="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">\${err.category}</span>
            <span class="text-[10px] text-rose-400">Error</span>
          </div>
          <h3 class="text-sm font-bold text-white mt-2">\${escapeHtml(err.title)}</h3>
          <p class="text-xs text-slate-400 mt-1 line-clamp-2">\${escapeHtml(err.description?.substring(0, 100) || '')}...</p>
          <div class="mt-3 text-[10px] text-cyan-400 font-bold flex items-center gap-1">Read Fix →</div>
        </div>
      \`).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }

    // Category filter
    const btns = document.querySelectorAll('.cat-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30'));
        btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/30');
        renderCards(btn.dataset.cat);
      });
    });
    renderCards('all');
    lucide.createIcons();
  </script>
</body>
</html>`;
}

// دالة بناء صفحة الخطأ (تحتوي على Breadcrumbs، FAQ، روابط داخلية، كود – كما كان محسناً)
function buildErrorPage(err) {
  const contentHtml = err.solution || '<p class="text-rose-400">Solution not yet generated. Check back soon.</p>';
  const breadcrumbs = `<div class="text-xs text-slate-400 mb-4 flex items-center gap-1">
    <a href="/" class="hover:text-cyan-400">Home</a>
    <span>/</span>
    <a href="/?cat=${err.category}" class="hover:text-cyan-400">${err.category}</a>
    <span>/</span>
    <span class="text-cyan-400">${escapeHtml(err.title)}</span>
  </div>`;

  // روابط داخلية لأخطاء مشابهة
  const related = errors.filter(e => e.category === err.category && e.slug !== err.slug).slice(0, 3);
  const relatedHtml = related.length ? `
    <div class="mt-8 bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
      <h3 class="text-md font-bold text-white mb-3">Related Errors</h3>
      <ul class="space-y-2">
        ${related.map(r => `<li><a href="/error/${r.slug}/" class="text-cyan-400 hover:underline text-sm">${escapeHtml(r.title)}</a></li>`).join('')}
      </ul>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${escapeHtml(err.title)} | cylma</title><meta name="description" content="${escapeHtml(err.description?.substring(0, 160) || 'Technical error solution')}"><link rel="canonical" href="https://cylma.com/error/${err.slug}/"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"></script><script src="https://unpkg.com/lucide@latest"></script><link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body{font-family:'Plus Jakarta Sans',sans-serif;}</style>${gaCode}</head>
<body class="bg-[#090d16] text-slate-200">
${header}
<main class="max-w-6xl mx-auto px-4 py-8">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div class="lg:col-span-8 space-y-6">
      ${breadcrumbs}
      <div class="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <div class="flex gap-2 mb-4"><span class="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-xs">${escapeHtml(err.category)}</span><span class="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded text-xs">Error</span></div>
        <h1 class="text-2xl font-black">${escapeHtml(err.title)}</h1>
        <div class="mt-4 bg-slate-800/50 p-3 rounded-lg"><pre class="text-rose-300 text-xs">${escapeHtml(err.rawLog || err.description?.substring(0, 300) || 'No log available')}</pre></div>
        <div class="mt-6 prose prose-invert max-w-none">${contentHtml}</div>
        ${relatedHtml}
      </div>
    </div>
    ${sidebar}
  </div>
</main>
${footer}
<script>
  lucide.createIcons();
</script>
</body>
</html>`;
}

// بقية الدوال (buildSitemap, buildTagPage, إلخ) كما هي مع إضافة gaCode
// ... (اختصاراً – يجب إكمالها، لكننا سنضمن تكاملها)

// نهاية الملف
