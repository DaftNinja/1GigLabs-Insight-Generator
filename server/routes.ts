import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import type { Contact } from "@shared/schema";
import { registerChatRoutes } from "./replit_integrations/chat/routes";
import { registerImageRoutes } from "./replit_integrations/image/routes";
import { registerAudioRoutes } from "./replit_integrations/audio/routes";
import { searchApolloContacts } from "./apollo";

let openai: OpenAI;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize OpenAI client once when routes are registered
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }

  // Register integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAudioRoutes(app);

  // Analysis API
  app.post(api.analysis.create.path, async (req, res) => {
    try {
      const { companyName } = api.analysis.create.input.parse(req.body);

      // Check if we have a cached analysis that's less than 2 months old
      const existingAnalysis = await storage.getAnalysisByCompanyName(companyName);
      if (existingAnalysis && existingAnalysis.createdAt) {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        
        if (new Date(existingAnalysis.createdAt) > twoMonthsAgo) {
          // Return cached analysis
          console.log(`Returning cached analysis for ${companyName} from ${existingAnalysis.createdAt}`);
          return res.status(200).json(existingAnalysis);
        }
        console.log(`Cached analysis for ${companyName} is older than 2 months, regenerating...`);
      }

      // Generate analysis using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are a top-tier strategic business analyst. Generate a comprehensive strategic analysis for the company provided.
            
            CRITICAL: Use the most up-to-date information available (current date: January 2026). 
            - Ensure leadership team members (especially C-suite like CEO, CFO, CMO, CIO) are accurate as of today.
            - For Equinix, verify that Adam Berlew is the Chief Marketing Officer.
            - Financial figures must reflect the most recent fiscal years (2023-2025).
            
            You must return a valid JSON object matching this structure EXACTLY:
            {
              "companyName": string,
              "website": string (optional),
              "colorScheme": { "primary": string (hex), "secondary": string (hex) },
              "executiveSummary": string (2-3 paragraphs),
              "overview": {
                "description": string,
                "founded": string,
                "headquarters": string,
                "employees": string,
                "industry": string,
                "locations": string[],
                "naics": string,
                "sic": string
              },
              "financials": {
                "revenue": string,
                "revenueGrowth": string,
                "netIncome": string,
                "stockSymbol": string (optional),
                "recentPerformance": string,
                "chartData": [ { "year": string, "revenue": number (in millions), "netIncome": number (in millions) } ] (last 5 years)
              },
              "strategy": {
                "vision": string,
                "initiatives": [ { "title": string, "description": string } ],
                "leadership": [ { "name": string, "role": string, "bio": string } ]
              },
              "market": {
                "competitors": [ { "name": string, "description": string } ],
                "challenges": string[],
                "marketShare": string (optional)
              },
              "technicalSpend": {
                "totalEstimatedBudget": string,
                "breakdown": [ { "category": string, "percentage": number, "estimatedAmount": string } ],
                "categories": {
                   "network": string (description),
                   "hardware": string (description),
                   "software": string (description),
                   "cloud": string (description),
                   "dataCenter": string (description),
                   "aiAndAutomation": string (description),
                   "outsourcedServices": string (description)
                }
              },
              "esgSustainability": {
                "overview": string (2-3 sentences on ESG stance),
                "environmentalInitiatives": string[] (3-5 key initiatives),
                "socialResponsibility": string[] (3-5 programs),
                "governancePractices": string[] (3-5 practices),
                "esgRating": string (optional, e.g., "MSCI: AA"),
                "netZeroTarget": string (optional, e.g., "2040")
              },
              "swotAnalysis": {
                "strengths": string[] (4-6 items),
                "weaknesses": string[] (4-6 items),
                "opportunities": string[] (4-6 items),
                "threats": string[] (4-6 items)
              },
              "growthOpportunities": {
                "summary": string (overview paragraph),
                "opportunities": [ { "title": string, "description": string, "potentialImpact": string } ] (3-5 opportunities),
                "emergingMarkets": string[] (optional, 2-4 markets)
              },
              "riskAssessment": {
                "overallRiskLevel": string (Low/Medium/High),
                "risks": [ { "category": string, "description": string, "severity": string, "mitigation": string } ] (4-6 risks),
                "regulatoryRisks": string[] (optional, 2-4 items)
              },
              "digitalTransformation": {
                "maturityLevel": string (e.g., "Advanced", "Developing", "Leading"),
                "currentInitiatives": [ { "title": string, "description": string, "status": string } ] (3-5 initiatives),
                "techStack": string[] (optional, key technologies),
                "aiAdoption": string (optional, AI/ML adoption status),
                "futureRoadmap": string (optional, future plans)
              }
            }
            
            NOTE: For Technical Spend, combine "Managed Services" with "Outsourced Services/Contracts". These are often public domain info (e.g., contracts with Accenture, DXC, HCL, Tata, etc.).
            
            Ensure all financial data and facts are as accurate as possible up to your knowledge cutoff. Estimate technical spend based on industry standards for companies of this size if exact figures are not public.
            `
          },
          {
            role: "user",
            content: `Analyze this company: ${companyName}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const contentStr = completion.choices[0].message.content;
      if (!contentStr) {
        throw new Error("Failed to generate content");
      }

      const content = JSON.parse(contentStr);

      // Save to database - update if exists, create if new
      let analysis;
      if (existingAnalysis) {
        // Update existing record with fresh data
        analysis = await storage.updateAnalysis(existingAnalysis.id, {
          companyName,
          content
        });
        console.log(`Updated existing analysis for ${companyName}`);
      } else {
        // Create new record
        analysis = await storage.createAnalysis({
          companyName,
          content
        });
        console.log(`Created new analysis for ${companyName}`);
      }

      res.status(201).json(analysis);
    } catch (err) {
      console.error("Analysis generation error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to generate analysis" });
      }
    }
  });

  app.get(api.analysis.get.path, async (req, res) => {
    const analysis = await storage.getAnalysis(Number(req.params.id));
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }
    res.json(analysis);
  });

  app.get(api.analysis.list.path, async (req, res) => {
    const analyses = await storage.listAnalyses();
    res.json(analyses);
  });

  // Delete analysis
  app.delete("/api/analyses/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const analysis = await storage.getAnalysis(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      await storage.deleteAnalysis(id);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  // Force refresh analysis (regenerate with AI)
  app.post("/api/analyses/:id/refresh", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingAnalysis = await storage.getAnalysis(id);
      if (!existingAnalysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const companyName = existingAnalysis.companyName;
      console.log(`Force refreshing analysis for ${companyName}`);

      // Generate fresh analysis using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: `You are a top-tier strategic business analyst. Generate a comprehensive strategic analysis for the company provided.
            
            CRITICAL: Use the most up-to-date information available (current date: January 2026). 
            - Ensure leadership team members (especially C-suite like CEO, CFO, CMO, CIO) are accurate as of today.
            - Financial figures must reflect the most recent fiscal years (2023-2025).
            
            You must return a valid JSON object matching this structure EXACTLY:
            {
              "companyName": string,
              "website": string (optional),
              "colorScheme": { "primary": string (hex), "secondary": string (hex) },
              "executiveSummary": string (2-3 paragraphs),
              "overview": {
                "description": string,
                "founded": string,
                "headquarters": string,
                "employees": string,
                "industry": string,
                "locations": string[],
                "naics": string,
                "sic": string
              },
              "financials": {
                "revenue": string,
                "revenueGrowth": string,
                "netIncome": string,
                "stockSymbol": string (optional),
                "recentPerformance": string,
                "chartData": [ { "year": string, "revenue": number (in millions), "netIncome": number (in millions) } ] (last 5 years)
              },
              "strategy": {
                "vision": string,
                "initiatives": [ { "title": string, "description": string } ],
                "leadership": [ { "name": string, "role": string, "bio": string } ]
              },
              "market": {
                "competitors": [ { "name": string, "description": string } ],
                "challenges": string[],
                "marketShare": string (optional)
              },
              "technicalSpend": {
                "totalEstimatedBudget": string,
                "breakdown": [ { "category": string, "percentage": number, "estimatedAmount": string } ],
                "categories": {
                   "network": string (description),
                   "hardware": string (description),
                   "software": string (description),
                   "cloud": string (description),
                   "dataCenter": string (description),
                   "aiAndAutomation": string (description),
                   "outsourcedServices": string (description)
                }
              },
              "esgSustainability": {
                "overview": string (2-3 sentences on ESG stance),
                "environmentalInitiatives": string[] (3-5 key initiatives),
                "socialResponsibility": string[] (3-5 programs),
                "governancePractices": string[] (3-5 practices),
                "esgRating": string (optional, e.g., "MSCI: AA"),
                "netZeroTarget": string (optional, e.g., "2040")
              },
              "swotAnalysis": {
                "strengths": string[] (4-6 items),
                "weaknesses": string[] (4-6 items),
                "opportunities": string[] (4-6 items),
                "threats": string[] (4-6 items)
              },
              "growthOpportunities": {
                "summary": string (overview paragraph),
                "opportunities": [ { "title": string, "description": string, "potentialImpact": string } ] (3-5 opportunities),
                "emergingMarkets": string[] (optional, 2-4 markets)
              },
              "riskAssessment": {
                "overallRiskLevel": string (Low/Medium/High),
                "risks": [ { "category": string, "description": string, "severity": string, "mitigation": string } ] (4-6 risks),
                "regulatoryRisks": string[] (optional, 2-4 items)
              },
              "digitalTransformation": {
                "maturityLevel": string (e.g., "Advanced", "Developing", "Leading"),
                "currentInitiatives": [ { "title": string, "description": string, "status": string } ] (3-5 initiatives),
                "techStack": string[] (optional, key technologies),
                "aiAdoption": string (optional, AI/ML adoption status),
                "futureRoadmap": string (optional, future plans)
              }
            }
            
            NOTE: For Technical Spend, combine "Managed Services" with "Outsourced Services/Contracts". These are often public domain info (e.g., contracts with Accenture, DXC, HCL, Tata, etc.).
            
            Ensure all financial data and facts are as accurate as possible up to your knowledge cutoff. Estimate technical spend based on industry standards for companies of this size if exact figures are not public.
            `
          },
          {
            role: "user",
            content: `Analyze this company: ${companyName}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const contentStr = completion.choices[0].message.content;
      if (!contentStr) {
        throw new Error("Failed to generate content");
      }

      const content = JSON.parse(contentStr);

      // Update the existing record
      const updatedAnalysis = await storage.updateAnalysis(id, {
        companyName,
        content
      });

      console.log(`Force refreshed analysis for ${companyName}`);
      res.json(updatedAnalysis);
    } catch (err) {
      console.error("Force refresh error:", err);
      res.status(500).json({ message: "Failed to refresh analysis" });
    }
  });

  // Generate contacts for an analysis
  app.post("/api/analyses/:id/contacts", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Check if contacts already exist for this analysis
      const existingContacts = await storage.getContactsByAnalysisId(analysisId);
      if (existingContacts) {
        return res.json(existingContacts);
      }

      const content = analysis.content as any;
      const companyName = content.companyName || analysis.companyName;
      const industry = content.overview?.industry || "Technology";
      const leadership = content.strategy?.leadership || [];

      console.log(`Generating contacts for ${companyName}`);

      // Try Apollo.io first
      const websiteUrl = content.website || content.overview?.website;
      const apolloContacts = await searchApolloContacts(companyName, websiteUrl, {
        maxContacts: 25,
        seniorityFocus: "executive",
      });

      let allContacts: any[] = apolloContacts;

      // If Apollo returned no results, fall back to AI
      if (apolloContacts.length === 0) {
        console.log(`Apollo returned 0 contacts for ${companyName}, falling back to AI generation`);
        const completion = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            {
              role: "system",
              content: `You are a B2B sales intelligence expert. Generate a list of relevant business contacts for sales outreach to the company provided.

              CRITICAL REQUIREMENT: Only include contacts who are CURRENTLY employed at the company as of today.
              
              Research and provide contacts from (in order of priority):
              1. Crunchbase - current leadership team, executives, and active investors
              2. Wikipedia company page - check "Key people" and "Leadership" sections for C-Suite executives
              3. Company website - leadership/about/team pages
              4. LinkedIn profiles of key executives and decision-makers (verify current employment)
              5. Other sources - industry publications, press releases (within last 12 months)
              
              Focus on:
              - C-Suite executives (CEO, CFO, CTO, CIO, CMO, CHRO)
              - VP and Director level in relevant departments (IT, Operations, Procurement, Digital)
              - Key decision-makers for technology and services purchases
              
              You must return a valid JSON object with this structure:
              {
                "contacts": [
                  {
                    "name": string (full name),
                    "title": string (CURRENT job title at this company),
                    "department": string (e.g., "Executive", "IT", "Operations", "Finance", "Marketing"),
                    "email": string (professional email format, e.g., firstname.lastname@company.com),
                    "linkedin": string (LinkedIn search URL: https://www.linkedin.com/search/results/people/?keywords=FirstName%20LastName%20CompanyName),
                    "source": string (e.g., "Crunchbase", "Wikipedia", "Company Website", "LinkedIn"),
                    "sourceUrl": string (verification URL),
                    "relevance": string (brief explanation of why this contact is relevant)
                  }
                ]
              }
              
              Generate 15-20 realistic contacts who are CURRENTLY employed at the company.`
            },
            {
              role: "user",
              content: `Generate B2B contacts for ${companyName} in the ${industry} industry.
              
Known leadership from our analysis:
${leadership.map((l: any) => `- ${l.name}: ${l.role}`).join('\n')}

Company website: ${content.website || 'Not available'}
Headquarters: ${content.overview?.headquarters || 'Not available'}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const contactsStr = completion.choices[0].message.content;
        if (!contactsStr) throw new Error("Failed to generate contacts");
        const parsed = JSON.parse(contactsStr);
        allContacts = parsed.contacts || [];
      }

      // Save contacts to database
      const savedContacts = await storage.createContacts({
        analysisId,
        companyName,
        contacts: allContacts
      });

      console.log(`Generated ${allContacts.length} contacts for ${companyName} (source: ${apolloContacts.length > 0 ? 'Apollo.io' : 'AI'})`);
      res.status(201).json(savedContacts);
    } catch (err) {
      console.error("Contacts generation error:", err);
      res.status(500).json({ message: "Failed to generate contacts" });
    }
  });

  // Get contacts for an analysis
  app.get("/api/analyses/:id/contacts", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const contacts = await storage.getContactsByAnalysisId(analysisId);
      if (!contacts) {
        return res.status(404).json({ message: "Contacts not found" });
      }
      res.json(contacts);
    } catch (err) {
      console.error("Get contacts error:", err);
      res.status(500).json({ message: "Failed to get contacts" });
    }
  });

  // Refresh contacts for an analysis
  app.post("/api/analyses/:id/contacts/refresh", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Get existing contacts to preserve verified and track deleted
      const existingContacts = await storage.getContactsByAnalysisId(analysisId);
      const existingContactList = (existingContacts?.contacts as Contact[]) || [];
      
      // Separate verified (locked) contacts and deleted contacts
      const verifiedContacts = existingContactList.filter((c: Contact) => c.verified && !c.deleted);
      const deletedNames = existingContactList
        .filter((c: Contact) => c.deleted)
        .map((c: Contact) => c.name.toLowerCase());

      const content = analysis.content as any;
      const companyName = content.companyName || analysis.companyName;
      const industry = content.overview?.industry || "Technology";
      const leadership = content.strategy?.leadership || [];

      console.log(`Refreshing contacts for ${companyName}`);

      // Search Apollo.io for contacts, excluding verified and deleted
      const websiteUrl = content.website || content.overview?.website;
      const verifiedNames = verifiedContacts.map((c: Contact) => c.name.toLowerCase());
      const excludeNames = [...deletedNames, ...verifiedNames];

      const apolloContacts = await searchApolloContacts(companyName, websiteUrl, {
        maxContacts: 25,
        excludeNames: excludeNames,
        seniorityFocus: "executive",
      });

      console.log(`Apollo returned ${apolloContacts.length} contacts for refresh of ${companyName}`);

      let newContacts: any[] = apolloContacts;

      // If Apollo returned no results, fall back to AI
      if (apolloContacts.length === 0) {
        console.log(`Apollo returned 0 contacts for refresh of ${companyName}, falling back to AI`);
        const completion = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            {
              role: "system",
              content: `You are a B2B sales intelligence expert. Generate a list of relevant business contacts for sales outreach to the company provided.

              CRITICAL REQUIREMENT: Only include contacts who are CURRENTLY employed at the company as of today.
              
              Research and provide contacts from (in order of priority):
              1. Crunchbase - current leadership team, executives, and active investors
              2. Wikipedia company page - check "Key people" and "Leadership" sections
              3. Company website - leadership/about/team pages
              4. LinkedIn profiles of key executives and decision-makers
              5. Other sources - industry publications, press releases (within last 12 months)
              
              Focus on C-Suite executives, VP and Director level in relevant departments, and key decision-makers.
              
              Do NOT include any of these names (verified or previously deleted):
              ${excludeNames.join(', ')}
              
              You must return a valid JSON object with this structure:
              {
                "contacts": [
                  {
                    "name": string, "title": string, "department": string,
                    "email": string, "linkedin": string, "source": string,
                    "sourceUrl": string, "relevance": string
                  }
                ]
              }
              
              Generate 15-20 contacts who are CURRENTLY employed at the company.`
            },
            {
              role: "user",
              content: `Generate B2B contacts for ${companyName} in the ${industry} industry.
Known leadership: ${leadership.map((l: any) => `${l.name}: ${l.role}`).join(', ')}
Company website: ${content.website || 'Not available'}`
            }
          ],
          response_format: { type: "json_object" }
        });
        const contactsStr = completion.choices[0].message.content;
        if (contactsStr) {
          const parsed = JSON.parse(contactsStr);
          newContacts = (parsed.contacts || []).filter((c: any) => 
            !excludeNames.includes(c.name.toLowerCase())
          );
        }
      }

      // Merge verified contacts with new contacts, keeping deleted contacts for tracking
      const deletedContacts = existingContactList.filter((c: Contact) => c.deleted);
      const mergedContacts = [...verifiedContacts, ...newContacts, ...deletedContacts];

      // Delete old and save merged contacts
      if (existingContacts) {
        await storage.deleteContactsByAnalysisId(analysisId);
      }

      const savedContacts = await storage.createContacts({
        analysisId,
        companyName,
        contacts: mergedContacts
      });

      console.log(`Refreshed contacts for ${companyName}: ${verifiedContacts.length} verified preserved, ${newContacts.length} new added, ${deletedContacts.length} deleted tracked`);
      res.json(savedContacts);
    } catch (err) {
      console.error("Contacts refresh error:", err);
      res.status(500).json({ message: "Failed to refresh contacts" });
    }
  });

  // Add more contacts to an existing analysis
  app.post("/api/analyses/:id/contacts/more", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Get existing contacts
      const existingContacts = await storage.getContactsByAnalysisId(analysisId);
      if (!existingContacts) {
        return res.status(400).json({ message: "No existing contacts. Generate contacts first." });
      }

      const content = analysis.content as any;
      const companyName = content.companyName || analysis.companyName;
      const industry = content.overview?.industry || "Technology";
      const leadership = content.strategy?.leadership || [];
      const existingContactList = existingContacts.contacts as Contact[];
      
      // Get all names to exclude (including deleted ones)
      const existingNames = existingContactList.map((c: Contact) => c.name.toLowerCase());
      
      // Count only non-deleted contacts
      const activeContactCount = existingContactList.filter((c: Contact) => !c.deleted).length;

      console.log(`Finding more contacts for ${companyName} (already have ${activeContactCount} active)`);

      // Search Apollo.io for additional contacts, excluding existing
      const websiteUrl = content.website || content.overview?.website;
      const apolloContacts = await searchApolloContacts(companyName, websiteUrl, {
        maxContacts: 50,
        excludeNames: existingNames,
        seniorityFocus: "all",
      });

      console.log(`Apollo returned ${apolloContacts.length} additional contacts for ${companyName}`);

      let filteredNewContacts = apolloContacts.filter((c: any) => 
        !existingNames.includes(c.name.toLowerCase())
      );

      // If Apollo returned no results, fall back to AI
      if (filteredNewContacts.length === 0) {
        console.log(`Apollo returned 0 new contacts for ${companyName}, falling back to AI`);
        const completion = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [
            {
              role: "system",
              content: `You are a B2B sales intelligence expert. Generate additional business contacts for sales outreach to the company provided.

              CRITICAL REQUIREMENT: Only include contacts who are CURRENTLY employed at the company as of today.
              
              Focus on Senior Managers, Directors, Regional leaders, Department heads, Technical leads, and Business development contacts.
              
              IMPORTANT: Avoid duplicating any of these existing contacts:
              ${existingNames.join(', ')}
              
              You must return a valid JSON object with this structure:
              {
                "contacts": [
                  {
                    "name": string, "title": string, "department": string,
                    "email": string, "linkedin": string, "source": string,
                    "sourceUrl": string, "relevance": string
                  }
                ]
              }
              
              Generate exactly 20 NEW contacts who are CURRENTLY employed at the company and NOT in the existing list.`
            },
            {
              role: "user",
              content: `Generate 20 additional B2B contacts for ${companyName} in the ${industry} industry.
Known leadership: ${leadership.map((l: any) => `${l.name}: ${l.role}`).join(', ')}
Company website: ${content.website || 'Not available'}
EXISTING CONTACTS TO AVOID:
${existingContactList.map((c: Contact) => `- ${c.name} (${c.title})`).join('\n')}`
            }
          ],
          response_format: { type: "json_object" }
        });
        const contactsStr = completion.choices[0].message.content;
        if (contactsStr) {
          const parsed = JSON.parse(contactsStr);
          filteredNewContacts = (parsed.contacts || []).filter((c: any) => 
            !existingNames.includes(c.name.toLowerCase())
          );
        }
      }
      
      // Merge existing and new contacts
      const mergedContacts = [...existingContactList, ...filteredNewContacts];

      // Update contacts in database
      const updatedContacts = await storage.updateContacts(existingContacts.id, {
        contacts: mergedContacts
      });

      console.log(`Added ${filteredNewContacts.length} more contacts for ${companyName} (total active: ${mergedContacts.filter((c: Contact) => !c.deleted).length})`);
      res.json(updatedContacts);
    } catch (err) {
      console.error("Add more contacts error:", err);
      res.status(500).json({ message: "Failed to add more contacts" });
    }
  });

  // Upload contacts from CSV
  app.post("/api/analyses/:id/contacts/upload", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const { uploadedContacts } = req.body;
      if (!Array.isArray(uploadedContacts) || uploadedContacts.length === 0) {
        return res.status(400).json({ message: "No contacts provided" });
      }

      const content = analysis.content as any;
      const companyName = content.companyName || analysis.companyName;

      const existingContacts = await storage.getContactsByAnalysisId(analysisId);
      const existingContactList = (existingContacts?.contacts as Contact[]) || [];
      const existingNames = existingContactList.map((c: Contact) => c.name.toLowerCase());

      const newContacts: Contact[] = uploadedContacts
        .filter((c: any) => c.name && c.name.trim() && !existingNames.includes(c.name.trim().toLowerCase()))
        .map((c: any) => ({
          name: c.name.trim(),
          title: c.title?.trim() || "",
          department: c.department?.trim() || "",
          email: c.email?.trim() || "",
          linkedin: c.linkedin?.trim() || "",
          source: "Manual Upload",
          sourceUrl: "",
          relevance: c.relevance?.trim() || "Manually uploaded contact",
          verified: true,
        }));

      if (newContacts.length === 0) {
        return res.status(400).json({ message: "No new contacts to add (all duplicates or empty)" });
      }

      if (existingContacts) {
        const mergedContacts = [...existingContactList, ...newContacts];
        const updatedContacts = await storage.updateContacts(existingContacts.id, {
          contacts: mergedContacts
        });
        console.log(`Uploaded ${newContacts.length} contacts for ${companyName}`);
        res.json(updatedContacts);
      } else {
        const savedContacts = await storage.createContacts({
          analysisId,
          companyName,
          contacts: newContacts
        });
        console.log(`Created ${newContacts.length} uploaded contacts for ${companyName}`);
        res.json(savedContacts);
      }
    } catch (err) {
      console.error("Upload contacts error:", err);
      res.status(500).json({ message: "Failed to upload contacts" });
    }
  });

  // Update a contact (toggle verified status)
  app.patch("/api/analyses/:id/contacts/:contactIndex", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const contactIndex = Number(req.params.contactIndex);
      const { verified } = req.body;

      const existingContacts = await storage.getContactsByAnalysisId(analysisId);
      if (!existingContacts) {
        return res.status(404).json({ message: "Contacts not found" });
      }

      const contactList = existingContacts.contacts as Contact[];
      if (contactIndex < 0 || contactIndex >= contactList.length) {
        return res.status(400).json({ message: "Invalid contact index" });
      }

      contactList[contactIndex].verified = verified;

      const updatedContacts = await storage.updateContacts(existingContacts.id, {
        contacts: contactList
      });

      res.json(updatedContacts);
    } catch (err) {
      console.error("Update contact error:", err);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  // Remove a contact from the list (mark as deleted, don't actually remove)
  app.delete("/api/analyses/:id/contacts/:contactIndex", async (req, res) => {
    try {
      const analysisId = Number(req.params.id);
      const contactIndex = Number(req.params.contactIndex);

      const existingContacts = await storage.getContactsByAnalysisId(analysisId);
      if (!existingContacts) {
        return res.status(404).json({ message: "Contacts not found" });
      }

      const contactList = existingContacts.contacts as Contact[];
      if (contactIndex < 0 || contactIndex >= contactList.length) {
        return res.status(400).json({ message: "Invalid contact index" });
      }

      // Mark the contact as deleted instead of removing
      contactList[contactIndex].deleted = true;

      const updatedContacts = await storage.updateContacts(existingContacts.id, {
        contacts: contactList
      });

      res.json(updatedContacts);
    } catch (err) {
      console.error("Remove contact error:", err);
      res.status(500).json({ message: "Failed to remove contact" });
    }
  });

  return httpServer;
}
