/**
 * AGENT 3: Competitor Monitor
 * ===========================
 * Monitors competitor websites for changes in their SEO strategy.
 * Tracks: title tags, meta descriptions, schema markup, new pages,
 * social proof claims, and service offerings.
 * 
 * Usage: npm run monitor-competitors
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const REPORT_DIR = resolve(import.meta.dirname, '../reports');
const DATA_DIR = resolve(import.meta.dirname, '../output');
const HISTORY_FILE = join(DATA_DIR, 'competitor-history.json');

const COMPETITORS = [
    {
        name: 'Karma DJs',
        url: 'https://karmadjs.com',
        pages: [
            'https://karmadjs.com',
            'https://karmadjs.com/services/',
            'https://karmadjs.com/testimonials/',
        ],
        keywords: ['houston desi dj', 'indian wedding dj houston', 'karma djs', 'south asian wedding dj'],
    },
    {
        name: 'DJ Tej',
        url: 'https://thedjtej.com',
        pages: [
            'https://thedjtej.com',
            'https://thedjtej.com/services/',
        ],
        keywords: ['dj tej', 'indian wedding dj texas', 'desi wedding dj houston'],
    },
    {
        name: 'Desi Junction DJs',
        url: 'https://desijunctiondjs.com',
        pages: [
            'https://desijunctiondjs.com',
        ],
        keywords: ['desi junction dj', 'indian dj dallas'],
    },
];

async function fetchPage(url) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0; +https://djlakha.com)',
            },
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return { url, status: response.status, html: null, error: `HTTP ${response.status}` };
        }

        const html = await response.text();
        return { url, status: response.status, html, error: null };
    } catch (err) {
        return { url, status: 0, html: null, error: err.message };
    }
}

function extractSEOData(html) {
    if (!html) return null;

    const data = {};

    // Title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    data.title = titleMatch ? titleMatch[1].trim() : null;

    // Meta description
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/is);
    data.metaDescription = descMatch ? descMatch[1].trim() : null;

    // H1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    data.h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : null;

    // Schema.org types
    const schemaMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    data.schemaTypes = [];
    for (const match of schemaMatches) {
        try {
            const schema = JSON.parse(match[1]);
            data.schemaTypes.push(schema['@type'] || 'Unknown');
        } catch (e) {
            // ignore parse errors
        }
    }

    // Count of images
    const imgMatches = html.matchAll(/<img\s/gi);
    data.imageCount = [...imgMatches].length;

    // External links
    const linkMatches = html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi);
    data.externalLinks = [...new Set([...linkMatches].map(m => {
        try { return new URL(m[1]).hostname; } catch { return null; }
    }).filter(Boolean))];

    // Check for specific features
    data.hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    data.hasOpenGraph = /property=["']og:/i.test(html);
    data.hasTwitterCard = /name=["']twitter:card["']/i.test(html);
    data.hasFAQSchema = /"FAQPage"/i.test(html);

    // Word count (approximate)
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ');
    data.wordCount = textContent.split(' ').length;

    // Social proof claims (review numbers, etc.)
    const reviewClaims = [];
    if (/5\s*star/i.test(html)) reviewClaims.push('Claims 5-star reviews');
    if (/#1|number\s*one|leading/i.test(html)) reviewClaims.push('Claims #1/Leading position');
    if (/award/i.test(html)) reviewClaims.push('Mentions awards');
    if (/wedding\s*wire/i.test(html)) reviewClaims.push('References WeddingWire');
    if (/the\s*knot/i.test(html)) reviewClaims.push('References The Knot');
    data.socialProof = reviewClaims;

    return data;
}

function compareWithHistory(current, history) {
    const changes = [];

    if (!history) {
        changes.push('🆕 First time tracking this competitor');
        return changes;
    }

    if (current.title !== history.title) {
        changes.push(`📝 Title changed: "${history.title}" → "${current.title}"`);
    }
    if (current.metaDescription !== history.metaDescription) {
        changes.push(`📝 Meta description changed`);
    }
    if (current.h1 !== history.h1) {
        changes.push(`📝 H1 changed: "${history.h1}" → "${current.h1}"`);
    }
    if (current.wordCount && history.wordCount && Math.abs(current.wordCount - history.wordCount) > 50) {
        changes.push(`📊 Content length changed: ${history.wordCount} → ${current.wordCount} words`);
    }
    if (current.hasCanonical !== history.hasCanonical) {
        changes.push(`🔗 Canonical URL: ${current.hasCanonical ? 'Added' : 'Removed'}`);
    }
    if (current.hasOpenGraph !== history.hasOpenGraph) {
        changes.push(`📱 Open Graph: ${current.hasOpenGraph ? 'Added' : 'Removed'}`);
    }
    if (current.hasFAQSchema !== history.hasFAQSchema) {
        changes.push(`⚡ FAQ Schema: ${current.hasFAQSchema ? 'Added ⚠️ WATCH OUT' : 'Removed'}`);
    }
    if (JSON.stringify(current.schemaTypes) !== JSON.stringify(history.schemaTypes)) {
        changes.push(`🏗️ Schema types changed: [${history.schemaTypes.join(', ')}] → [${current.schemaTypes.join(', ')}]`);
    }

    if (changes.length === 0) {
        changes.push('✅ No changes detected');
    }

    return changes;
}

// --- MAIN ---
console.log('\n🕵️  DJ LAKHA Competitor Monitor\n');
console.log(`Monitoring ${COMPETITORS.length} competitors...\n`);

// Load history
let history = {};
if (existsSync(HISTORY_FILE)) {
    try {
        history = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (e) {
        history = {};
    }
}

let report = `# Competitor Monitoring Report\n`;
report += `**Generated:** ${new Date().toLocaleString()}\n\n`;

const newHistory = {};

for (const competitor of COMPETITORS) {
    console.log(`📡 Scanning: ${competitor.name} (${competitor.url})`);
    report += `## ${competitor.name}\n`;
    report += `**URL:** ${competitor.url}\n\n`;

    newHistory[competitor.name] = { pages: {}, lastChecked: new Date().toISOString() };

    for (const pageUrl of competitor.pages) {
        console.log(`   Fetching: ${pageUrl}`);
        const { html, error, status } = await fetchPage(pageUrl);

        if (error) {
            console.log(`   ❌ Error: ${error}`);
            report += `### ${pageUrl}\n- ❌ Error: ${error}\n\n`;
            continue;
        }

        const seoData = extractSEOData(html);
        if (!seoData) continue;

        newHistory[competitor.name].pages[pageUrl] = seoData;

        // Compare with history
        const prevData = history[competitor.name]?.pages?.[pageUrl];
        const changes = compareWithHistory(seoData, prevData);

        report += `### ${pageUrl} (HTTP ${status})\n`;
        report += `| Element | Value |\n|---|---|\n`;
        report += `| Title | ${seoData.title || 'None'} |\n`;
        report += `| H1 | ${seoData.h1 || 'None'} |\n`;
        report += `| Meta Desc | ${seoData.metaDescription ? seoData.metaDescription.substring(0, 80) + '...' : 'None'} |\n`;
        report += `| Schema Types | ${seoData.schemaTypes.join(', ') || 'None'} |\n`;
        report += `| Canonical | ${seoData.hasCanonical ? '✅' : '❌'} |\n`;
        report += `| Open Graph | ${seoData.hasOpenGraph ? '✅' : '❌'} |\n`;
        report += `| FAQ Schema | ${seoData.hasFAQSchema ? '✅' : '❌'} |\n`;
        report += `| Word Count | ${seoData.wordCount} |\n`;
        report += `| Images | ${seoData.imageCount} |\n`;
        report += `| Social Proof | ${seoData.socialProof.join(', ') || 'None'} |\n\n`;

        if (changes.length > 0) {
            report += `**Changes Since Last Check:**\n`;
            changes.forEach(c => {
                report += `- ${c}\n`;
                console.log(`   ${c}`);
            });
            report += '\n';
        }
    }

    report += `---\n\n`;
    console.log('');
}

// Comparative summary
report += `## 🆚 Competitive Comparison\n\n`;
report += `| Feature | DJ LAKHA | ${COMPETITORS.map(c => c.name).join(' | ')} |\n`;
report += `|---|---|${COMPETITORS.map(() => '---').join('|')}|\n`;

const features = ['Canonical URL', 'Open Graph', 'FAQ Schema'];
const myFeatures = { 'Canonical URL': true, 'Open Graph': true, 'FAQ Schema': true };

features.forEach(feat => {
    const featureKey = feat === 'Canonical URL' ? 'hasCanonical' : feat === 'Open Graph' ? 'hasOpenGraph' : 'hasFAQSchema';
    const competitorValues = COMPETITORS.map(c => {
        const firstPage = Object.values(newHistory[c.name]?.pages || {})[0];
        return firstPage?.[featureKey] ? '✅' : '❌';
    });
    report += `| ${feat} | ✅ | ${competitorValues.join(' | ')} |\n`;
});

report += '\n';

// Save history
writeFileSync(HISTORY_FILE, JSON.stringify(newHistory, null, 2));

// Save report
const reportPath = join(REPORT_DIR, `competitor-monitor-${new Date().toISOString().split('T')[0]}.md`);
writeFileSync(reportPath, report);

console.log(`${'='.repeat(50)}`);
console.log(`📝 Report saved: ${reportPath}`);
console.log(`📊 History saved for change tracking`);
console.log(`💡 Run this weekly to catch competitor changes!`);
console.log(`${'='.repeat(50)}\n`);
