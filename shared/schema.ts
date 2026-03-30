import { pgTable, text, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  analysisId: serial("analysis_id").notNull(),
  companyName: text("company_name").notNull(),
  contacts: jsonb("contacts").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === JSON CONTENT SCHEMA ===
export const analysisContentSchema = z.object({
  companyName: z.string(),
  website: z.string().optional(),
  colorScheme: z.object({
    primary: z.string(),
    secondary: z.string(),
  }).optional(),
  executiveSummary: z.string(),
  overview: z.object({
    description: z.string(),
    founded: z.string(),
    headquarters: z.string(),
    employees: z.string(),
    locations: z.array(z.string()),
    naics: z.string().optional(),
    sic: z.string().optional(),
  }),
  financials: z.object({
    revenue: z.string(),
    revenueGrowth: z.string(),
    netIncome: z.string(),
    stockSymbol: z.string().optional(),
    recentPerformance: z.string(),
    chartData: z.array(z.object({ year: z.string(), revenue: z.number(), netIncome: z.number() })).optional(),
  }),
  strategy: z.object({
    vision: z.string(),
    initiatives: z.array(z.object({ title: z.string(), description: z.string() })),
    leadership: z.array(z.object({ name: z.string(), role: z.string(), bio: z.string().optional() })).optional(),
  }),
  market: z.object({
    competitors: z.array(z.object({ name: z.string(), description: z.string() })),
    challenges: z.array(z.string()),
    marketShare: z.string().optional(),
  }),
  technicalSpend: z.object({
    totalEstimatedBudget: z.string(),
    breakdown: z.array(z.object({ category: z.string(), percentage: z.number(), estimatedAmount: z.string() })),
    categories: z.object({
      network: z.string(),
      hardware: z.string(),
      software: z.string(),
      cloud: z.string(),
      dataCenter: z.string(),
      aiAndAutomation: z.string(),
      outsourcedServices: z.string(),
    }),
  }),
  // New business insight sections
  esgSustainability: z.object({
    overview: z.string(),
    environmentalInitiatives: z.array(z.string()),
    socialResponsibility: z.array(z.string()),
    governancePractices: z.array(z.string()),
    esgRating: z.string().optional(),
    netZeroTarget: z.string().optional(),
  }).optional(),
  swotAnalysis: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }).optional(),
  growthOpportunities: z.object({
    summary: z.string(),
    opportunities: z.array(z.object({ 
      title: z.string(), 
      description: z.string(), 
      potentialImpact: z.string() 
    })),
    emergingMarkets: z.array(z.string()).optional(),
  }).optional(),
  riskAssessment: z.object({
    overallRiskLevel: z.string(),
    risks: z.array(z.object({ 
      category: z.string(), 
      description: z.string(), 
      severity: z.string(),
      mitigation: z.string() 
    })),
    regulatoryRisks: z.array(z.string()).optional(),
  }).optional(),
  digitalTransformation: z.object({
    maturityLevel: z.string(),
    currentInitiatives: z.array(z.object({ title: z.string(), description: z.string(), status: z.string() })),
    techStack: z.array(z.string()).optional(),
    aiAdoption: z.string().optional(),
    futureRoadmap: z.string().optional(),
  }).optional(),
});

// === CONTACT SCHEMA ===
export const contactSchema = z.object({
  name: z.string(),
  title: z.string(),
  department: z.string().optional(),
  email: z.string().optional(),
  linkedin: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string().optional(),
  relevance: z.string(),
  verified: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

export const contactsContentSchema = z.array(contactSchema);

// === BASE SCHEMAS ===
export const insertAnalysisSchema = createInsertSchema(analyses).omit({ id: true, createdAt: true });
export const insertContactsSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type AnalysisContent = z.infer<typeof analysisContentSchema>;

export type Contact = z.infer<typeof contactSchema>;
export type Contacts = typeof contacts.$inferSelect;
export type InsertContacts = z.infer<typeof insertContactsSchema>;

export type CreateAnalysisRequest = { companyName: string };
export type AnalysisResponse = Analysis & { parsedContent: AnalysisContent };

export * from "./models/chat";
