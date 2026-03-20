/**
 * AGENT 7: Citation Builder
 * =========================
 * Generates directory listing profiles for wedding directories.
 * Creates consistent NAP (Name, Address, Phone) profiles.
 * Usage: npm run build-citations
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../output/citations');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const BUSINESS_INFO = {
    name: 'DJ LAKHA',
    owner: 'Lakha Singh',
    website: 'https://www.djlakha.com',
    email: '', // ADD YOUR EMAIL
    phone: '', // ADD YOUR PHONE
    city: 'Austin',
    state: 'TX',
    serviceAreas: ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Fort Worth'],
    categories: ['Wedding DJ', 'Indian Wedding DJ', 'Entertainment', 'MC/Emcee'],
    instagram: 'https://www.instagram.com/deejaylakha/',
    soundcloud: 'https://soundcloud.com/dj-lakha',
};

const DIRECTORIES = [
    {
        name: 'Google Business Profile',
        url: 'https://business.google.com',
        priority: '🔴 CRITICAL',
        instructions: [
            'Go to business.google.com and sign in',
            `Search for "${BUSINESS_INFO.name}" — claim if exists, or create new`,
            `Business name: ${BUSINESS_INFO.name}`,
            'Category: Disc Jockey (primary), Wedding DJ, Entertainment Agency',
            `Service areas: ${BUSINESS_INFO.serviceAreas.join(', ')}`,
            'Add 20+ high-quality photos',
            'Write a keyword-rich description (see below)',
            'Post weekly updates (event photos, tips)',
        ],
    },
    {
        name: 'The Knot',
        url: 'https://www.theknot.com/marketplace/signup',
        priority: '🟡 HIGH',
        instructions: [
            'Create a vendor profile',
            'Category: Wedding DJs',
            `Location: ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state}`,
            'Upload portfolio photos',
            'Add pricing range',
            'Request reviews from past clients via The Knot',
        ],
    },
    {
        name: 'WeddingWire',
        url: 'https://www.weddingwire.com/vendor/signup',
        priority: '🟡 HIGH',
        instructions: [
            'Create a vendor profile',
            'Category: Wedding DJs & MCs',
            'Upload portfolio and videos',
            'Respond to all inquiries within 24 hours',
        ],
    },
    {
        name: 'Zola',
        url: 'https://www.zola.com/wedding-vendors',
        priority: '🟢 MEDIUM',
        instructions: ['Create vendor listing', 'Category: Music & Entertainment'],
    },
    {
        name: 'Maharani Weddings',
        url: 'https://www.maharaniweddings.com',
        priority: '🔴 CRITICAL (Indian weddings)',
        instructions: [
            'Submit real wedding features',
            'Get listed in vendor directory',
            'This is the #1 Indian wedding blog — a backlink here is gold',
        ],
    },
    {
        name: 'South Asian Bride Magazine',
        url: 'https://southasianbride.com',
        priority: '🟡 HIGH',
        instructions: [
            'Submit real wedding features with professional photos',
            'Apply for vendor listing',
        ],
    },
    {
        name: 'The Desi Bride',
        url: 'https://thedesibride.com',
        priority: '🟡 HIGH',
        instructions: ['Submit vendor listing', 'Submit real wedding stories'],
    },
    {
        name: 'Yelp',
        url: 'https://biz.yelp.com',
        priority: '🟢 MEDIUM',
        instructions: ['Claim or create business', 'Category: DJs', 'Respond to all reviews'],
    },
];

const GBP_DESCRIPTION = `DJ Lakha is Texas's premier Indian Wedding DJ, specializing in Bollywood, Bhangra, fusion, and South Asian wedding entertainment. Based in Austin and serving Dallas, Houston, San Antonio, Fort Worth, and destination weddings worldwide.

Services include:
• Indian-American Fusion Wedding DJ
• Punjabi & Sikh Wedding DJ (Bhangra, Live Dhol coordination)
• Gujarati Wedding DJ (Garba, Raas, Sanedo)
• South Indian Wedding DJ (Tamil, Telugu, Malayalam)
• Bengali & Regional Wedding DJ
• Professional MC/Emcee Services
• Premium Sound Systems & Intelligent Lighting
• LED Production & Uplighting
• Destination Wedding DJ Services

When you book DJ Lakha, you get DJ Lakha himself — a boutique, personalized experience with a trained percussionist who reads every crowd perfectly. From intimate Sangeet nights to grand Reception celebrations across Texas and beyond.

Book your consultation at www.djlakha.com`;

// --- MAIN ---
console.log('\n🏗️  DJ LAKHA Citation Builder\n');

let guide = `# Citation & Directory Listing Guide\n`;
guide += `**Generated:** ${new Date().toLocaleString()}\n\n`;
guide += `## Business Information (Keep Consistent Everywhere!)\n\n`;
guide += `| Field | Value |\n|---|---|\n`;
guide += `| Business Name | ${BUSINESS_INFO.name} |\n`;
guide += `| Owner | ${BUSINESS_INFO.owner} |\n`;
guide += `| Website | ${BUSINESS_INFO.website} |\n`;
guide += `| City | ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} |\n`;
guide += `| Service Areas | ${BUSINESS_INFO.serviceAreas.join(', ')} |\n`;
guide += `| Instagram | ${BUSINESS_INFO.instagram} |\n\n`;
guide += `---\n\n`;

guide += `## Google Business Profile Description\n`;
guide += `*Copy and paste this into your GBP:*\n\n`;
guide += `\`\`\`\n${GBP_DESCRIPTION}\n\`\`\`\n\n---\n\n`;

guide += `## Directory Listings (in priority order)\n\n`;

DIRECTORIES.forEach((dir, i) => {
    console.log(`  ${dir.priority} ${dir.name}: ${dir.url}`);

    guide += `### ${i + 1}. ${dir.name} ${dir.priority}\n`;
    guide += `**URL:** ${dir.url}\n`;
    guide += `**Status:** ☐ Not Started\n\n`;
    guide += `**Steps:**\n`;
    dir.instructions.forEach(step => {
        guide += `- [ ] ${step}\n`;
    });
    guide += '\n---\n\n';
});

// Progress tracker
guide += `## Progress Tracker\n\n`;
guide += `| Directory | Created | Photos | Reviews | Backlink |\n`;
guide += `|---|---|---|---|---|\n`;
DIRECTORIES.forEach(dir => {
    guide += `| ${dir.name} | ☐ | ☐ | ☐ | ☐ |\n`;
});

guide += `\n**Goal: Complete all CRITICAL listings within 2 weeks.**\n`;

writeFileSync(join(OUTPUT_DIR, 'citation-guide.md'), guide);

console.log(`\n${'='.repeat(50)}`);
console.log(`📁 Guide saved: seo-agents/output/citations/citation-guide.md`);
console.log(`\n🎯 START WITH:`);
console.log(`   1. 🔴 Google Business Profile (most important!)`);
console.log(`   2. 🔴 Maharani Weddings (best Indian wedding backlink)`);
console.log(`   3. 🟡 The Knot + WeddingWire (wedding directories)`);
console.log(`${'='.repeat(50)}\n`);
