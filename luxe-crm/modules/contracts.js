/**
 * LUXE CRM: Contract Generator Module
 * ===================================
 * Generates PDF contracts from HTML templates using Puppeteer.
 */

import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const TEMPLATE_PATH = resolve(import.meta.dirname, '../templates/contract-template.html');
const OUTPUT_DIR = resolve(import.meta.dirname, '../contracts');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

export async function generateContract(data) {
    console.log(`\n📄 Generating contract for ${data.clientName}...`);

    try {
        // 1. Load HTML Template
        let html = readFileSync(TEMPLATE_PATH, 'utf-8');

        // 2. Replace Placeholders
        const replacements = {
            '{{CLIENT_NAME}}': data.clientName || 'Valued Client',
            '{{CLIENT_EMAIL}}': data.clientEmail || '',
            '{{CLIENT_PHONE}}': data.clientPhone || '',
            '{{EVENT_DATE}}': data.date || '',
            '{{EVENT_VENUE}}': data.venue || 'TBD',
            '{{PACKAGE_NAME}}': data.package || 'Custom Event Package',
            '{{TOTAL_FEE}}': data.amount ? `$${data.amount}` : 'TBD',
            '{{CLIENT_SIGNATURE}}': data.signed ? data.clientName : '(Pending Signature)', // Digital signature simulation
            '{{SignedDate}}': new Date().toLocaleDateString(),
        };

        for (const [key, value] of Object.entries(replacements)) {
            html = html.replace(new RegExp(key, 'g'), value);
        }

        // 3. Launch Puppeteer to render PDF
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();

        // Set content and emulate print media
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');

        // Generate PDF
        const filename = `Contract_${data.clientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        const filePath = join(OUTPUT_DIR, filename);

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        console.log(`✅ Contract generated: ${filePath}`);
        return { success: true, path: filePath, filename: filename };

    } catch (error) {
        console.error('❌ Error generating contract:', error);
        return { success: false, error: error.message };
    }
}
