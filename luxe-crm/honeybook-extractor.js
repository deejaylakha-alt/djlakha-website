/**
 * LUXE CRM: HoneyBook Extractor v2
 * =================================
 * STRATEGY: Instead of guessing CSS selectors, this version:
 *   1. Intercepts HoneyBook's own API calls to capture structured JSON
 *   2. Navigates to each section via sidebar clicks (not URL)
 *   3. Scrolls aggressively to trigger lazy-loaded content
 *   4. Falls back to intelligent text parsing of page content
 *
 * Your credentials are NEVER stored or logged.
 *
 * Usage: npm run extract
 */

import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const REPORTS_DIR = resolve(import.meta.dirname, 'reports');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

const HONEYBOOK_BASE = 'https://app.honeybook.com';

// ─── Helpers ──────────────────────────────────────────────

function saveJSON(filename, data) {
    const path = join(DATA_DIR, filename);
    writeFileSync(path, JSON.stringify(data, null, 2));
    const count = Array.isArray(data) ? data.length + ' items' : 'object';
    console.log(`   💾 Saved: ${filename} (${count})`);
    return path;
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function scrollFullPage(page) {
    // Scroll the ENTIRE page to load virtualized content
    await page.evaluate(async () => {
        // Try scrolling various containers (HoneyBook uses nested scrollable divs)
        const containers = [
            document.querySelector('main'),
            document.querySelector('[class*="scroll"]'),
            document.querySelector('[class*="Scroll"]'),
            document.querySelector('[class*="list"]'),
            document.querySelector('[class*="List"]'),
            document.querySelector('[class*="pipeline"]'),
            document.querySelector('[class*="Pipeline"]'),
            document.querySelector('[class*="content"]'),
            document.querySelector('[role="main"]'),
            document.documentElement,
        ].filter(Boolean);

        for (const container of containers) {
            let lastScrollTop = -1;
            let attempts = 0;
            while (attempts < 50) {
                container.scrollTop = container.scrollTop + 600;
                await new Promise(r => setTimeout(r, 300));
                if (container.scrollTop === lastScrollTop) break;
                lastScrollTop = container.scrollTop;
                attempts++;
            }
            // Scroll back to top
            container.scrollTop = 0;
        }
    });
}

// ─── API Interceptor ──────────────────────────────────────
// HoneyBook's React app makes XHR/fetch calls to its own API.
// We intercept those responses to get clean structured data.

class APIInterceptor {
    constructor() {
        this.responses = [];
    }

    attach(page) {
        page.on('response', async (response) => {
            const url = response.url();
            // Capture any API/GraphQL calls that return JSON
            if (
                (url.includes('/api/') || url.includes('graphql') || url.includes('/v1/') || url.includes('/v2/')) &&
                response.status() === 200
            ) {
                try {
                    const contentType = response.headers()['content-type'] || '';
                    if (contentType.includes('json')) {
                        const body = await response.json();
                        this.responses.push({
                            url: url,
                            timestamp: new Date().toISOString(),
                            data: body
                        });
                    }
                } catch (e) {
                    // Some responses can't be read, that's fine
                }
            }
        });
    }

    getAll() { return this.responses; }

    findByKeyword(keyword) {
        return this.responses.filter(r =>
            r.url.toLowerCase().includes(keyword.toLowerCase()) ||
            JSON.stringify(r.data).toLowerCase().includes(keyword.toLowerCase())
        );
    }
}

// ─── Navigation via Sidebar ──────────────────────────────

async function navigateToSection(page, sectionName) {
    console.log(`\n   🔄 Navigating to: ${sectionName}...`);

    // Click the sidebar link by text content
    try {
        const clicked = await page.evaluate((name) => {
            // Find sidebar/nav links that match the section name
            const links = document.querySelectorAll('a, button, [role="link"], [role="menuitem"], nav a, [class*="nav"] a, [class*="sidebar"] a');
            for (const link of links) {
                const text = link.textContent.trim().toLowerCase();
                if (text === name.toLowerCase() || text.includes(name.toLowerCase())) {
                    link.click();
                    return true;
                }
            }
            return false;
        }, sectionName);

        if (clicked) {
            await sleep(3000); // Wait for page transition
            await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => { });
            return true;
        }
    } catch (e) {
        // Fallback: direct navigation
    }

    // Fallback: try direct URL
    const urlMap = {
        'Projects': '/app/projects',
        'Pipeline': '/app/pipeline',
        'Contacts': '/app/contacts',
        'Templates': '/app/templates',
        'Automations': '/app/automations',
        'Files': '/app/files',
    };

    const path = urlMap[sectionName];
    if (path) {
        try {
            await page.goto(`${HONEYBOOK_BASE}${path}`, { waitUntil: 'networkidle2', timeout: 15000 });
            await sleep(2000);
            return true;
        } catch (e) {
            console.log(`   ⚠️  Could not navigate to ${sectionName}`);
            return false;
        }
    }

    return false;
}

