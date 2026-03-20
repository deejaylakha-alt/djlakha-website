/**
 * LUXE CRM: Dashboard Agent
 * =========================
 * The "Brain" — shows your entire business at a glance.
 * Reads from HoneyBook extracted data + local CRM data.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const LEADS_FILE = join(DATA_DIR, 'leads.json');

const STAGES = [
    'Inquiry',
    'Discovery Call',
    'Proposal Sent',
    'Booked / Deposit',
    'Event Planning',
    'Event Day',
    'Post-Event / Review',
];

function loadJSON(filename) {
    const path = join(DATA_DIR, filename);
    if (!existsSync(path)) return [];
    try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return []; }
}

// ─── Main Dashboard ──────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('  🤵 DJ LAKHA: LUXE CRM DASHBOARD');
console.log(`  ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`);
console.log('═'.repeat(60));

// Load data
const leads = loadJSON('leads.json');
const contacts = loadJSON('crm-contacts.json');
const templates = loadJSON('crm-templates.json');
const automations = loadJSON('crm-automations.json');
const summary = loadJSON('extraction-summary.json');

// Data Source Info
if (summary.extractedAt) {
    console.log(`\n  📡 Last HoneyBook Sync: ${new Date(summary.extractedAt).toLocaleString()}`);
} else {
    console.log('\n  ⚠️  No HoneyBook data yet. Run: npm run extract');
}

// ─── Pipeline View ───────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('  📊 PIPELINE');
console.log('─'.repeat(60));

const stageCounts = {};
STAGES.forEach(s => stageCounts[s] = 0);
leads.forEach(l => {
    if (stageCounts[l.status] !== undefined) stageCounts[l.status]++;
    else stageCounts['Inquiry']++;
});

STAGES.forEach(stage => {
    const count = stageCounts[stage];
    const bar = '█'.repeat(count) + '░'.repeat(Math.max(0, 10 - count));
    const emoji = count > 0 ? '🔥' : '⚪';
    console.log(`  ${emoji} ${stage.padEnd(22)} ${bar} ${count}`);
});
console.log(`\n  Total Leads: ${leads.length}`);

// ─── Urgent Actions ──────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('  ⚡ ACTION ITEMS — DO TODAY');
console.log('─'.repeat(60));

const inquiries = leads.filter(l => l.status === 'Inquiry');
const proposals = leads.filter(l => l.status === 'Proposal Sent');
const booked = leads.filter(l => l.status === 'Booked / Deposit' || l.status === 'Event Planning');
const postEvent = leads.filter(l => l.status === 'Post-Event / Review');

if (inquiries.length > 0) {
    console.log(`\n  🔴 RESPOND TO NEW INQUIRIES (${inquiries.length}):`);
    inquiries.forEach(l => {
        console.log(`     → ${l.name} ${l.email ? `(${l.email})` : ''} ${l.eventDate ? `— Event: ${l.eventDate}` : ''}`);
    });
}

if (proposals.length > 0) {
    console.log(`\n  🟡 FOLLOW UP ON PROPOSALS (${proposals.length}):`);
    proposals.forEach(l => {
        console.log(`     → ${l.name} ${l.email ? `(${l.email})` : ''}`);
    });
}

if (postEvent.length > 0) {
    console.log(`\n  🟢 REQUEST REVIEWS FROM (${postEvent.length}):`);
    postEvent.forEach(l => {
        console.log(`     → ${l.name} — Send review request email!`);
    });
}

if (inquiries.length === 0 && proposals.length === 0 && postEvent.length === 0) {
    console.log('\n  ✨ All caught up! Focus on SEO & marketing today.');
}

// ─── Upcoming Events ─────────────────────────────────────

const upcoming = booked
    .filter(l => l.eventDate)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

if (upcoming.length > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('  📅 UPCOMING EVENTS');
    console.log('─'.repeat(60));
    upcoming.forEach(l => {
        console.log(`  🎵 ${l.eventDate.padEnd(15)} ${l.name} ${l.venue ? `@ ${l.venue}` : ''}`);
    });
}

// ─── Data Summary ────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log('  📦 CRM DATA SUMMARY');
console.log('─'.repeat(60));
console.log(`  Leads:       ${leads.length}`);
console.log(`  Contacts:    ${contacts.length}`);
console.log(`  Templates:   ${templates.length}`);
console.log(`  Automations: ${automations.length}`);

// ─── Quick Revenue Check ─────────────────────────────────

const bookedLeads = leads.filter(l =>
    l.status === 'Booked / Deposit' || l.status === 'Event Planning' || l.status === 'Event Day'
);
const values = bookedLeads
    .map(l => parseFloat((l.value || '').replace(/[^0-9.]/g, '')))
    .filter(v => !isNaN(v) && v > 0);

if (values.length > 0) {
    const total = values.reduce((a, b) => a + b, 0);
    console.log(`\n  💰 Booked Revenue: $${total.toLocaleString()}`);
}

console.log('\n' + '═'.repeat(60));
console.log('  Commands:');
console.log('    npm run extract   — Sync from HoneyBook');
console.log('    npm run process   — Process extracted data');
console.log('    npm run dashboard — View this dashboard');
console.log('    npm run sync      — Do all three at once');
console.log('═'.repeat(60) + '\n');
