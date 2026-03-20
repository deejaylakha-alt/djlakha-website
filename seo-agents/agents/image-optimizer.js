/**
 * AGENT 2: Image Optimizer
 * ========================
 * Automatically converts all PNG/JPEG images to WebP format
 * and generates optimized versions at multiple sizes.
 * Also adds width/height attributes suggestion for each image.
 * 
 * Usage: npm run optimize-images
 */

import sharp from 'sharp';
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, resolve, extname, basename } from 'path';

const SITE_DIR = resolve(import.meta.dirname, '../../');
const ASSETS_DIR = join(SITE_DIR, 'assets');
const OUTPUT_DIR = resolve(import.meta.dirname, '../output/optimized-images');
const REPORT_DIR = resolve(import.meta.dirname, '../reports');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// Quality settings
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 85;

// Responsive sizes for portfolio/gallery images
const RESPONSIVE_WIDTHS = [400, 800, 1200];

function findImages(dir) {
    const images = [];
    const items = readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'seo-agents' && item.name !== 'node_modules') {
            images.push(...findImages(fullPath));
        } else if (item.isFile()) {
            const ext = extname(item.name).toLowerCase();
            if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                images.push(fullPath);
            }
        }
    }

    return images;
}

async function optimizeImage(imagePath) {
    const fileName = basename(imagePath, extname(imagePath));
    const originalSize = statSync(imagePath).size;
    const results = [];

    try {
        const image = sharp(imagePath);
        const metadata = await image.metadata();

        // Convert to WebP (main)
        const webpPath = join(OUTPUT_DIR, `${fileName}.webp`);
        const webpBuffer = await sharp(imagePath)
            .webp({ quality: WEBP_QUALITY })
            .toFile(webpPath);

        results.push({
            output: webpPath,
            format: 'webp',
            width: metadata.width,
            height: metadata.height,
            originalSize,
            newSize: webpBuffer.size,
            savings: Math.round((1 - webpBuffer.size / originalSize) * 100),
        });

        // Generate responsive sizes
        for (const width of RESPONSIVE_WIDTHS) {
            if (metadata.width && metadata.width > width) {
                const responsivePath = join(OUTPUT_DIR, `${fileName}-${width}w.webp`);
                const responsiveBuffer = await sharp(imagePath)
                    .resize(width)
                    .webp({ quality: WEBP_QUALITY })
                    .toFile(responsivePath);

                results.push({
                    output: responsivePath,
                    format: `webp-${width}w`,
                    width,
                    height: responsiveBuffer.height,
                    originalSize,
                    newSize: responsiveBuffer.size,
                    savings: Math.round((1 - responsiveBuffer.size / originalSize) * 100),
                });
            }
        }

        // Also create optimized JPEG fallback
        if (extname(imagePath).toLowerCase() !== '.png') {
            const jpegPath = join(OUTPUT_DIR, `${fileName}-optimized.jpg`);
            const jpegBuffer = await sharp(imagePath)
                .jpeg({ quality: JPEG_QUALITY, progressive: true })
                .toFile(jpegPath);

            results.push({
                output: jpegPath,
                format: 'jpeg-optimized',
                width: metadata.width,
                height: metadata.height,
                originalSize,
                newSize: jpegBuffer.size,
                savings: Math.round((1 - jpegBuffer.size / originalSize) * 100),
            });
        }

        return { imagePath, metadata, results, error: null };
    } catch (err) {
        return { imagePath, metadata: null, results: [], error: err.message };
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function generateHtmlSnippets(allResults) {
    let snippets = `<!-- OPTIMIZED IMAGE USAGE -->\n`;
    snippets += `<!-- Replace your current <img> tags with these for best performance -->\n\n`;

    for (const result of allResults) {
        if (result.error) continue;

        const name = basename(result.imagePath, extname(result.imagePath));
        const webpResults = result.results.filter(r => r.format.startsWith('webp'));

        if (webpResults.length > 1) {
            // Has responsive versions
            snippets += `<!-- ${basename(result.imagePath)} -->\n`;
            snippets += `<picture>\n`;

            const responsiveWebps = webpResults.filter(r => r.format !== 'webp');
            if (responsiveWebps.length > 0) {
                const srcset = responsiveWebps.map(r => `${basename(r.output)} ${r.width}w`).join(', ');
                snippets += `  <source type="image/webp" srcset="${srcset}">\n`;
            }

            const mainWebp = webpResults.find(r => r.format === 'webp');
            if (mainWebp) {
                snippets += `  <source type="image/webp" srcset="${basename(mainWebp.output)}">\n`;
            }

            snippets += `  <img src="${basename(result.imagePath)}" `;
            if (result.metadata) {
                snippets += `width="${result.metadata.width}" height="${result.metadata.height}" `;
            }
            snippets += `alt="DESCRIBE THIS IMAGE" loading="lazy">\n`;
            snippets += `</picture>\n\n`;
        }
    }

    writeFileSync(join(OUTPUT_DIR, 'usage-snippets.html'), snippets);
    return snippets;
}

// --- MAIN ---
console.log('\n🖼️  DJ LAKHA Image Optimizer\n');
console.log('Scanning for images...\n');

const images = findImages(SITE_DIR);
console.log(`Found ${images.length} images to optimize:\n`);

let totalOriginal = 0;
let totalOptimized = 0;
const allResults = [];

for (const img of images) {
    const relativePath = img.replace(SITE_DIR, '');
    console.log(`  Processing: ${relativePath}`);

    const result = await optimizeImage(img);
    allResults.push(result);

    if (result.error) {
        console.log(`    ❌ Error: ${result.error}`);
    } else {
        const mainWebp = result.results.find(r => r.format === 'webp');
        if (mainWebp) {
            totalOriginal += mainWebp.originalSize;
            totalOptimized += mainWebp.newSize;
            console.log(`    ✅ ${formatBytes(mainWebp.originalSize)} → ${formatBytes(mainWebp.newSize)} (${mainWebp.savings}% smaller)`);
            if (result.metadata) {
                console.log(`    📐 Dimensions: ${result.metadata.width}x${result.metadata.height}`);
            }
        }
    }
}

// Generate HTML usage snippets
generateHtmlSnippets(allResults);

// Generate report
let report = `# Image Optimization Report\n`;
report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
report += `## Summary\n`;
report += `- **Images Processed:** ${images.length}\n`;
report += `- **Total Original Size:** ${formatBytes(totalOriginal)}\n`;
report += `- **Total Optimized Size:** ${formatBytes(totalOptimized)}\n`;
report += `- **Total Savings:** ${formatBytes(totalOriginal - totalOptimized)} (${Math.round((1 - totalOptimized / totalOriginal) * 100)}%)\n\n`;
report += `## Files\n`;

allResults.forEach(r => {
    const name = basename(r.imagePath);
    report += `### ${name}\n`;
    if (r.error) {
        report += `- Error: ${r.error}\n`;
    } else {
        r.results.forEach(res => {
            report += `- **${res.format}**: ${formatBytes(res.originalSize)} → ${formatBytes(res.newSize)} (${res.savings}% saved)\n`;
        });
        if (r.metadata) {
            report += `- Dimensions: ${r.metadata.width}x${r.metadata.height}\n`;
        }
    }
    report += '\n';
});

report += `## Next Steps\n`;
report += `1. Copy WebP files from \`seo-agents/output/optimized-images/\` to your assets folder\n`;
report += `2. Update your HTML to use \`<picture>\` tags (see \`usage-snippets.html\`)\n`;
report += `3. Keep original files as fallback for older browsers\n`;

const reportPath = join(REPORT_DIR, `image-optimization-${new Date().toISOString().split('T')[0]}.md`);
writeFileSync(reportPath, report);

console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Total Savings: ${formatBytes(totalOriginal - totalOptimized)} (${Math.round((1 - totalOptimized / totalOriginal) * 100)}%)`);
console.log(`📁 Optimized images: seo-agents/output/optimized-images/`);
console.log(`📝 Report saved: ${reportPath}`);
console.log(`${'='.repeat(50)}\n`);
