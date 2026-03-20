/**
 * LUXE CRM: Data Processor
 * ========================
 * Transforms raw HoneyBook extracted data into Luxe CRM format.
 * Maps stages, deduplicates contacts, and generates import report.
 *
 * Usage: node data-processor.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const LEADS_FILE = join(DATA_DIR, 'leads.json');

// Map HoneyBook stages to Luxe CRM stages
const STAGE_MAP = {
    // HoneyBook default stages (case-insensitive matching)
    'inquiry': 'Inquiry',
    'new': 'Inquiry',
    'lead': 'Inquiry',
    'follow up': 'Discovery Call',
    'follow-up': 'Discovery Call',
    'meeting': 'Discovery Call',
    'consultation': 'Discovery Call',
    'proposal': 'Proposal Sent',
    'proposal sent': 'Proposal Sent',
    'sent': 'Proposal Sent',
    'pending': 'Proposal Sent',
    'booked': 'Booked / Deposit',
    'confirmed': 'Booked / Deposit',
    'retainer paid': 'Booked / Deposit',
    'deposit': 'Booked / Deposit',
    'signed': 'Booked / Deposit',
    'planning': 'Event Planning',
    'in progress': 'Event Planning',
    'active': 'Event Planning',
    'completed': 'Post-Event / Review',
    'done': 'Post-Event / Review',
    'complete': 'Post-Event / Review',
    'closed': 'Post-Event / Review',
    'archived': 'Post-Event / Review',
};

function mapStage(hbStage) {
    if (!hbStage) return 'Inquiry';
    const key = hbStage.toLowerCase().trim();
    for (const [pattern, crmStage] of Object.entries(STAGE_MAP)) {
        if (key.includes(pattern)) return crmStage;
    }
    return 'Inquiry'; // Default
}

function deduplicate(contacts) {
    const seen = new Map();
    contacts.forEach(c => {
        const key = (c.email || c.name || '').toLowerCase().trim();
        if (key && !seen.has(key)) {
            seen.set(key, c);
        }
    });
    return [...seen.values()];
}

function processProjects(rawProjects) {
    return rawProjects
        .filter(p => !p._raw) // Skip raw fallback entries
        .map(p => ({
            id: `HB-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            name: p.name || 'Unknown',
            email: p.email || '',
            phone: p.phone || '',
            eventDate: p.date || '',
            venue: p.venue || '',
            value: p.value || '',
            status: mapStage(p.stage),
            source: 'HoneyBook Import',
            importedAt: new Date().toISOString(),
            history: [{
                date: new Date().toISOString(),
                action: 'Imported from HoneyBook',
                originalStage: p.stage || 'unknown',
            }],
        }));
}

function processTemplates(rawTemplates) {
    return rawTemplates
        .filter(t => !t._raw)
        .map(t => ({
            name: t.name || 'Untitled Template',
            type: t.type || 'email',
            content: t.description || t.body || '',
            source: 'HoneyBook Import',
            importedAt: new Date().toISOString(),
        }));
}

// ─── Main ────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('  🔄 LUXE CRM: Data Processor');
console.log('═'.repeat(60));

// Check for extracted data
const files = {
    projects: join(DATA_DIR, 'honeybook-projects.json'),
    contacts: join(DATA_DIR, 'honeybook-contacts.json'),
    templates: join(DATA_DIR, 'honeybook-templates.json'),
    automations: join(DATA_DIR, 'honeybook-automations.json'),
};

let hasData = false;
for (const [key, path] of Object.entries(files)) {
    if (existsSync(path)) {
        hasData = true;
        console.log(`  ✅ Found: ${key}`);
    } else {
        console.log(`  ⚠️  Missing: ${key} (run extractor first)`);
    }
}

if (!hasData) {
    console.log('\n  ❌ No extracted data found!');
    console.log('  Run: node honeybook-extractor.js\n');
    process.exit(1);
}

// Process each data type
let totalImported = 0;

// Process Projects → Leads
if (existsSync(files.projects)) {
    console.log('\n📂 Processing Projects...');
    const raw = JSON.parse(readFileSync(files.projects, 'utf-8'));
    const processed = processProjects(raw);

    // Merge with existing leads
    let existing = [];
    if (existsSync(LEADS_FILE)) {
        existing = JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
    }

    // Add new leads (avoid duplicates by email)
    const existingEmails = new Set(existing.map(l => l.email?.toLowerCase()).filter(Boolean));
    const newLeads = processed.filter(p => !existingEmails.has(p.email?.toLowerCase()));

    const merged = [...existing, ...newLeads];
    writeFileSync(LEADS_FILE, JSON.stringify(merged, null, 2));

    console.log(`   📊 Raw entries: ${raw.length}`);
    console.log(`   ✅ New leads added: ${newLeads.length}`);
    console.log(`   📋 Total leads in CRM: ${merged.length}`);
    totalImported += newLeads.length;
}

// Process Contacts
if (existsSync(files.contacts)) {
    console.log('\n👥 Processing Contacts...');
    const raw = JSON.parse(readFileSync(files.contacts, 'utf-8'));
    const cleaned = deduplicate(raw.filter(c => !c._raw));
    writeFileSync(join(DATA_DIR, 'crm-contacts.json'), JSON.stringify(cleaned, null, 2));
    console.log(`   📊 Raw entries: ${raw.length}`);
    console.log(`   ✅ Deduplicated contacts: ${cleaned.length}`);
    totalImported += cleaned.length;
}

// Process Templates
if (existsSync(files.templates)) {
    console.log('\n📧 Processing Templates...');
    const raw = JSON.parse(readFileSync(files.templates, 'utf-8'));
    const processed = processTemplates(raw);
    writeFileSync(join(DATA_DIR, 'crm-templates.json'), JSON.stringify(processed, null, 2));
    console.log(`   ✅ Templates imported: ${processed.length}`);
    totalImported += processed.length;
}

// Process Automations (just clean copy for now)
if (existsSync(files.automations)) {
    console.log('\n⚡ Processing Automations...');
    const raw = JSON.parse(readFileSync(files.automations, 'utf-8'));
    const cleaned = raw.filter(a => !a._raw);
    writeFileSync(join(DATA_DIR, 'crm-automations.json'), JSON.stringify(cleaned, null, 2));
    console.log(`   ✅ Automations imported: ${cleaned.length}`);
    totalImported += cleaned.length;
}

console.log('\n' + '═'.repeat(60));
console.log(`  ✅ PROCESSING COMPLETE — ${totalImported} items imported`);
console.log('  Run: node dashboard.js — to see your full pipeline');
console.log('═'.repeat(60) + '\n');