// ─── Smart Text Extractor ────────────────────────────────
// Extracts ALL visible text and structures it intelligently

async function extractPageData(page, sectionName) {
    await scrollFullPage(page);
    await sleep(2000);

    const data = await page.evaluate((section) => {
        const result = {
            section: section,
            url: window.location.href,
            pageTitle: document.title,
            extractedAt: new Date().toISOString(),
            items: [],
            rawText: '',
        };

        // Get the main content area (exclude sidebar/nav)
        const main = document.querySelector('main') ||
            document.querySelector('[class*="content"]') ||
            document.querySelector('[class*="Content"]') ||
            document.querySelector('[role="main"]') ||
            document.body;

        // Strategy 1: Find all "card-like" or "row-like" elements
        const allElements = main.querySelectorAll('*');
        const cards = [];

        allElements.forEach(el => {
            const className = (el.className || '').toString().toLowerCase();
            const role = (el.getAttribute('role') || '').toLowerCase();

            // Look for elements that look like list items / cards / rows
            const isCard = (
                className.includes('card') || className.includes('row') ||
                className.includes('item') || className.includes('project') ||
                className.includes('contact') || className.includes('template') ||
                className.includes('automation') || className.includes('pipeline') ||
                className.includes('stage') || className.includes('lead') ||
                role === 'listitem' || role === 'row' || role === 'article'
            );

            if (isCard && el.children.length > 0 && el.offsetHeight > 20 && el.offsetHeight < 500) {
                const text = el.innerText.trim();
                if (text.length > 5 && text.length < 2000) {
                    // Check it's not a wrapper of other cards
                    const childCards = el.querySelectorAll('[class*="card"], [class*="row"], [class*="item"]');
                    if (childCards.length <= 1) {
                        cards.push({
                            text: text,
                            tag: el.tagName,
                            className: (el.className || '').toString().substring(0, 200),
                        });
                    }
                }
            }
        });

        result.items = cards;

        // Strategy 2: Capture full page text for intelligent parsing
        result.rawText = main.innerText.substring(0, 50000);

        return result;
    }, sectionName);

    return data;
}

// ─── Intelligent Text Parser ─────────────────────────────
// Parses the dashboard text to extract structured project data

function parseDashboardText(rawText) {
    const projects = [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Pattern: "Name's Project" indicates a project
    const projectPattern = /(.+?)(?:'s Project|'s project)/;
    // Pattern: "Name & Name's Project"
    const couplePattern = /(.+?\s*&\s*.+?)(?:'s Project|'s project)/;

    const seen = new Set();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match = line.match(couplePattern) || line.match(projectPattern);

        if (match) {
            const name = match[1].trim();
            if (!seen.has(name) && name.length > 2 && name.length < 100) {
                seen.add(name);

                // Look ahead for context (date, status, value)
                const context = lines.slice(Math.max(0, i - 2), i + 5).join(' ');

                // Try to extract date
                const dateMatch = context.match(/(\w{3}\s+\d{1,2}(?:,?\s*\d{4})?|\d{1,2}\/\d{1,2}\/?\d{0,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2})/i);

                // Try to extract dollar amount
                const valueMatch = context.match(/\$[\d,]+(?:\.\d{2})?/);

                // Try to extract status keywords
                let status = 'Active';
                if (context.toLowerCase().includes('overdue')) status = 'Overdue';
                if (context.toLowerCase().includes('paid')) status = 'Paid';
                if (context.toLowerCase().includes('processing')) status = 'Processing';
                if (context.toLowerCase().includes('lead')) status = 'Lead';
                if (context.toLowerCase().includes('inquiry')) status = 'Inquiry';

                projects.push({
                    name: name,
                    date: dateMatch ? dateMatch[1] : '',
                    value: valueMatch ? valueMatch[0] : '',
                    status: status,
                    contextSnippet: context.substring(0, 200),
                });
            }
        }
    }

    return projects;
}

