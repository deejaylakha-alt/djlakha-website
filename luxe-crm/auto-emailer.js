/**
 * LUXE CRM: Auto-Emailer
 * =======================
 * Detects which clients need follow-ups based on pipeline stage + time elapsed.
 * Generates ready-to-copy emails using your luxury brand voice.
 *
 * Usage: node auto-emailer.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const OUTPUT_DIR = resolve(import.meta.dirname, 'output');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const LEADS_FILE = join(DATA_DIR, 'leads.json');
const leads = existsSync(LEADS_FILE) ? JSON.parse(readFileSync(LEADS_FILE, 'utf-8')) : [];

const NOW = new Date();

// ─── Email Templates ─────────────────────────────────────

const TEMPLATES = {
    'inquiry_reply': {
        subject: 'Re: Your Wedding Inquiry — DJ LAKHA',
        body: (lead) => `Hi ${lead.name.split(' ')[0]}!

Thank you so much for reaching out about your ${lead.eventDate ? formatDate(lead.eventDate) : ''} celebration! I checked my calendar and I am currently available! 🎶

I'd love to learn more about the vibe you're envisioning. Are you free for a quick 15-minute Discovery Call this week? I'll share some ideas and we can see if we're the right fit.

Looking forward to connecting!

Warmly,
Lakha
DJ LAKHA | Luxury Indian Wedding Entertainment
www.djlakha.com`,
    },

    'proposal_follow_up': {
        subject: 'Following Up — DJ LAKHA Proposal',
        body: (lead) => `Hi ${lead.name.split(' ')[0]}!

Just wanted to follow up on the proposal I sent for your ${lead.eventName || 'event'}. I know wedding planning can be overwhelming, so no rush — but I'm here if you have any questions!

A few couples have reached out for the same date, so I'd love to secure your spot if you're interested.

Talk soon!

Best,
Lakha
DJ LAKHA | Luxury Indian Wedding Entertainment`,
    },

    'music_questionnaire': {
        subject: 'Music Questionnaire — Let\'s Plan Your Soundtrack! 🎵',
        body: (lead) => `Hi ${lead.name.split(' ')[0]}!

We're getting close to your big day${lead.eventDate ? ' on ' + formatDate(lead.eventDate) : ''}! To make sure every moment has the perfect soundtrack, could you take a few minutes to fill out the music questionnaire?

It covers:
• Must-Play songs (the ones that get your crew on the floor)
• Do-Not-Play list (equally important!)
• Special moment songs — Baraat, Grand Entrance, First Dance
• Any cultural/regional music preferences

I'll build your custom setlist from there. Can't wait to make it unforgettable!

— Lakha`,
    },

    'review_request': {
        subject: 'How Was Your Experience? — DJ LAKHA',
        body: (lead) => `Hi ${lead.name.split(' ')[0]}!

I hope married life is treating you well! 🥂

It was truly an honor to be part of your celebration${lead.eventName ? ' (' + lead.eventName + ')' : ''}. If you have a free moment, I'd be so grateful if you could share your experience with a quick Google review:

👉 [Your Google Review Link Here]

Your words help other couples find the right entertainment for their big day. A short review goes such a long way!

Thank you again for trusting me with your celebration.

With gratitude,
Lakha`,
    },

    'payment_reminder': {
        subject: 'Friendly Payment Reminder — DJ LAKHA',
        body: (lead) => `Hi ${lead.name.split(' ')[0]}!

Just a friendly reminder that your payment is coming due. You can process it directly through your HoneyBook portal at any time.

If you have any questions or need to adjust the payment schedule, just let me know — happy to work with you!

Best,
Lakha
DJ LAKHA Entertainment`,
    },
};

function formatDate(dateStr) {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
}

function daysSince(dateStr) {
    const d = new Date(dateStr);
    return Math.floor((NOW - d) / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr) {
    const d = new Date(dateStr);
    return Math.floor((d - NOW) / (1000 * 60 * 60 * 24));
}

// ─── Determine Actions ──────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('  📧 LUXE CRM: Auto-Emailer');
console.log('═'.repeat(60));

const actions = [];

leads.forEach(lead => {
    const stage = (lead.status || '').toLowerCase();
    const created = daysSince(lead.createdAt);
    const eventDays = lead.eventDate ? daysUntil(lead.eventDate) : null;

    // New inquiries — reply within 24 hours
    if ((stage.includes('inquiry') || stage === 'active') && created <= 3) {
        actions.push({ lead, template: 'inquiry_reply', urgency: '🔴 URGENT', reason: `New inquiry (${created}d ago)` });
    }

    // Proposal follow-ups — if 3+ days since proposal sent
    if (stage.includes('proposal') && !stage.includes('signed') && created >= 3) {
        actions.push({ lead, template: 'proposal_follow_up', urgency: '🟡 FOLLOW UP', reason: `Proposal sent ${created}d ago` });
    }

    // Music questionnaire — 6 weeks before event
    if ((stage.includes('retainer') || stage.includes('planning') || stage.includes('booked') || stage.includes('signed'))
        && eventDays !== null && eventDays <= 42 && eventDays > 7) {
        actions.push({ lead, template: 'music_questionnaire', urgency: '🟢 PREP', reason: `Event in ${eventDays} days` });
    }

    // Review request — after event
    if ((stage.includes('closed') || stage.includes('complete'))
        || (eventDays !== null && eventDays < -3)) {
        actions.push({ lead, template: 'review_request', urgency: '⭐ REVIEW', reason: 'Post-event review request' });
    }

    // Payment reminders
    if (lead.tasksOverdue > 0) {
        actions.push({ lead, template: 'payment_reminder', urgency: '💰 PAYMENT', reason: `${lead.tasksOverdue} overdue tasks` });
    }
});

// Generate output
if (actions.length === 0) {
    console.log('\n  ✨ No follow-ups needed right now! All caught up.');
} else {
    console.log(`\n  📬 ${actions.length} emails ready to send:\n`);

    let output = `# Auto-Generated Emails\n`;
    output += `**Generated:** ${NOW.toLocaleString()}\n\n`;

    actions.forEach((a, i) => {
        const t = TEMPLATES[a.template];
        const email = t.body(a.lead);

        console.log(`  ${a.urgency} ${a.lead.name} — ${a.reason}`);
        console.log(`      Subject: ${t.subject}`);
        console.log(`      To: ${a.lead.email}\n`);

        output += `---\n\n## ${i + 1}. ${a.urgency} ${a.lead.name}\n`;
        output += `**To:** ${a.lead.email}\n`;
        output += `**Subject:** ${t.subject}\n`;
        output += `**Reason:** ${a.reason}\n\n`;
        output += `\`\`\`\n${email}\n\`\`\`\n\n`;
    });

    const outPath = join(OUTPUT_DIR, `emails-${new Date().toISOString().split('T')[0]}.md`);
    writeFileSync(outPath, output);
    console.log(`  📝 All emails saved to: ${outPath}`);
}

console.log('\n' + '═'.repeat(60) + '\n');
