/**
 * LUXE CRM: Pipeline Manager
 * ==========================
 * Manages the client journey from lead to legendary celebration.
 * Loads HoneyBook data and manages local client lifecycle.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const LEADS_FILE = join(DATA_DIR, 'leads.json');

// Pipeline Stages for Luxury Wedding Business
const STAGES = {
    INQUIRY: 'Inquiry',           // New lead from HoneyBook
    DISCOVERY: 'Discovery Call',  // First high-touch meeting
    PROPOSAL: 'Proposal Sent',    // Custom quote out
    BOOKED: 'Booked / Deposit',   // Contract signed
    PLANNING: 'Event Planning',   // Music/Timeline prep
    EXECUTION: 'Event Day',       // DJ LAKHA is live!
    GLOW: 'Post-Event / Review'   // Review outreach stage
};

class LuxeCRM {
    constructor() {
        this.leads = this.loadLeads();
    }

    loadLeads() {
        if (existsSync(LEADS_FILE)) {
            try {
                return JSON.parse(readFileSync(LEADS_FILE, 'utf-8'));
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    saveLeads() {
        writeFileSync(LEADS_FILE, JSON.stringify(this.leads, null, 2));
    }

    // Import from HoneyBook CSV Export
    importHoneyBookCSV(csvData) {
        // This handles the format HoneyBook gives you in their export
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const values = lines[i].split(',');
            const lead = {
                id: values[0], // Project ID
                name: values[1],
                email: values[2],
                date: values[3],
                venue: values[4],
                status: STAGES.INQUIRY,
                createdAt: new Date().toISOString(),
                notes: `Imported from HoneyBook: ${values[5] || ''}`
            };

            // Don't duplicate
            if (!this.leads.find(l => l.email === lead.email && l.date === lead.date)) {
                this.leads.push(lead);
            }
        }
        this.saveLeads();
        return `Imported ${lines.length - 1} leads successfully.`;
    }

    addLead(data) {
        const lead = {
            ...data,
            id: `LUXE-${Date.now()}`,
            status: STAGES.INQUIRY,
            createdAt: new Date().toISOString(),
            history: []
        };
        this.leads.push(lead);
        this.saveLeads();
        return lead;
    }

    updateStage(leadEmail, newStage) {
        const lead = this.leads.find(l => l.email === leadEmail);
        if (lead) {
            lead.history.push({
                date: new Date().toISOString(),
                oldStage: lead.status,
                newStage: newStage
            });
            lead.status = newStage;
            this.saveLeads();
            return true;
        }
        return false;
    }

    getPipelineSummary() {
        const summary = {};
        Object.values(STAGES).forEach(s => summary[s] = 0);
        this.leads.forEach(l => summary[l.status]++);
        return summary;
    }
}

export { LuxeCRM, STAGES };
