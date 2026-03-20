/**
 * AGENT 6: Review Outreach
 * ========================
 * Generates personalized review request messages for past clients.
 * Creates email/text templates optimized for getting Google reviews.
 * Usage: npm run review-outreach
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../output/outreach');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// Replace this with your actual Google review link
const REVIEW_LINK = 'https://g.page/djlakha/review';

// Add your past clients here
const CLIENTS = [
    { name: 'Priya & Raj', event: 'wedding reception', city: 'Austin', date: 'October 2024', type: 'Gujarati wedding' },
    { name: 'Anita & Kevin', event: 'sangeet night', city: 'Dallas', date: 'November 2024', type: 'fusion wedding' },
    { name: 'Simran & Arjun', event: 'wedding weekend', city: 'Houston', date: 'December 2024', type: 'Punjabi wedding' },
    // ADD MORE CLIENTS BELOW ↓↓↓
];

function generateEmailTemplate(client) {
    return `Subject: Would you leave us a quick review? ⭐

Hi ${client.name.split(' & ')[0]}!

I hope you and ${client.name.split(' & ')[1] || 'your family'} are doing amazing! I still think about your incredible ${client.event} in ${client.city} — what an unforgettable night that was.

I have a small favor to ask. If you have 2 minutes, would you leave a quick Google review about your experience? It would genuinely mean the world to me and help other couples find us for their special day.

👉 Leave a review here: ${REVIEW_LINK}

A few things you could mention (totally optional!):
• The city/venue (${client.city})
• The type of event (${client.type})
• What you loved most (music, energy, coordination, etc.)

Thank you so much for trusting me with your celebration. Wishing you both all the happiness! 🎉

With love,
DJ Lakha
www.djlakha.com
`;
}

function generateTextTemplate(client) {
    return `Hi ${client.name.split(' & ')[0]}! 🎶 It's DJ Lakha — hope you're doing great! I still love thinking about your ${client.event} in ${client.city}. Would you have 2 min to drop a quick Google review? It helps so much! 🙏 ${REVIEW_LINK}`;
}

function generateFollowUpTemplate(client) {
    return `Subject: Just a gentle reminder 😊

Hi ${client.name.split(' & ')[0]}!

I know life gets busy (especially after a wedding!) — just a gentle nudge about that Google review if you get a chance. Even a couple sentences means so much.

👉 ${REVIEW_LINK}

No pressure at all — I'm grateful either way. Hope married life is treating you wonderfully! 💛

— Lakha
`;
}

// --- MAIN ---
console.log('\n💌 DJ LAKHA Review Outreach Generator\n');

if (CLIENTS.length === 0) {
    console.log('⚠️  No clients added! Edit agents/review-outreach.js and add your past clients to the CLIENTS array.\n');
    process.exit(0);
}

console.log(`Generating outreach for ${CLIENTS.length} clients...\n`);

let allEmails = `# Review Outreach Messages\nGenerated: ${new Date().toLocaleString()}\n\n`;
allEmails += `## Google Review Link: ${REVIEW_LINK}\n\n---\n\n`;

CLIENTS.forEach((client, i) => {
    console.log(`  ✅ ${client.name} (${client.city}, ${client.date})`);

    const email = generateEmailTemplate(client);
    const text = generateTextTemplate(client);
    const followUp = generateFollowUpTemplate(client);

    allEmails += `## ${i + 1}. ${client.name}\n`;
    allEmails += `**Event:** ${client.event} | **City:** ${client.city} | **Date:** ${client.date}\n\n`;
    allEmails += `### Initial Email\n\`\`\`\n${email}\`\`\`\n\n`;
    allEmails += `### Text Message\n\`\`\`\n${text}\n\`\`\`\n\n`;
    allEmails += `### Follow-Up Email (send 1 week later)\n\`\`\`\n${followUp}\`\`\`\n\n---\n\n`;
});

writeFileSync(join(OUTPUT_DIR, 'review-outreach-messages.md'), allEmails);

// Tracking sheet
let tracker = `# Review Outreach Tracker\n\n`;
tracker += `| Client | City | Event | Sent Initial | Sent Follow-Up | Review Posted |\n`;
tracker += `|---|---|---|---|---|---|\n`;
CLIENTS.forEach(c => {
    tracker += `| ${c.name} | ${c.city} | ${c.event} | ☐ | ☐ | ☐ |\n`;
});
tracker += `\n**Target: 20 reviews in 3 months**\n`;
tracker += `**Current: 0 / 20**\n`;

writeFileSync(join(OUTPUT_DIR, 'review-tracker.md'), tracker);

console.log(`\n${'='.repeat(50)}`);
console.log(`📁 Messages saved: seo-agents/output/outreach/review-outreach-messages.md`);
console.log(`📋 Tracker saved: seo-agents/output/outreach/review-tracker.md`);
console.log(`\n🎯 ACTION ITEMS:`);
console.log(`   1. Edit agents/review-outreach.js → add ALL past clients`);
console.log(`   2. Set your Google review link (search "Google Business Profile" to get it)`);
console.log(`   3. Send initial emails this week`);
console.log(`   4. Send follow-ups 1 week later`);
console.log(`   5. Target: 20 reviews in 3 months`);
console.log(`${'='.repeat(50)}\n`);
