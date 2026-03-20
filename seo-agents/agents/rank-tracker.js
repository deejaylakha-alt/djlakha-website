/**
 * AGENT 4: Rank Tracker
 * =====================
 * Tracks Google search rankings for target keywords.
 * Usage: npm run track-rankings
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const REPORT_DIR = resolve(import.meta.dirname, '../reports');
const DATA_DIR = resolve(import.meta.dirname, '../output');
const HISTORY_FILE = join(DATA_DIR, 'ranking-history.json');
const DOMAIN = 'djlakha.com';

const KEYWORDS = [
    'Indian Wedding DJ Texas',
    'Indian Wedding DJ Austin',
    'Indian Wedding DJ Dallas',
    'Indian Wedding DJ Houston',
    'Bollywood DJ Texas',
    'Desi DJ Texas',
    'South Asian Wedding DJ Texas',
    'Fusion Wedding DJ Austin',
];

async function checkRanking(keyword) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=20&gl=us`;
    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        });
        if (!res.ok) return { keyword, position: null, error: `HTTP ${res.status}` };
        const html = await res.text();
        if (html.includes('captcha') || html.includes('unusual traffic'))
            return { keyword, position: null, error: 'Rate limited' };
        const found = html.includes(DOMAIN);
        return { keyword, position: found ? 'In top 20' : 'Not in top 20', found };
    } catch (err) {
        return { keyword, position: null, error: err.message };
    }
}

console.log('\n📊 DJ LAKHA Rank Tracker\n');

let history = existsSync(HISTORY_FILE) ? JSON.parse(readFileSync(HISTORY_FILE, 'utf-8')) : { checks: [] };
const results = [];

for (let i = 0; i < KEYWORDS.length; i++) {
    console.log(`  [${i + 1}/${KEYWORDS.length}] "${KEYWORDS[i]}"...`);
    const r = await checkRanking(KEYWORDS[i]);
    results.push(r);
    if (r.error) { console.log(`    ❌ ${r.error}`); if (r.error.includes('Rate')) break; }
    else if (r.found) console.log(`    🟢 Found in top 20`);
    else console.log(`    🔴 Not in top 20`);
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
}

history.checks.push({ timestamp: new Date().toISOString(), results });
if (history.checks.length > 30) history.checks = history.checks.slice(-30);
writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

let report = `# Ranking Report — ${new Date().toLocaleString()}\n\n`;
report += `| Keyword | Status |\n|---|---|\n`;
results.forEach(r => {
    report += `| ${r.keyword} | ${r.error ? '❌ ' + r.error : r.found ? '🟢 Top 20' : '🔴 Not found'} |\n`;
});
report += `\n*For accurate data, use Google Search Console.*\n`;

const path = join(REPORT_DIR, `rankings-${new Date().toISOString().split('T')[0]}.md`);
writeFileSync(path, report);
console.log(`\n📝 Report: ${path}\n`);
