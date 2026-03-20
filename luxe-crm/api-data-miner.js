/**
 * LUXE CRM: API Data Miner
 * ========================
 * Mines the captured HoneyBook API responses for structured data.
 * Extracts: Projects, Contacts, Payments, Automations, Tasks
 *
 * Usage: node api-data-miner.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const API_FILE = join(DATA_DIR, 'honeybook-api-responses.json');

if (!existsSync(API_FILE)) {
    console.error('❌ No API data found. Run: npm run extract');
    process.exit(1);
}

const apiData = JSON.parse(readFileSync(API_FILE, 'utf-8'));

function save(filename, data) {
    const p = join(DATA_DIR, filename);
    writeFileSync(p, JSON.stringify(data, null, 2));
    const c = Array.isArray(data) ? data.length + ' items' : 'object';
    console.log(`   💾 ${filename} (${c})`);
}

// ─── Stage ID Mapping ────────────────────────────────────
// Map HoneyBook stage IDs to readable names

const STAGE_NAMES = {
    '_INQUIRY_': 'Inquiry',
    'Follow up/ Phone Cal': 'Follow Up / Phone Call',
    '_PROPOSAL_SENT_': 'Proposal Sent',
    'Uncertainty': 'Uncertainty',
    'Certain': 'Certain',
    '_PROPOSAL_SIGNED_': 'Proposal Signed',
    '_RETAINER_PAID_': 'Retainer Paid',
    '_PLANNING_': 'Planning',
    '_CLOSED_': 'Closed',
    '2025 Booked': '2025 Booked',
    'NOT AVAILABLE': 'Not Available',
};

// Build stage ID → name map from pipeline metadata
// Build stage ID → name map from pipeline metadata
// Scan ALL pipeline-related responses for stage definitions
const pipelineMeta = apiData.filter(r => r.url.includes('search/pipeline') || r.url.includes('company_pipeline'));
const stageIdToName = {};

pipelineMeta.forEach(resp => {
    const d = resp.data;
    // Check direct property or nested in data
    const stages = d.user_pipeline_stages || d.stages || d.data?.user_pipeline_stages;

    if (Array.isArray(stages)) {
        stages.forEach(s => {
            stageIdToName[s._id] = s.name || s.title || 'Unknown';
        });
    }
});

console.log(`   📝 Found ${Object.keys(stageIdToName).length} pipeline stages`);

function resolveStage(pipelineData) {
    if (!pipelineData?.current_stage) return 'Inquiry'; // Default new items to Inquiry
    const stageId = pipelineData.current_stage.stage_id;
    const name = stageIdToName[stageId];

    if (name) return name;
    return 'Active';
}

// ─── 1. Extract Projects ─────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('  ⛏  LUXE CRM: API Data Miner');
console.log('═'.repeat(60));

console.log('\n📂 Mining Projects...');
const pipelineResponses = apiData.filter(r =>
    r.url.includes('search/pipeline') && !r.url.includes('company_pipeline')
);

const projects = [];
const seenProjectIds = new Set();

pipelineResponses.forEach(resp => {
    const items = resp.data?.data;
    if (!Array.isArray(items)) return;

    items.forEach(p => {
        if (seenProjectIds.has(p._id)) return;
        seenProjectIds.add(p._id);

        // Find the client (member who isn't Lakha)
        const client = p.members?.find(m => m.email !== 'info@djlakha.com') || p.members?.[1] || {};

        projects.push({
            id: p._id,
            eventName: p.event?.event_name || `${client.full_name}'s Event`,
            clientName: client.full_name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
            clientEmail: client.email || '',
            clientPhone: client.phone_number || '',
            eventDate: p.event?.event_date?.substring(0, 10) || '',
            eventEndDate: p.event?.event_end_date?.substring(0, 10) || '',
            eventType: p.event?.event_type || '',
            eventLocation: p.event?.event_location || '',
            eventBudget: p.event?.event_budget || null,
            eventGuests: p.event?.event_guests || null,
            stage: resolveStage(p.workspace_pipeline_data),
            source: p.event?.event_source || p.workspace_source || '',
            leadSource: p.event?.lead_source || p.event?.how_client_hear_about || '',
            createdAt: p.created_at,
            isActive: p.active_state,
            tasksOverdue: p.workspace_tasks_overdue_count || 0,
            tasksTotal: p.workspace_tasks_total_count || 0,
            tasksCompleted: p.workspace_tasks_completed_count || 0,
            tags: p.tags || [],
            recentActivity: p.recent_activity_type || '',
            recentActivityDate: p.recent_activity_timestamp || '',
        });
    });
});

save('crm-projects.json', projects);
console.log(`   ✅ ${projects.length} projects extracted`);

// ─── 2. Extract Contacts ─────────────────────────────────

console.log('\n👥 Mining Contacts...');
const contactResponses = apiData.filter(r =>
    r.url.includes('/contacts') && r.url.includes('api.honeybook.com')
);

const contacts = [];
const seenEmails = new Set();

contactResponses.forEach(resp => {
    const items = resp.data?.items || resp.data?.data || resp.data?.contacts;
    if (!Array.isArray(items)) return;

    items.forEach(c => {
        const email = c.email?.toLowerCase();
        if (email && !seenEmails.has(email) && email !== 'info@djlakha.com') {
            seenEmails.add(email);
            contacts.push({
                id: c._id,
                name: c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
                email: c.email,
                phone: c.phone_number || '',
                company: c.organization_name || c.company_name || '',
                source: c.source || '',
                createdAt: c.created_at || '',
            });
        }
    });
});

// Also add contacts from projects that aren't in contact list
projects.forEach(p => {
    const email = p.clientEmail?.toLowerCase();
    if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        contacts.push({
            id: p.id + '_contact',
            name: p.clientName,
            email: p.clientEmail,
            phone: p.clientPhone,
            company: '',
            source: 'project',
            createdAt: p.createdAt,
        });
    }
});

save('crm-contacts.json', contacts);
console.log(`   ✅ ${contacts.length} unique contacts`);

// ─── 3. Extract Payments ─────────────────────────────────

console.log('\n💰 Mining Payments...');
const paymentResponses = apiData.filter(r =>
    r.url.includes('reports/payments') || r.url.includes('reports/bookings')
);

const payments = { paid: [], pending: [], late: [], imminent: [] };

paymentResponses.forEach(resp => {
    const d = resp.data;
    if (d.paid_payments) payments.paid.push(...d.paid_payments);
    if (d.pending_payments) payments.pending.push(...d.pending_payments);
    if (d.late_payments) payments.late.push(...d.late_payments);
    if (d.imminent_payments) payments.imminent.push(...d.imminent_payments);
});

save('crm-payments.json', payments);
console.log(`   ✅ Paid: ${payments.paid.length}, Pending: ${payments.pending.length}, Late: ${payments.late.length}, Imminent: ${payments.imminent.length}`);

// ─── 4. Extract Automations ──────────────────────────────

console.log('\n⚡ Mining Automations...');
const autoResponses = apiData.filter(r => r.url.includes('automations/workflows'));

const automations = [];
autoResponses.forEach(resp => {
    const items = resp.data?.data || resp.data?.workflows || [];
    if (!Array.isArray(items)) return;
    items.forEach(a => {
        automations.push({
            id: a._id || a.id,
            name: a.name || a.title || 'Unnamed',
            active: a.active ?? a.is_active ?? null,
            trigger: a.trigger_type || a.trigger || '',
            createdAt: a.created_at || '',
        });
    });
});

save('crm-automations.json', automations);
console.log(`   ✅ ${automations.length} automations`);

// ─── 5. Extract Tasks ────────────────────────────────────

console.log('\n📋 Mining Tasks...');
const taskResponses = apiData.filter(r => r.url.includes('tasks'));

const tasks = [];
taskResponses.forEach(resp => {
    const items = resp.data?.data || resp.data?.tasks || resp.data?.items;
    if (!Array.isArray(items)) return;
    items.forEach(t => {
        tasks.push({
            id: t._id || t.id,
            title: t.title || t.name || t.description || '',
            project: t.workspace_name || t.project_name || '',
            dueDate: t.due_date || '',
            status: t.status || t.completed ? 'done' : 'pending',
            priority: t.priority || '',
        });
    });
});

save('crm-tasks.json', tasks);
console.log(`   ✅ ${tasks.length} tasks`);

// ─── 6. Extract Company Profile ──────────────────────────

console.log('\n🏢 Mining Company Profile...');
const companyResp = apiData.filter(r => r.url.includes('/companies/') && r.url.includes('api.honeybook.com'));

let companyProfile = {};
if (companyResp.length > 0) {
    const c = companyResp[0].data;
    companyProfile = {
        name: c.company_name || c.name,
        about: c.about,
        description: c.description,
        website: c.website_url,
        city: c.city,
        state: c.state,
        address: c.street_address,
        zipCode: c.zip_code,
        timezone: c.default_timezone,
        schedulerUrl: c.scheduler_url,
    };
}
save('crm-company.json', companyProfile);

// ─── 7. Build CRM Leads from Projects ───────────────────

console.log('\n🔄 Building CRM Lead Database...');
const leads = projects.map(p => ({
    id: `HB-${p.id}`,
    name: p.clientName,
    email: p.clientEmail,
    phone: p.clientPhone,
    eventDate: p.eventDate,
    eventName: p.eventName,
    venue: p.eventLocation,
    value: '',
    status: p.stage,
    source: p.source || p.leadSource,
    createdAt: p.createdAt,
    isActive: p.isActive,
    tasksOverdue: p.tasksOverdue,
    history: [{
        date: new Date().toISOString(),
        action: 'Imported from HoneyBook API',
        stage: p.stage,
    }],
}));

save('leads.json', leads);

// ─── Summary ─────────────────────────────────────────────

const summary = {
    extractedAt: new Date().toISOString(),
    version: 3,
    minedFrom: 'HoneyBook API responses',
    counts: {
        projects: projects.length,
        contacts: contacts.length,
        paymentsPaid: payments.paid.length,
        paymentsPending: payments.pending.length,
        paymentsLate: payments.late.length,
        automations: automations.length,
        tasks: tasks.length,
    },
};
save('extraction-summary.json', summary);

console.log('\n' + '═'.repeat(60));
console.log('  ✅ API DATA MINING COMPLETE');
console.log('═'.repeat(60));
console.log(`\n  📂 Projects:     ${projects.length}`);
console.log(`  👥 Contacts:     ${contacts.length}`);
console.log(`  💰 Payments:     ${payments.paid.length + payments.pending.length + payments.late.length + payments.imminent.length}`);
console.log(`  ⚡ Automations:  ${automations.length}`);
console.log(`  📋 Tasks:        ${tasks.length}`);
console.log(`\n  Next: node dashboard.js`);
console.log('═'.repeat(60) + '\n');
