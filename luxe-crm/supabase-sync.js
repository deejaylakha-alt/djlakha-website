import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const SUPABASE_URL = 'https://txalmxodjvgxswifkliv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YWxteG9kanZneHN3aWZrbGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjYzMjMsImV4cCI6MjA4OTk0MjMyM30.V4U7tWGVnMkSFEOU3gCMbHPKSoaBpAIyvnWJXRz2bPA';

const DATA_DIR = resolve(import.meta.dirname, 'data');
const LOCAL_PROJECTS_FILE = join(DATA_DIR, 'local-projects.json');

async function syncLeads() {
    console.log('\n🔄 Syncing new inquiries from Supabase Cloud...');
    
    // Fetch all inquiries from Supabase using Native Node Fetch (Zero Dependencies)
    let cloudInquiries = [];
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/inquiries?select=*&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        cloudInquiries = await response.json();
    } catch (error) {
        console.error('❌ Failed to fetch from Supabase:', error.message);
        return;
    }

    if (!cloudInquiries || cloudInquiries.length === 0) {
        console.log('   No new inquiries found in the cloud.');
        return;
    }

    // Load existing local leads
    let localLeads = [];
    if (existsSync(LOCAL_PROJECTS_FILE)) {
        try { localLeads = JSON.parse(readFileSync(LOCAL_PROJECTS_FILE, 'utf-8')); } 
        catch { localLeads = []; }
    }

    let newLeadsCount = 0;

    // Process cloud leads into the local standard schema
    cloudInquiries.forEach(cloudReq => {
        const id = 'cloud_' + cloudReq.id;
        
        // Check if we already synced this lead
        const exists = localLeads.some(l => l.id === id);
        if (!exists) {
            const newLead = {
                id: id,
                eventName: `${cloudReq.name.split(' ')[0]}'s Event`,
                clientName: cloudReq.name,
                clientEmail: cloudReq.email,
                clientPhone: cloudReq.phone || '',
                eventDate: cloudReq.date,
                eventLocation: cloudReq.venue || cloudReq.city || 'TBD',
                eventBudget: null,
                stage: 'Inquiry',
                source: 'Supabase Website Sync',
                createdAt: cloudReq.created_at,
                isActive: true,
                tasksOverdue: 1, // Requires action
                tasksTotal: 1,
                tags: ['Supabase Lead', cloudReq.occasion || 'Event'],
                recentActivity: `Details: ${cloudReq.message || ''}`,
                recentActivityDate: new Date().toISOString()
            };

            localLeads.push(newLead);
            console.log(`   ✅ Synced: ${newLead.clientName} (${newLead.eventDate})`);
            newLeadsCount++;
        }
    });

    if (newLeadsCount > 0) {
        // Sort by newest first
        localLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        writeFileSync(LOCAL_PROJECTS_FILE, JSON.stringify(localLeads, null, 2));
        console.log(`\n🎉 Successfully imported ${newLeadsCount} fresh leads into LUXE CRM database.`);
    } else {
        console.log('   All cloud leads are already synced locally.');
    }
}

syncLeads();
