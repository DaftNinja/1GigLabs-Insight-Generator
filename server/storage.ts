import { analyses, contacts, type Analysis, type InsertAnalysis, type Contacts, type InsertContacts } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysisByCompanyName(companyName: string): Promise<Analysis | undefined>;
  listAnalyses(): Promise<Analysis[]>;
  updateAnalysis(id: number, analysis: InsertAnalysis): Promise<Analysis>;
  deleteAnalysis(id: number): Promise<void>;
  createContacts(data: InsertContacts): Promise<Contacts>;
  getContactsByAnalysisId(analysisId: number): Promise<Contacts | undefined>;
  deleteContactsByAnalysisId(analysisId: number): Promise<void>;
  updateContacts(id: number, data: { contacts: any }): Promise<Contacts>;
}

export class DatabaseStorage implements IStorage {
  async createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
    const [created] = await db.insert(analyses).values(analysis).returning();
    return created;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, id));
    return analysis;
  }

  async getAnalysisByCompanyName(companyName: string): Promise<Analysis | undefined> {
    const normalizedName = companyName.trim().toLowerCase();
    const [analysis] = await db
      .select()
      .from(analyses)
      .where(sql`lower(trim(${analyses.companyName})) = ${normalizedName}`)
      .orderBy(desc(analyses.createdAt))
      .limit(1);
    return analysis;
  }

  async listAnalyses(): Promise<Analysis[]> {
    return db.select().from(analyses).orderBy(desc(analyses.createdAt));
  }

  async updateAnalysis(id: number, analysis: InsertAnalysis): Promise<Analysis> {
    const [updated] = await db
      .update(analyses)
      .set({ ...analysis, createdAt: new Date() })
      .where(eq(analyses.id, id))
      .returning();
    return updated;
  }

  async deleteAnalysis(id: number): Promise<void> {
    await db.delete(analyses).where(eq(analyses.id, id));
  }

  async createContacts(data: InsertContacts): Promise<Contacts> {
    const [created] = await db.insert(contacts).values(data).returning();
    return created;
  }

  async getContactsByAnalysisId(analysisId: number): Promise<Contacts | undefined> {
    const [result] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.analysisId, analysisId));
    return result;
  }

  async deleteContactsByAnalysisId(analysisId: number): Promise<void> {
    await db.delete(contacts).where(eq(contacts.analysisId, analysisId));
  }

  async updateContacts(id: number, data: { contacts: any }): Promise<Contacts> {
    const [updated] = await db
      .update(contacts)
      .set({ contacts: data.contacts })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
