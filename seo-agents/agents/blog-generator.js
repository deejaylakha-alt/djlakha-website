/**
 * AGENT 5: Blog Generator
 * =======================
 * Generates SEO-optimized blog post templates for Indian wedding topics.
 * Each post targets specific long-tail keywords.
 * Usage: npm run generate-blog
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const OUTPUT_DIR = resolve(import.meta.dirname, '../output/blog-posts');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const BLOG_TEMPLATES = [
    {
        slug: 'best-indian-wedding-venues-austin-2025',
        title: 'Best Indian Wedding Venues in Austin 2025 — DJ Lakha\'s Top Picks',
        keywords: ['Indian wedding venues Austin', 'South Asian wedding Austin TX', 'Indian wedding DJ Austin'],
        metaDesc: 'Discover the best Indian wedding venues in Austin, Texas for 2025. DJ Lakha shares insider tips on the top venues for Sangeet, Baraat, and Reception.',
        sections: [
            { h2: 'Why Austin Is Perfect for Indian Weddings', content: 'Write 200-300 words about Austin\'s appeal: Hill Country venues, diverse food scene, airport accessibility for out-of-town guests.' },
            { h2: 'Top 10 Indian Wedding Venues in Austin', content: 'List and describe 10 venues. For each: name, capacity, what makes it great for Indian weddings, parking/noise considerations, approximate cost range.' },
            { h2: 'What to Look for in an Indian Wedding Venue', content: 'Outdoor Baraat space, kitchen for caterers, sound/noise policies, setup time, venue coordinator experience with Indian weddings.' },
            { h2: 'DJ Lakha\'s Venue Tips', content: 'Personal recommendations based on experience DJing at these venues. Mention acoustic qualities, power availability, and guest flow.' },
            { h2: 'Book Your Austin Indian Wedding DJ', content: 'CTA paragraph linking to book.html.' },
        ],
    },
    {
        slug: 'indian-wedding-dj-cost-texas-2025',
        title: 'Indian Wedding DJ Cost in Texas 2025 — Complete Pricing Guide',
        keywords: ['Indian wedding DJ cost', 'how much does an Indian wedding DJ cost', 'Indian wedding DJ pricing Texas'],
        metaDesc: 'What does an Indian wedding DJ cost in Texas in 2025? Complete pricing guide covering Sangeet, Reception, Baraat, and full-service packages.',
        sections: [
            { h2: 'Average Indian Wedding DJ Costs in Texas (2025)', content: 'Breakdown: Sangeet ($X-$X), Reception ($X-$X), Full Weekend ($X-$X). Compare budget vs. mid-range vs. luxury.' },
            { h2: 'What\'s Included in DJ Packages', content: 'Sound system, lighting, MC services, music planning consultation, setup/teardown, travel fees.' },
            { h2: 'Factors That Affect Pricing', content: 'Event duration, venue size, production add-ons (LED walls, uplighting, dhol coordination), travel distance, peak season.' },
            { h2: 'Budget vs. Luxury: What\'s the Difference?', content: 'Compare basic DJ vs. premium entertainment experience. Emphasize value of experienced Indian wedding DJ.' },
            { h2: 'Get a Custom Quote from DJ Lakha', content: 'CTA linking to book.html.' },
        ],
    },
    {
        slug: 'top-indian-wedding-venues-dallas-fort-worth',
        title: 'Top 10 Indian Wedding Venues in Dallas-Fort Worth 2025',
        keywords: ['Indian wedding venues Dallas', 'Indian wedding venues DFW', 'South Asian wedding Dallas'],
        metaDesc: 'The definitive guide to Indian wedding venues in Dallas-Fort Worth. From luxury ballrooms to outdoor mandap setups, find your perfect DFW venue.',
        sections: [
            { h2: 'Why DFW Is a Top Indian Wedding Destination', content: 'Large South Asian community, variety of venues, great food options, two major airports.' },
            { h2: 'Best Indian Wedding Venues in Dallas', content: 'List 5 Dallas venues with details.' },
            { h2: 'Best Indian Wedding Venues in Fort Worth & Suburbs', content: 'List 5 Fort Worth/Plano/Frisco venues.' },
            { h2: 'Planning Tips for DFW Indian Weddings', content: 'Weather considerations, vendor recommendations, timeline planning.' },
            { h2: 'Book DJ Lakha for Your DFW Wedding', content: 'CTA.' },
        ],
    },
    {
        slug: 'sangeet-entertainment-ideas-guide',
        title: 'Sangeet Entertainment Ideas — From Traditional to Fusion | DJ Lakha',
        keywords: ['Sangeet entertainment ideas', 'Sangeet night DJ', 'Indian wedding Sangeet music'],
        metaDesc: 'Planning your Sangeet? DJ Lakha shares the best entertainment ideas including Bollywood mashups, live performances, games, and fusion music sets.',
        sections: [
            { h2: 'What Is a Sangeet Night?', content: 'Explain the tradition, its significance, and modern evolution.' },
            { h2: 'Sangeet Music: The Perfect Playlist', content: 'Classic songs, modern Bollywood hits, Bhangra, regional favorites.' },
            { h2: 'Sangeet Games & Activities', content: 'Game ideas: musical chairs, couple quiz, dance battles.' },
            { h2: 'Live Performance Ideas', content: 'Choreographed dances, live dhol, surprise performances.' },
            { h2: 'How a Professional DJ Elevates Your Sangeet', content: 'Sound, lighting, MC skills, crowd management. CTA.' },
        ],
    },
    {
        slug: 'houston-indian-wedding-planning-guide',
        title: 'Houston Indian Wedding Planning Guide 2025 — Complete Checklist',
        keywords: ['Houston Indian wedding planning', 'Indian wedding planner Houston', 'Indian wedding DJ Houston'],
        metaDesc: 'Your complete guide to planning an Indian wedding in Houston. From venues and caterers to DJs and decorators, plus a month-by-month checklist.',
        sections: [
            { h2: 'Houston\'s Indian Wedding Scene', content: 'Overview of Houston\'s South Asian community, popular venues, vendor ecosystem.' },
            { h2: 'Month-by-Month Planning Checklist', content: '12-month countdown with action items for each month.' },
            { h2: 'Top Houston Vendors for Indian Weddings', content: 'Categories: Venues, Caterers, Decorators, Photographers, DJs, Mehndi, Florists.' },
            { h2: 'Budget Planning for Houston Indian Weddings', content: 'Average costs by category, money-saving tips.' },
            { h2: 'Entertainment: Choosing Your Houston Indian Wedding DJ', content: 'What to look for, questions to ask. CTA.' },
        ],
    },
];

function generateBlogHTML(template) {
    const { slug, title, keywords, metaDesc, sections } = template;

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${metaDesc}">
    <meta name="keywords" content="${keywords.join(', ')}">
    <link rel="canonical" href="https://www.djlakha.com/blog/${slug}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${metaDesc}">
    <meta property="og:url" content="https://www.djlakha.com/blog/${slug}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"><\/script>
    <link rel="stylesheet" href="../styles.css">
    <style>
        .blog-header { padding-top: 150px; padding-bottom: 60px; text-align: center; background: var(--color-surface); }
        .blog-content { max-width: 800px; margin: 0 auto; padding: 3rem 1rem; line-height: 1.9; }
        .blog-content h2 { color: var(--color-primary); margin: 3rem 0 1rem; font-size: 1.6rem; }
        .blog-content p { color: var(--color-text-muted); margin-bottom: 1.5rem; }
        .blog-meta { font-size: 0.85rem; color: var(--color-text-muted); margin-top: 1rem; }
        .blog-cta { text-align: center; padding: 3rem; background: var(--color-surface); margin: 3rem 0; border-radius: 8px; }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="container nav-container">
            <a href="../index.html" class="logo"><img src="../LAKHAlogo.png" alt="DJ LAKHA" class="logo-img"></a>
            <div class="nav-links">
                <a href="../index.html#about">About</a>
                <a href="../media.html">Media</a>
                <a href="../testimonials.html">Testimonials</a>
                <a href="../index.html#services">Services</a>
                <a href="../book.html" class="btn-primary">Book Now</a>
            </div>
        </div>
    </nav>

    <header class="blog-header">
        <div class="container">
            <h1 class="hero-title fade-in-up">${title}</h1>
            <p class="blog-meta">By DJ Lakha | ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
    </header>

    <article class="blog-content">
`;

    sections.forEach(section => {
        html += `        <h2>${section.h2}</h2>\n`;
        html += `        <!-- TODO: ${section.content} -->\n`;
        html += `        <p>[Write ${section.content}]</p>\n\n`;
    });

    html += `
        <div class="blog-cta">
            <h3 style="color: var(--color-primary);">Ready to Book DJ Lakha?</h3>
            <p style="color: var(--color-text-muted);">Let's create an unforgettable celebration together.</p>
            <a href="../book.html" class="btn-primary">Inquire Now</a>
        </div>
    </article>

    <footer class="footer">
        <div class="container footer-content">
            <p class="copyright">© 2025 DJ LAKHA. All Rights Reserved.</p>
            <p style="font-size: 0.8rem; color: var(--color-text-muted);">
                Indian Wedding DJ in Austin · Dallas · Houston · San Antonio · Texas & Worldwide
            </p>
        </div>
    </footer>

    <script src="../script.js"><\/script>
    <script>lucide.createIcons();<\/script>
</body>
</html>`;

    return html;
}

// --- MAIN ---
console.log('\n📝 DJ LAKHA Blog Generator\n');
console.log(`Generating ${BLOG_TEMPLATES.length} blog post templates...\n`);

BLOG_TEMPLATES.forEach(template => {
    const html = generateBlogHTML(template);
    const filePath = join(OUTPUT_DIR, `${template.slug}.html`);
    writeFileSync(filePath, html);
    console.log(`  ✅ ${template.title}`);
    console.log(`     → ${filePath}`);
    console.log(`     Keywords: ${template.keywords.join(', ')}\n`);
});

console.log(`${'='.repeat(50)}`);
console.log(`📁 Blog posts saved to: seo-agents/output/blog-posts/`);
console.log(`\n📋 Next Steps:`);
console.log(`   1. Open each file and fill in the [Write ...] placeholders`);
console.log(`   2. Add real venue names, photos, and local knowledge`);
console.log(`   3. Create a /blog/ folder on your site and upload`);
console.log(`   4. Add blog links to your sitemap.xml`);
console.log(`   5. Share on social media and link from homepage`);
console.log(`${'='.repeat(50)}\n`);