// Also parse leads from "Leads" section
function parseLeadsFromText(rawText) {
    const leads = [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Find the "Leads" section
    let inLeadsSection = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/^Leads?\s*\(\d+\)/)) {
            inLeadsSection = true;
            continue;
        }
        if (inLeadsSection && lines[i].match(/^(Calendar|Activity|Payments|Tasks)/)) {
            inLeadsSection = false;
            continue;
        }
        if (inLeadsSection && lines[i].length > 2) {
            // Check if this looks like a name (not a button or label)
            if (!lines[i].match(/^(Lead form|Go to|Show|View|Mark|Vendor|Google|Contact)/i)) {
                const sourceLine = lines[i + 1] || '';
                const dateLine = lines[i + 2] || '';

                if (lines[i].length < 80) {
                    leads.push({
                        name: lines[i],
                        source: sourceLine.includes('Referral') || sourceLine.includes('Google') ? sourceLine : '',
                        date: dateLine.match(/\d/) ? dateLine : '',
                    });
                }
            }
        }
    }

    return leads;
}

// Parse messages
function parseMessagesFromText(rawText) {
    const messages = [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let inMessages = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/Unread messages/)) {
            inMessages = true;
            continue;
        }
        if (inMessages && lines[i].match(/^(Payments|Tasks|Offers|Get started)/)) {
            inMessages = false;
            continue;
        }
        if (inMessages && lines[i].match(/New message from:|Re:/)) {
            messages.push({
                preview: lines[i],
                context: lines.slice(i, i + 3).join(' ').substring(0, 300),
            });
        }
    }

    return messages;
}

