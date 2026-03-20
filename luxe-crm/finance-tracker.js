/**
 * LUXE CRM: Finance Tracker
 * =========================
 * Revenue tracking, payment status, and projections.
 *
 * Usage: node finance-tracker.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, 'data');

function load(file) {
    const p = join(DATA_DIR, file);
    if (!existsSync(p)) return null;
    try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

const payments = load('crm-payments.json') || { paid: [], pending: [], late: [], imminent: [] };
const projects = load('crm-projects.json') || [];
const leads = load('leads.json') || [];

function extractAmount(payment) {
    // Try various field names for the dollar amount
    return payment.amount || payment.total || payment.price || payment.value || 0;
}

function sum(arr) {
    return arr.reduce((total, p) => total + (parseFloat(extractAmount(p)) || 0), 0);
}

console.log('\n' + '═'.repeat(60));
console.log('  💰 LUXE CRM: Finance Tracker');
console.log('═'.repeat(60));

// ─── Payment Overview ────────────────────────────────────

console.log('\n  📊 PAYMENT STATUS');
console.log('  ' + '─'.repeat(40));

const paidTotal = sum(payments.paid);
const pendingTotal = sum(payments.pending);
const lateTotal = sum(payments.late);
const imminentTotal = sum(payments.imminent);

console.log(`  ✅ Paid:        ${payments.paid.length} payments  ${paidTotal > 0 ? '$' + paidTotal.toLocaleString() : ''}`);
console.log(`  ⏳ Pending:     ${payments.pending.length} payments  ${pendingTotal > 0 ? '$' + pendingTotal.toLocaleString() : ''}`);
console.log(`  🔴 Late:        ${payments.late.length} payments  ${lateTotal > 0 ? '$' + lateTotal.toLocaleString() : ''}`);
console.log(`  ⚡ Imminent:    ${payments.imminent.length} payments  ${imminentTotal > 0 ? '$' + imminentTotal.toLocaleString() : ''}`);

if (payments.late.length > 0) {
    console.log('\n  ⚠️  OVERDUE PAYMENTS — ACTION NEEDED:');
    payments.late.forEach((p, i) => {
        console.log(`     ${i + 1}. ${p.workspace_name || p.client_name || 'Client'} — $${extractAmount(p) || '?'}`);
    });
}

// ─── Pipeline Revenue ────────────────────────────────────

console.log('\n  📈 PIPELINE BY STAGE');
console.log('  ' + '─'.repeat(40));

const stageGroups = {};
leads.forEach(l => {
    const stage = l.status || 'Unknown';
    if (!stageGroups[stage]) stageGroups[stage] = [];
    stageGroups[stage].push(l);
});

Object.entries(stageGroups).forEach(([stage, items]) => {
    console.log(`  ${stage}: ${items.length} clients`);
    items.forEach(l => {
        console.log(`     ${l.name} — ${l.eventDate || 'No date'} ${l.value ? '$' + l.value : ''}`);
    });
});

// ─── Monthly Calendar ────────────────────────────────────

console.log('\n  📅 EVENT CALENDAR 2026');
console.log('  ' + '─'.repeat(40));

const months = {};
projects.forEach(p => {
    if (!p.eventDate) return;
    const month = new Date(p.eventDate).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!months[month]) months[month] = [];
    months[month].push(p);
});

Object.entries(months)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .forEach(([month, events]) => {
        console.log(`\n  📌 ${month} (${events.length} events)`);
        events.forEach(e => {
            const day = new Date(e.eventDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            console.log(`     ${day} — ${e.eventName || e.clientName} ${e.eventLocation ? '@ ' + e.eventLocation : ''}`);
        });
    });

// ─── Quick Stats ─────────────────────────────────────────

console.log('\n  ' + '─'.repeat(40));
console.log(`  📊 Total Active Projects: ${projects.length}`);
console.log(`  👥 Total Contacts: ${load('crm-contacts.json')?.length || 0}`);
console.log(`  📋 Active Tasks: ${load('crm-tasks.json')?.length || 0}`);

console.log('\n' + '═'.repeat(60) + '\n');
