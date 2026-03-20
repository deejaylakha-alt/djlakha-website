/**
 * LUXE CRM: Web Server
 * ====================
 * Serves the local dashboard and API endpoints.
 *
 * Usage: node server.js
 */

import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { exec } from 'child_process';
import opn from 'opn'; // Opens browser

import { generateContract } from './modules/contracts.js';

const app = express();
const PORT = 3000;
const DATA_DIR = resolve(import.meta.dirname, 'data');
const SEO_DIR = resolve(import.meta.dirname, '../seo-agents');

app.use(express.static('public'));
app.use(express.json());

// Enable CORS for local file access
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// ─── Helpers ──────────────────────────────────────────────

function load(file) {
    const p = join(DATA_DIR, file);
    if (!existsSync(p)) return [];
    try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return []; }
}

// ─── API Endpoints ────────────────────────────────────────

app.post('/api/contracts/generate', async (req, res) => {
    try {
        const result = await generateContract(req.body);
        if (result.success) {
            opn(result.path); // Auto-open for user
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/inquiry', (req, res) => {
    try {
        const data = req.body;
        const project = {
            id: 'local_' + Date.now(),
            eventName: `${data.name}'s Event`,
            clientName: data.name,
            clientEmail: data.email,
            clientPhone: data.phone,
            eventDate: data.date,
            eventLocation: data.venue,
            eventBudget: null,
            stage: 'Inquiry',
            source: 'Website',
            createdAt: new Date().toISOString(),
            isActive: true,
            tasksOverdue: 0,
            tasksTotal: 1, // "Respond to inquiry"
            tags: ['New Lead'],
            recentActivity: 'Inquiry Received',
            recentActivityDate: new Date().toISOString()
        };

        // Save to local-projects.json
        const localFile = join(DATA_DIR, 'local-projects.json');
        let local = [];
        if (existsSync(localFile)) {
            try { local = JSON.parse(readFileSync(localFile, 'utf-8')); } catch { }
        }

        local.unshift(project);
        writeFileSync(localFile, JSON.stringify(local, null, 2));

        console.log(`\n📩 New Inquiry: ${project.clientName} (${project.eventDate})`);

        res.json({ success: true, id: project.id });

    } catch (e) {
        console.error('Error saving inquiry:', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/projects', (req, res) => {
    const hb = load('crm-projects.json');
    const local = load('local-projects.json');
    res.json([...local, ...hb]);
});

app.get('/api/contacts', (req, res) => {
    res.json(load('crm-contacts.json'));
});

app.get('/api/finance', (req, res) => {
    res.json(load('crm-payments.json'));
});

app.get('/api/tasks', (req, res) => {
    res.json(load('crm-tasks.json'));
});

app.get('/api/leads', (req, res) => {
    res.json(load('leads.json'));
});

app.get('/api/company', (req, res) => {
    res.json(load('crm-company.json'));
});

app.post('/api/run/:script', (req, res) => {
    const scriptName = req.params.script;
    let command = '';

    // Security whitelist
    switch (scriptName) {
        case 'extract':
            command = 'npm run extract';
            break;
        case 'mine':
            command = 'npm run mine';
            break;
        case 'emails':
            command = 'npm run emails';
            break;
        case 'seo-audit':
            // Run SEO audit from the sibling directory
            command = `cd "${SEO_DIR}" && npm run audit`;
            break;
        default:
            return res.status(400).json({ error: 'Invalid script' });
    }

    console.log(`Running: ${command}`);

    exec(command, { cwd: resolve(import.meta.dirname) }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error running ${scriptName}:`, error);
            return res.status(500).json({ error: error.message, details: stderr });
        }
        res.json({ success: true, output: stdout });
    });
});

// ─── Start Server ─────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`\n  ✨ LUXE CRM Web App running at http://localhost:${PORT}`);
    console.log('  Opening dashboard...');
    opn(`http://localhost:${PORT}/dashboard.html`);
});
