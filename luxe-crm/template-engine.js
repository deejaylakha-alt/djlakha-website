/**
 * LUXE CRM: Template & Automation Engine
 * =====================================
 * Generates personalized luxury touchpoints.
 * Handles: Auto-reminders, Music Questionnaires, and Follow-ups.
 */

class TemplateEngine {
    constructor() {
        this.templates = {
            INQUIRY_REPLY: `Hi {{clientName}}! 

Thank you so much for inquiring about your wedding on {{eventDate}}. I've checked my calendar and I am currently available! 🎶

I'd love to learn more about the vibe you're envisioning for your {{eventType}} in {{city}}. Do you have time for a quick 15-minute "Discovery Call" this week?

Warmly,
Lakha`,

            DISCOVERY_FOLLOW_UP: `Hi {{clientName}},

It was so great chatting with you today about your vision for the celebration at {{venue}}. Your music taste is excellent, and I'm already imagining some great transitions for your reception!

I've attached a custom proposal for your {{eventType}}. Let me know if you have any questions!

Cheers,
DJ Lakha`,

            MUSIC_QUESTIONNAIRE: `Hi {{clientName}}!

We are just 6 weeks out from your big day! 🚀 To make sure the soundtrack is perfect, could you fill out this music questionnaire when you have a moment?

It covers your:
• Must-Play list
• Do-Not-Play list
• Specific songs for Baraat, Garba, and Entrance

Can't wait to see you shine!
— Lakha`
        };
    }

    generate(templateKey, clientData) {
        let content = this.templates[templateKey];
        if (!content) return "Template not found.";

        // Logic to replace {{tags}} with real client info
        Object.keys(clientData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, clientData[key]);
        });

        return content;
    }
}

export { TemplateEngine };
