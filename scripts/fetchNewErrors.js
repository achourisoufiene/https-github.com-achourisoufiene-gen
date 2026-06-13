const fs = require('fs');
const path = require('path');
const AI_MODELS = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/qwen/qwen2.5-coder-32b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.3"
];
const GITHUB_QUERIES = [
  'label:bug state:closed language:javascript',
  'label:bug state:closed language:python',
  'label:bug state:closed language:java'
];
const STATIC_ERRORS = [
  { title: "P0300 - Random Misfire", category: "automotive", description: "Engine misfire detected.", solution: "Check spark plugs." },
  { title: "Printer Error E07", category: "electronics", description: "Paper jam.", solution: "Remove paper jam." }
];
function createSlug(title) {
  return title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
}
async function fetchGitHubIssues(query) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=5`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Cylma-Bot' } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}
async function fetchStackOverflow() {
  const url = 'https://api.stackexchange.com/2.3/questions?tagged=error&site=stackoverflow&pagesize=5';
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items.map(q => ({ title: q.title, category: 'software', description: q.body?.substring(0,500) }));
}
async function generateWithRotation(title, description, category) {
  const systemPrompt = "You are a technical expert. Write a detailed solution in HTML with SEO keywords and dynamic FAQ.";
  const userPrompt = `Error: ${title}\nCategory: ${category}\nDescription: ${description || 'No context'}`;
  for (const model of AI_MODELS) {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], max_tokens: 1500 })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.response) return data.result.response;
      }
    } catch(e) {}
  }
  return "<h2>Solution</h2><p>Check documentation.</p>";
}
async function main() {
  console.log('Fetching errors...');
  const dbPath = path.join(__dirname, '../master_errors.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch(e) { existing = []; }
  const existingSlugs = new Set(existing.map(e => e.slug));
  let newErrors = [];
  for (const q of GITHUB_QUERIES) {
    const issues = await fetchGitHubIssues(q);
    for (const issue of issues) {
      if (issue.pull_request) continue;
      const slug = createSlug(issue.title);
      if (existingSlugs.has(slug)) continue;
      const aiHtml = await generateWithRotation(issue.title, issue.body, 'software');
      newErrors.push({ slug, title: issue.title, category: 'software', description: issue.body?.substring(0,500), solution: aiHtml, updatedAt: new Date().toISOString(), rawLog: issue.body?.substring(0,200), tags: ['github'] });
      existingSlugs.add(slug);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  const soErrors = await fetchStackOverflow();
  for (const err of soErrors) {
    const slug = createSlug(err.title);
    if (existingSlugs.has(slug)) continue;
    const aiHtml = await generateWithRotation(err.title, err.description, 'software');
    newErrors.push({ slug, title: err.title, category: 'software', description: err.description, solution: aiHtml, updatedAt: new Date().toISOString(), rawLog: err.description, tags: ['stackoverflow'] });
    existingSlugs.add(slug);
    await new Promise(r => setTimeout(r, 2000));
  }
  for (const err of STATIC_ERRORS) {
    const slug = createSlug(err.title);
    if (existingSlugs.has(slug)) continue;
    const aiHtml = await generateWithRotation(err.title, err.description, err.category);
    newErrors.push({ slug, title: err.title, category: err.category, description: err.description, solution: aiHtml, updatedAt: new Date().toISOString(), rawLog: err.description, tags: [err.category] });
    existingSlugs.add(slug);
  }
  if (newErrors.length === 0) { console.log('No new errors.'); return; }
  const updated = [...existing, ...newErrors];
  fs.writeFileSync(dbPath, JSON.stringify(updated, null, 2));
  console.log(`Added ${newErrors.length} errors.`);
}
main().catch(console.error);