// ─── Main Execution ──────────────────────────────────────

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('  🤵 LUXE CRM: HoneyBook Extractor v2');
    console.log('═'.repeat(60));
    console.log('\n  Strategy: API interception + smart text parsing');
    console.log('  ⚠️  Your credentials are NEVER stored.\n');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1440, height: 900 },
        args: ['--no-sandbox', '--window-size=1440,900'],
    });

    const page = await browser.newPage();

    // Set up API interceptor BEFORE any navigation
    const interceptor = new APIInterceptor();
    interceptor.attach(page);

    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    try {
        // STEP 1: Login
        console.log('🔐 STEP 1: Opening HoneyBook login...');
        await page.goto(`${HONEYBOOK_BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('   ⏳ Please log into HoneyBook in the Chrome window...');
        console.log('   (Waiting up to 5 minutes for login)\n');

        // Wait for login — detect when URL moves away from login
        const startTime = Date.now();
        while (Date.now() - startTime < 300000) {
            const url = page.url();
            if (!url.includes('/login') && !url.includes('/signup') && !url.includes('/forgot') && url.includes('honeybook.com')) {
                break;
            }
            await sleep(2000);
        }

        console.log('   ✅ Login detected! Waiting for dashboard to load...');
        await sleep(5000);
        await page.waitForNetworkIdle({ timeout: 15000 }).catch(() => { });

        // STEP 2: Extract Dashboard Data
        console.log('\n📊 STEP 2: Extracting Dashboard overview...');
        await scrollFullPage(page);
        await sleep(3000);

        const dashboardData = await extractPageData(page, 'Dashboard');
        saveJSON('honeybook-dashboard-raw.json', dashboardData);

        // Parse the dashboard text for structured data
        const dashboardProjects = parseDashboardText(dashboardData.rawText);
        const dashboardLeads = parseLeadsFromText(dashboardData.rawText);
        const dashboardMessages = parseMessagesFromText(dashboardData.rawText);

        console.log(`   📋 Found ${dashboardProjects.length} projects from dashboard`);
        console.log(`   📋 Found ${dashboardLeads.length} leads from dashboard`);
        console.log(`   📋 Found ${dashboardMessages.length} unread messages`);

        // STEP 3: Navigate to Projects/Pipeline
        console.log('\n📂 STEP 3: Navigating to Projects...');
        const wentToProjects = await navigateToSection(page, 'Projects');
        await sleep(3000);
        await scrollFullPage(page);
        await sleep(3000);

        const projectsData = await extractPageData(page, 'Projects');
        const projectsFromPage = parseDashboardText(projectsData.rawText);
        saveJSON('honeybook-projects-page.json', projectsData);

        // Merge projects from dashboard + projects page
        const allProjectNames = new Set();
        const allProjects = [];

        [...dashboardProjects, ...projectsFromPage].forEach(p => {
            if (!allProjectNames.has(p.name)) {
                allProjectNames.add(p.name);
                allProjects.push(p);
            }
        });

        saveJSON('honeybook-projects.json', allProjects);
        console.log(`   ✅ Total unique projects: ${allProjects.length}`);

        // STEP 3.5: Click "Completed" and "Archived" to trigger API calls for past projects
        console.log('\n📂 STEP 3.5: Clicking "Completed" / "All" tabs...');
        try {
            // Helper to click tabs
            const clickTab = async (name) => {
                const clicked = await page.evaluate((text) => {
                    const els = [...document.querySelectorAll('div, span, li, button')];
                    const target = els.find(e => e.innerText && e.innerText.trim() === text && e.offsetParent !== null);
                    if (target) {
                        target.click();
                        return true;
                    }
                    return false;
                }, name);
                if (clicked) {
                    console.log(`   clicked "${name}" tab`);
                    await sleep(3000);
                    await scrollFullPage(page);
                }
            };

            await clickTab('Completed');
            await clickTab('Archived');
            await clickTab('All'); // Try "All" last to catch everything
        } catch (e) {
            console.log('   (Could not click tabs, skipping)');
        }

        // STEP 4: Navigate to Contacts
        console.log('\n👥 STEP 4: Navigating to Contacts...');
        await navigateToSection(page, 'Contacts');
        await sleep(3000);
        await scrollFullPage(page);
        await sleep(3000);

        const contactsData = await extractPageData(page, 'Contacts');
        saveJSON('honeybook-contacts-raw.json', contactsData);

        // Parse contacts from items
        const contacts = contactsData.items
            .map(item => {
                const lines = item.text.split('\n').map(l => l.trim()).filter(l => l);
                return {
                    name: lines[0] || '',
                    details: lines.slice(1).join(' | '),
                    raw: item.text.substring(0, 200),
                };
            })
            .filter(c => c.name.length > 2 && c.name.length < 100);

        saveJSON('honeybook-contacts.json', contacts);
        console.log(`   ✅ Found ${contacts.length} contacts`);

        // STEP 5: Navigate to Templates
        console.log('\n📧 STEP 5: Navigating to Templates...');
        await navigateToSection(page, 'Templates');
        await sleep(3000);
        await scrollFullPage(page);
        await sleep(3000);

        const templatesData = await extractPageData(page, 'Templates');
        saveJSON('honeybook-templates-raw.json', templatesData);

        const templates = templatesData.items
            .map(item => {
                const lines = item.text.split('\n').map(l => l.trim()).filter(l => l);
                return {
                    name: lines[0] || '',
                    type: lines[1] || '',
                    preview: lines.slice(2).join(' ').substring(0, 300),
                };
            })
            .filter(t => t.name.length > 2 && t.name.length < 200);

        saveJSON('honeybook-templates.json', templates);
        console.log(`   ✅ Found ${templates.length} templates`);

        // STEP 6: Navigate to Automations
        console.log('\n⚡ STEP 6: Navigating to Automations...');
        await navigateToSection(page, 'Automations');
        await sleep(3000);
        await scrollFullPage(page);
        await sleep(3000);

        const automationsData = await extractPageData(page, 'Automations');
        saveJSON('honeybook-automations-raw.json', automationsData);

        const automations = automationsData.items
            .map(item => {
                const lines = item.text.split('\n').map(l => l.trim()).filter(l => l);
                return {
                    name: lines[0] || '',
                    status: lines.find(l => l.match(/active|paused|on|off/i)) || '',
                    steps: lines.slice(1).join(' | ').substring(0, 500),
                };
            })
            .filter(a => a.name.length > 2 && a.name.length < 200);

        saveJSON('honeybook-automations.json', automations);
        console.log(`   ✅ Found ${automations.length} automations`);

        // STEP 7: Save intercepted API data
        console.log('\n🔌 STEP 7: Saving intercepted API data...');
        const apiData = interceptor.getAll();
        if (apiData.length > 0) {
            saveJSON('honeybook-api-responses.json', apiData);
            console.log(`   ✅ Captured ${apiData.length} API responses`);

            // Look for project/client data in API responses
            const projectAPIs = interceptor.findByKeyword('project');
            const contactAPIs = interceptor.findByKeyword('contact');
            const clientAPIs = interceptor.findByKeyword('client');

            if (projectAPIs.length > 0) saveJSON('honeybook-api-projects.json', projectAPIs);
            if (contactAPIs.length > 0) saveJSON('honeybook-api-contacts.json', contactAPIs);
            if (clientAPIs.length > 0) saveJSON('honeybook-api-clients.json', clientAPIs);

            console.log(`   📡 Project APIs: ${projectAPIs.length}, Contact APIs: ${contactAPIs.length}, Client APIs: ${clientAPIs.length}`);
        } else {
            console.log('   ⚠️  No API calls intercepted (HoneyBook may use WebSockets)');
        }

        // Generate summary
        const summary = {
            extractedAt: new Date().toISOString(),
            version: 2,
            counts: {
                projects: allProjects.length,
                leads: dashboardLeads.length,
                contacts: contacts.length,
                templates: templates.length,
                automations: automations.length,
                unreadMessages: dashboardMessages.length,
                apiResponses: apiData.length,
            },
            businessOverview: {
                // Parse from dashboard text
                bookings2026: dashboardData.rawText.match(/\$[\d,]+\.\d{2}/)?.[0] || 'N/A',
                pendingAutomations: dashboardData.rawText.match(/Pending \((\d+)\)/)?.[1] || '0',
                tasks: dashboardData.rawText.match(/Tasks\s*\((\d+)\)/)?.[1] || '0',
                newLeads: dashboardData.rawText.match(/New leads\s*(\d+)/)?.[1] || '0',
                unreadMessages: dashboardData.rawText.match(/Unread messages\s*(\d+)/)?.[1] || '0',
            },
        };

        // Save leads separately
        saveJSON('honeybook-leads.json', dashboardLeads);
        saveJSON('honeybook-messages.json', dashboardMessages);
        saveJSON('extraction-summary.json', summary);

        // Generate report
        let report = `# HoneyBook Extraction Report v2\n`;
        report += `**Date:** ${new Date().toLocaleString()}\n\n`;
        report += `## Business Overview\n`;
        report += `| Metric | Value |\n|---|---|\n`;
        report += `| 2026 Bookings | ${summary.businessOverview.bookings2026} |\n`;
        report += `| New Leads | ${summary.businessOverview.newLeads} |\n`;
        report += `| Unread Messages | ${summary.businessOverview.unreadMessages} |\n`;
        report += `| Pending Tasks | ${summary.businessOverview.tasks} |\n\n`;
        report += `## Data Extracted\n`;
        report += `| Category | Count |\n|---|---|\n`;
        Object.entries(summary.counts).forEach(([k, v]) => {
            report += `| ${k} | ${v} |\n`;
        });
        report += `\n## Projects Found\n`;
        allProjects.forEach((p, i) => {
            report += `${i + 1}. **${p.name}** ${p.value ? `— ${p.value}` : ''} ${p.status ? `(${p.status})` : ''}\n`;
        });

        const reportPath = join(REPORTS_DIR, `extraction-${new Date().toISOString().split('T')[0]}.md`);
        writeFileSync(reportPath, report);

        // Final summary
        console.log('\n' + '═'.repeat(60));
        console.log('  ✅ EXTRACTION v2 COMPLETE!');
        console.log('═'.repeat(60));
        console.log(`\n  💰 2026 Bookings:   ${summary.businessOverview.bookings2026}`);
        console.log(`  📂 Projects:        ${allProjects.length}`);
        console.log(`  🔥 Leads:           ${dashboardLeads.length}`);
        console.log(`  👥 Contacts:        ${contacts.length}`);
        console.log(`  📧 Templates:       ${templates.length}`);
        console.log(`  ⚡ Automations:     ${automations.length}`);
        console.log(`  💬 Unread Messages: ${dashboardMessages.length}`);
        console.log(`  🔌 API Captures:    ${apiData.length}`);
        console.log(`\n  📁 All data: luxe-crm/data/`);
        console.log(`  📝 Report:   ${reportPath}`);
        console.log('\n  Next: run "node data-processor.js" to import into CRM');
        console.log('═'.repeat(60) + '\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.log('\n💡 Tips:');
        console.log('   - Complete login within 5 minutes');
        console.log('   - Don\'t close Chrome while extraction runs');
    } finally {
        console.log('\n   Browser closing in 10 seconds...');
        await sleep(10000);
        await browser.close();
    }
}

main();
