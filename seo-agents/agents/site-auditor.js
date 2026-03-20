/**
 * AGENT 1: Site Auditor
 * =====================
 * Audits all HTML pages for SEO completeness.
 * Checks: titles, meta descriptions, headings, alt text, schema, OG tags,
 * canonical URLs, internal links, keyword density, and more.
 * 
 * Usage: npm run audit
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { parse } from 'node-html-parser';

const SITE_DIR = resolve(import.meta.dirname, '../../');
const REPORT_DIR = resolve(import.meta.dirname, '../reports');
const DOMAIN = 'https://www.djlakha.com';

// Target keywords we want to rank for
const TARGET_KEYWORDS = [
    'indian wedding dj',
    'indian wedding dj texas',
    'indian wedding dj austin',
    'indian wedding dj dallas',
    'indian wedding dj houston',
    'bollywood dj',
    'bhangra dj',
    'desi dj',
    'south asian wedding dj',
    'gujarati wedding dj',
    'punjabi wedding dj',
    'sangeet dj',
    'baraat dj',
    'dhol',
    'fusion wedding dj',
    'luxury wedding dj',
];

function getHtmlFiles() {
    return readdirSync(SITE_DIR)
        .filter(f => f.endsWith('.html'))
        .map(f => ({ name: f, path: join(SITE_DIR, f) }));
}

function auditPage(file) {
    const html = readFileSync(file.path, 'utf-8');
    const root = parse(html);
    const issues = [];
    const passes = [];
    const warnings = [];

    // --- TITLE TAG ---
    const title = root.querySelector('title');
    if (!title || !title.text.trim()) {
        issues.push('❌ Missing <title> tag');
    } else {
        const titleText = title.text.trim();
        if (titleText.length < 30) {
            warnings.push(`⚠️  Title too short (${titleText.length} chars): "${titleText}"`);
        } else if (titleText.length > 60) {
            warnings.push(`⚠️  Title too long (${titleText.length} chars, max 60): "${titleText}"`);
        } else {
            passes.push(`✅ Title tag OK (${titleText.length} chars): "${titleText}"`);
        }
        // Check for target keywords in title
        const titleLower = titleText.toLowerCase();
        const keywordsInTitle = TARGET_KEYWORDS.filter(kw => titleLower.includes(kw));
        if (keywordsInTitle.length === 0) {
            warnings.push('⚠️  No target keywords found in title');
        } else {
            passes.push(`✅ Keywords in title: ${keywordsInTitle.join(', ')}`);
        }
    }

    // --- META DESCRIPTION ---
    const metaDesc = root.querySelector('meta[name="description"]');
    if (!metaDesc) {
        issues.push('❌ Missing meta description');
    } else {
        const desc = metaDesc.getAttribute('content') || '';
        if (desc.length < 120) {
            warnings.push(`⚠️  Meta description too short (${desc.length} chars, min 120)`);
        } else if (desc.length > 160) {
            warnings.push(`⚠️  Meta description too long (${desc.length} chars, max 160)`);
        } else {
            passes.push(`✅ Meta description OK (${desc.length} chars)`);
        }
    }

    // --- META KEYWORDS ---
    const metaKeywords = root.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
        warnings.push('⚠️  No meta keywords tag (low priority but helps)');
    } else {
        passes.push('✅ Meta keywords present');
    }

    // --- CANONICAL URL ---
    const canonical = root.querySelector('link[rel="canonical"]');
    if (!canonical) {
        issues.push('❌ Missing canonical URL');
    } else {
        passes.push(`✅ Canonical URL: ${canonical.getAttribute('href')}`);
    }

    // --- OPEN GRAPH ---
    const ogTitle = root.querySelector('meta[property="og:title"]');
    const ogDesc = root.querySelector('meta[property="og:description"]');
    const ogImage = root.querySelector('meta[property="og:image"]');
    const ogUrl = root.querySelector('meta[property="og:url"]');

    if (!ogTitle) issues.push('❌ Missing og:title');
    else passes.push('✅ og:title present');

    if (!ogDesc) issues.push('❌ Missing og:description');
    else passes.push('✅ og:description present');

    if (!ogImage) issues.push('❌ Missing og:image');
    else passes.push('✅ og:image present');

    if (!ogUrl) issues.push('❌ Missing og:url');
    else passes.push('✅ og:url present');

    // --- TWITTER CARDS ---
    const twitterCard = root.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
        warnings.push('⚠️  Missing Twitter Card meta tags');
    } else {
        passes.push('✅ Twitter Card present');
    }

    // --- H1 TAG ---
    const h1s = root.querySelectorAll('h1');
    if (h1s.length === 0) {
        issues.push('❌ No H1 tag found');
    } else if (h1s.length > 1) {
        warnings.push(`⚠️  Multiple H1 tags found (${h1s.length}) — should have exactly 1`);
    } else {
        passes.push(`✅ Single H1: "${h1s[0].text.trim().substring(0, 60)}"`);
    }

    // --- H2 TAGS ---
    const h2s = root.querySelectorAll('h2');
    if (h2s.length === 0) {
        warnings.push('⚠️  No H2 tags found');
    } else {
        passes.push(`✅ ${h2s.length} H2 tags found`);
    }

    // --- IMAGE ALT TEXT ---
    const images = root.querySelectorAll('img');
    let imagesWithAlt = 0;
    let imagesWithoutAlt = 0;
    let imagesWithEmptyAlt = 0;

    images.forEach(img => {
        const alt = img.getAttribute('alt');
        if (!alt && alt !== '') {
            imagesWithoutAlt++;
        } else if (alt.trim() === '') {
            imagesWithEmptyAlt++;
        } else {
            imagesWithAlt++;
        }
    });

    if (imagesWithoutAlt > 0) {
        issues.push(`❌ ${imagesWithoutAlt} images missing alt attribute`);
    }
    if (imagesWithEmptyAlt > 0) {
        warnings.push(`⚠️  ${imagesWithEmptyAlt} images with empty alt text`);
    }
    if (imagesWithAlt > 0) {
        passes.push(`✅ ${imagesWithAlt}/${images.length} images have descriptive alt text`);
    }

    // --- LAZY LOADING ---
    const lazyImages = root.querySelectorAll('img[loading="lazy"]');
    if (images.length > 2 && lazyImages.length === 0) {
        warnings.push('⚠️  No images use lazy loading (loading="lazy")');
    } else if (lazyImages.length > 0) {
        passes.push(`✅ ${lazyImages.length} images use lazy loading`);
    }

    // --- SCHEMA.ORG ---
    const schemaScripts = root.querySelectorAll('script[type="application/ld+json"]');
    if (schemaScripts.length === 0) {
        if (file.name === 'index.html') {
            issues.push('❌ No Schema.org JSON-LD found on homepage');
        } else {
            warnings.push('⚠️  No Schema.org JSON-LD (optional for non-homepage)');
        }
    } else {
        passes.push(`✅ ${schemaScripts.length} Schema.org JSON-LD block(s) found`);
        schemaScripts.forEach((script, i) => {
            try {
                const data = JSON.parse(script.text);
                passes.push(`   → Schema type: ${data['@type']}`);
            } catch (e) {
                issues.push(`❌ Schema.org block #${i + 1} has invalid JSON`);
            }
        });
    }

    // --- INTERNAL LINKS ---
    const links = root.querySelectorAll('a[href]');
    let internalLinks = 0;
    let externalLinks = 0;
    let brokenAnchors = 0;

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href.startsWith('#') || href.startsWith('/') || href.includes('.html') || href === '/') {
            internalLinks++;
        } else if (href.startsWith('http') || href.startsWith('//')) {
            externalLinks++;
        }
    });

    passes.push(`✅ ${internalLinks} internal links, ${externalLinks} external links`);

    // --- ARIA LABELS ---
    const buttons = root.querySelectorAll('button');
    let buttonsWithLabel = 0;
    buttons.forEach(btn => {
        if (btn.getAttribute('aria-label') || btn.text.trim()) {
            buttonsWithLabel++;
        }
    });
    if (buttons.length > 0 && buttonsWithLabel < buttons.length) {
        warnings.push(`⚠️  ${buttons.length - buttonsWithLabel} buttons missing aria-label`);
    } else if (buttons.length > 0) {
        passes.push(`✅ All ${buttons.length} buttons have labels`);
    }

    // --- KEYWORD DENSITY (body text) ---
    const bodyText = root.querySelector('body')?.text?.toLowerCase() || '';
    const wordCount = bodyText.split(/\s+/).length;
    const keywordHits = {};
    TARGET_KEYWORDS.forEach(kw => {
        const count = (bodyText.match(new RegExp(kw, 'gi')) || []).length;
        if (count > 0) keywordHits[kw] = count;
    });

    passes.push(`✅ Word count: ${wordCount}`);
    if (Object.keys(keywordHits).length > 0) {
        passes.push(`✅ Target keywords found in body: ${Object.entries(keywordHits).map(([k, v]) => `"${k}"(${v}x)`).join(', ')}`);
    } else {
        warnings.push('⚠️  No target keywords found in body text');
    }

    // --- SCORE ---
    const score = Math.max(0, 100 - (issues.length * 15) - (warnings.length * 5));

    return { file: file.name, score, issues, warnings, passes, wordCount };
}

function generateReport(results) {
    const timestamp = new Date().toISOString().split('T')[0];
    let report = `# SEO Audit Report — DJ LAKHA\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    report += `---\n\n`;

    let totalScore = 0;

    results.forEach(r => {
        totalScore += r.score;
        report += `## 📄 ${r.file} — Score: ${r.score}/100\n\n`;

        if (r.issues.length > 0) {
            report += `### Issues (Fix These!)\n`;
            r.issues.forEach(i => report += `- ${i}\n`);
            report += '\n';
        }

        if (r.warnings.length > 0) {
            report += `### Warnings\n`;
            r.warnings.forEach(w => report += `- ${w}\n`);
            report += '\n';
        }

        if (r.passes.length > 0) {
            report += `### Passing\n`;
            r.passes.forEach(p => report += `- ${p}\n`);
            report += '\n';
        }

        report += `---\n\n`;
    });

    const avgScore = Math.round(totalScore / results.length);
    report = report.replace('# SEO Audit Report', `# SEO Audit Report — Overall Score: ${avgScore}/100`);

    const reportPath = join(REPORT_DIR, `seo-audit-${timestamp}.md`);
    writeFileSync(reportPath, report);
    return { reportPath, avgScore, results };
}

// --- MAIN ---
console.log('\n🔍 DJ LAKHA SEO Site Auditor\n');
console.log('Scanning HTML files...\n');

const files = getHtmlFiles();
console.log(`Found ${files.length} pages: ${files.map(f => f.name).join(', ')}\n`);

const results = files.map(f => {
    const result = auditPage(f);
    const emoji = result.score >= 80 ? '🟢' : result.score >= 50 ? '🟡' : '🔴';
    console.log(`${emoji} ${result.file}: ${result.score}/100 (${result.issues.length} issues, ${result.warnings.length} warnings)`);
    return result;
});

const { reportPath, avgScore } = generateReport(results);

console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Overall Score: ${avgScore}/100`);
console.log(`📝 Full report saved: ${reportPath}`);
console.log(`${'='.repeat(50)}\n`);
