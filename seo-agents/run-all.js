/**
 * DJ LAKHA SEO AGENTS — Master Runner
 * ====================================
 * Runs all SEO agents in sequence.
 * Usage: npm run run-all
 */

import { execSync } from 'child_process';
import { resolve } from 'path';

const AGENTS_DIR = resolve(import.meta.dirname, 'agents');

const AGENTS = [
    { name: 'Site Auditor', script: 'site-auditor.js', desc: 'Audit all pages for SEO issues' },
    { name: 'Image Optimizer', script: 'image-optimizer.js', desc: 'Convert images to WebP' },
    { name: 'Blog Generator', script: 'blog-generator.js', desc: 'Generate blog post templates' },
    { name: 'Review Outreach', script: 'review-outreach.js', desc: 'Create review request messages' },
    { name: 'Citation Builder', script: 'citation-builder.js', desc: 'Build directory listing guide' },
    { name: 'Competitor Monitor', script: 'competitor-monitor.js', desc: 'Monitor competitor SEO changes' },
    { name: 'Rank Tracker', script: 'rank-tracker.js', desc: 'Check Google rankings' },
];

console.log('\n' + '═'.repeat(60));
console.log('  🚀 DJ LAKHA SEO AUTOMATION SUITE');
console.log('  Running all agents...');
console.log('═'.repeat(60) + '\n');

const startTime = Date.now();
const results = [];

for (const agent of AGENTS) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶️  AGENT: ${agent.name}`);
    console.log(`   ${agent.desc}`);
    console.log('─'.repeat(60));

    try {
        execSync(`node ${resolve(AGENTS_DIR, agent.script)}`, {
            stdio: 'inherit',
            cwd: resolve(import.meta.dirname),
        });
        results.push({ name: agent.name, status: '✅ Success' });
    } catch (err) {
        results.push({ name: agent.name, status: '❌ Failed' });
        console.error(`\n   ❌ ${agent.name} failed: ${err.message}\n`);
    }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('\n' + '═'.repeat(60));
console.log('  📊 RESULTS SUMMARY');
console.log('═'.repeat(60));
results.forEach(r => console.log(`  ${r.status}  ${r.name}`));
console.log(`\n  ⏱️  Total time: ${elapsed}s`);
console.log('\n  📁 All reports saved to: seo-agents/reports/');
console.log('  📁 Generated content: seo-agents/output/');
console.log('═'.repeat(60) + '\n');
