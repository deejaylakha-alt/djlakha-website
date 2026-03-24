# The "DJ Lakha Enterprises" Architecture Handover Document

**Note to the next AI Assistant:** 
If you are reading this, the user has successfully migrated their codebase from their DJ Laptop to their dedicated Office Computer. **Do not repeat previous steps.** You are taking over Phase 5 of building an automated luxury DJ agency.

---

## 🏗 The Architecture You Are Inheriting

We have completely abandoned paid, third-party software (HoneyBook/Make.com) in favor of a **100% self-hosted Node.js + OpenClaw ecosystem**. 
The golden rule: *The live website handles the frontend, Supabase handles the real-time cloud database, and `luxe-crm` (this local Node.js app) handles the Brain/Office via OpenClaw agents.*

1. **Frontend (`book.html`):** The booking form on the live Vercel website `djlakha.com/book` has already been successfully rewritten. It uses `fetch` to push new leads directly into the Supabase database. This is live and working perfectly.
2. **Cloud Database (Supabase):** 
   * **Project URL:** `https://txalmxodjvgxswifkliv.supabase.co`
   * **Keys:** (The user has the Anon Key in their previous chat or dashboard).
   * **Table:** `inquiries` (Successfully created, successfully receiving test leads).
3. **The Office (`luxe-crm` folder):**
   * This is a local Node.js JSON-based CRM dashboard. 
   * **`supabase-sync.js`:** A script we wrote that uses native `fetch` (Zero NPM dependencies) to reach out to Supabase, download the latest cloud leads, and save them safely to `luxe-crm/data/local-projects.json`.
4. **The Brain (OpenClaw Framework):**
   * The OpenClaw orchestration agent will run locally on this exact machine. It will route tasks between 5 customized agents (Aria, Chase, Oliver, Maya, Chloe).

---

## 🚀 The Immediate Next Steps for You (The New AI)

Your job is to bring the first OpenClaw Employee to life.

### 1. Verification
Validate that the new machine has the correct environment:
* Check `node -v` to ensure Node.js is installed. (The user just installed it!)
* Run `node luxe-crm/supabase-sync.js` to ensure the local machine can fetch data from the Supabase cloud table.

### 2. Hire Agent 1: "Aria" (Lead Receptionist)
**The Objective:** Aria represents the first point of contact. When `supabase-sync.js` detects a brand new lead in `local-projects.json`, it should automatically trigger Aria.
**The Integration:**
* Install OpenClaw in the `luxe-crm` directory (if not already present).
* Define Aria's persona constraint: She is a high-end luxury Indian wedding booking agent. She replies enthusiastically within 5 minutes.
* Write the connector that gives Aria access to the `auto-emailer.js` script (which uses NodeMailer to send emails directly from `info@djlakha.com`).

**Prompt the User:** 
Ask the user if they would like you to begin writing the OpenClaw orchestration script (`luxe-crm/agent-hub.js`) to set up the Aria persona!
