/**
 * DJ LAKHA: Command Center
 * ========================
 * Your daily business briefing. One command to see everything.
 * Runs: CRM Dashboard + Finance + Auto-Emailer + SEO Status
 *
 * Usage: node command-center.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const SEO_DIR = resolve(import.meta.dirname, '../seo-agents');

function load(file) {
    const p = join(DATA_DIR, file);
    if (!existsSync(p)) return null;
    try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

const NOW = new Date();
const hour = NOW.getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

const projects = load('crm-projects.json') || [];
const contacts = load('crm-contacts.json') || [];
const payments = load('crm-payments.json') || { paid: [], pending: [], late: [], imminent: [] };
const tasks = load('crm-tasks.json') || [];
const leads = load('leads.json') || [];
const summary = load('extraction-summary.json') || {};

// ─── Header ──────────────────────────────────────────────

console.log('\n');
console.log('  ╔══════════════════════════════════════════════════════╗');
console.log('  ║                                                      ║');
console.log('  ║        🤵  DJ LAKHA — COMMAND CENTER                 ║');
console.log('  ║                                                      ║');
console.log('  ╚══════════════════════════════════════════════════════╝');
console.log(`\n  ${greeting}, Lakha!`);
console.log(`  ${NOW.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`);

if (summary.extractedAt) {
    const syncAge = Math.round((NOW - new Date(summary.extractedAt)) / (1000 * 60 * 60));
    console.log(`  📡 Last HoneyBook sync: ${syncAge < 1 ? 'Just now' : syncAge + 'h ago'}`);
}

// ─── Daily Snapshot ──────────────────────────────────────

console.log('\n  ┌─────────────────────────────────────────────────────┐');
console.log('  │  📊 DAILY SNAPSHOT                                   │');
console.log('  ├─────────────────────────────────────────────────────┤');
console.log(`  │  Active Projects:  ${String(projects.length).padEnd(5)} │  Contacts: ${String(contacts.length).padEnd(13)}│`);
console.log(`  │  Open Tasks:       ${String(tasks.length).padEnd(5)} │  Late Payments: ${String(payments.late.length).padEnd(8)}│`);
console.log('  └─────────────────────────────────────────────────────┘');

// ─── Urgent Actions ──────────────────────────────────────

console.log('\n  ⚡ ACTION ITEMS FOR TODAY');
console.log('  ' + '─'.repeat(55));

let actionCount = 0;

// Late Payments
if (payments.late.length > 0) {
    payments.late.forEach(p => {
        actionCount++;
        console.log(`  🔴 OVERDUE: ${p.workspace_name || p.client_name || 'Payment'} requires follow-up`);
    });
}

// Imminent Payments
if (payments.imminent.length > 0) {
    payments.imminent.forEach(p => {
        actionCount++;
        console.log(`  🟡 UPCOMING: ${p.workspace_name || p.client_name || 'Payment'} — due soon`);
    });
}

// New Inquiries (created in last 3 days)
leads.forEach(l => {
    const daysAgo = Math.floor((NOW - new Date(l.createdAt)) / (1000 * 60 * 60 * 24));
    if ((l.status || '').toLowerCase().includes('inquiry') && daysAgo <= 3) {
        actionCount++;
        console.log(`  🔴 NEW LEAD: Reply to ${l.name} (${l.email}) — ${daysAgo}d ago`);
    }
});

// Overdue tasks
leads.forEach(l => {
    if (l.tasksOverdue > 0) {
        actionCount++;
        console.log(`  📋 TASKS: ${l.name} has ${l.tasksOverdue} overdue task(s)`);
    }
});

// Upcoming events (next 14 days)
projects.forEach(p => {
    if (!p.eventDate) return;
    const daysUntil = Math.floor((new Date(p.eventDate) - NOW) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 14) {
        actionCount++;
        const dayLabel = daysUntil === 0 ? '🎉 TODAY!' : daysUntil === 1 ? 'TOMORROW' : `in ${daysUntil} days`;
        console.log(`  📅 EVENT: ${p.eventName || p.clientName} — ${dayLabel} (${p.eventDate})`);
    }
});

if (actionCount === 0) {
    console.log('  ✨ All caught up! Focus on growth today.');
}

// ─── Pipeline View ───────────────────────────────────────

console.log('\n  📊 PIPELINE');
console.log('  ' + '─'.repeat(55));

const stages = {};
leads.forEach(l => {
    const s = l.status || 'Unknown';
    if (!stages[s]) stages[s] = [];
    stages[s].push(l);
});

Object.entries(stages).forEach(([stage, items]) => {
    const emoji = items.length > 0 ? '🔥' : '⚪';
    console.log(`  ${emoji} ${stage.padEnd(25)} ${items.length} client(s)`);
    items.forEach(l => {
        console.log(`     └─ ${l.name} ${l.eventDate ? '(' + l.eventDate + ')' : ''}`);
    });
});

// ─── Event Calendar ──────────────────────────────────────

const upcoming = projects
    .filter(p => p.eventDate && new Date(p.eventDate) >= NOW)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

if (upcoming.length > 0) {
    console.log('\n  📅 UPCOMING EVENTS');
    console.log('  ' + '─'.repeat(55));
    upcoming.forEach(p => {
        const daysUntil = Math.floor((new Date(p.eventDate) - NOW) / (1000 * 60 * 60 * 24));
        const bar = daysUntil <= 7 ? '🔴' : daysUntil <= 30 ? '🟡' : '🟢';
        console.log(`  ${bar} ${p.eventDate}  ${(p.eventName || p.clientName).padEnd(35)}  ${daysUntil}d`);
    });
}

// ─── Finance Quick Look ──────────────────────────────────

console.log('\n  💰 FINANCE');
console.log('  ' + '─'.repeat(55));
console.log(`  ✅ Paid:      ${payments.paid.length} payment(s)`);
console.log(`  ⏳ Pending:   ${payments.pending.length} payment(s)`);
console.log(`  🔴 Late:      ${payments.late.length} payment(s)`);
console.log(`  ⚡ Imminent:  ${payments.imminent.length} payment(s)`);

// ─── Quick Commands ──────────────────────────────────────

console.log('\n  ┌─────────────────────────────────────────────────────┐');
console.log('  │  🛠  QUICK COMMANDS                                  │');
console.log('  ├─────────────────────────────────────────────────────┤');
console.log('  │  npm run extract      Re-sync from HoneyBook        │');
console.log('  │  node auto-emailer.js Generate follow-up emails     │');
console.log('  │  node finance-tracker.js  Full financial report     │');
console.log('  │  node dashboard.js    Pipeline dashboard             │');
console.log('  │  npm run sync         Full sync + process + dash     │');
console.log('  └─────────────────────────────────────────────────────┘');
console.log('');
