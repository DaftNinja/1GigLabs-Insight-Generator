# Strategic Business Analysis Platform - Complete Build Guide

A step-by-step guide to recreate this AI-powered business intelligence application from scratch.

---

## What This App Does

Users enter a company name and the app generates a comprehensive AI-powered strategic analysis report. Reports can be viewed in an interactive dashboard and exported to PDF, PowerPoint, and HTML. There's also a "Find Contacts" feature that generates B2B sales contacts for each company, with manual verification and deletion tracking.

---

## Step 1: Set Up the Foundation

### Tech Stack
- **Frontend**: React + TypeScript + Vite, Wouter routing, TanStack Query, shadcn/ui, Tailwind CSS, Recharts, Framer Motion
- **Backend**: Express 5 + Node.js + TypeScript, Drizzle ORM, Zod validation
- **AI**: OpenAI GPT-5.1 via Replit AI Integrations
- **Database**: PostgreSQL (Replit built-in)
- **Exports**: html2canvas + jsPDF (PDF), pptxgenjs (PowerPoint), Blob (HTML)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection (provided by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI key (via Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL (via Replit AI Integrations)
- `SESSION_SECRET` - Express session secret

### Install the OpenAI Integration
Use Replit's AI Integrations to install OpenAI. This auto-manages the API key and base URL.

---

## Step 2: Database Schema

### Two Tables

**`analyses`** - Stores company reports:
```typescript
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  content: jsonb("content").notNull(),    // Full AI-generated report as JSON
  createdAt: timestamp("created_at").defaultNow(),
});
```

**`contacts`** - Stores B2B contacts per company:
```typescript
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  analysisId: serial("analysis_id").notNull(),
  companyName: text("company_name").notNull(),
  contacts: jsonb("contacts").notNull(),  // Array of contact objects as JSON
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Contact Object Schema (stored in JSONB)
Each contact in the array has these fields:
```typescript
{
  name: string,
  title: string,
  department: string (optional),
  email: string (optional),
  linkedin: string (optional),     // LinkedIn search URL
  source: string,                  // "Crunchbase", "Wikipedia", "Company Website", "LinkedIn", etc.
  sourceUrl: string (optional),    // Verification URL
  relevance: string,               // Why this contact matters for B2B outreach
  verified: boolean (optional),    // User manually verified this contact
  deleted: boolean (optional),     // Soft-deleted, hidden from view, never re-added
}
```

### Report Content Schema (stored in JSONB)
The `content` field in analyses stores a large JSON object with these 10 sections:

1. **Executive Summary** - 2-3 paragraph overview
2. **Company Overview** - founded, headquarters, employees, locations, NAICS/SIC codes
3. **Financials** - revenue, growth, net income, stock symbol, 5-year chart data
4. **Strategy** - vision, strategic initiatives, leadership team with bios
5. **Market Analysis** - competitors, challenges, market share
6. **Technical/IT Spend** - total budget, breakdown by 7 categories (network, hardware, software, cloud, data center, AI/automation, outsourced services)
7. **ESG & Sustainability** - environmental initiatives, social responsibility, governance, ESG rating, net zero target
8. **SWOT Analysis** - strengths, weaknesses, opportunities, threats
9. **Growth Opportunities** - summary, individual opportunities with impact, emerging markets
10. **Risk Assessment** - overall risk level, individual risks with severity/mitigation, regulatory risks
11. **Digital Transformation** - maturity level, current initiatives with status, tech stack, AI adoption, future roadmap

---

## Step 3: Pages and Routes

### 4 Pages
| Route | Page | Purpose |
|-------|------|---------|
| `/` | Home | Company name input + CSV batch upload |
| `/reports` | Reports | Portfolio of all generated reports ("Deep Research Reports") |
| `/analyze/:id` | Dashboard | Full interactive report view with charts and exports |
| `/contacts/:id` | Contacts | B2B contacts for a specific company |

### Navigation
- Home page has a link to Reports page
- Reports page lists all reports, clicking one goes to Dashboard
- Dashboard has a "Find Contacts" button that links to Contacts page
- All pages have navigation back to Home

---

## Step 4: API Endpoints

### Analysis Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/analysis` | Create/retrieve analysis (with 2-month caching) |
| GET | `/api/analyses` | List all analyses |
| GET | `/api/analyses/:id` | Get single analysis |
| DELETE | `/api/analyses/:id` | Delete an analysis |
| POST | `/api/analyses/:id/refresh` | Force-refresh (regenerate with AI) |

### Contact Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/analyses/:id/contacts` | Get contacts for an analysis |
| POST | `/api/analyses/:id/contacts` | Generate initial contacts (10-15) |
| POST | `/api/analyses/:id/contacts/refresh` | Refresh contacts (preserves verified, tracks deleted) |
| POST | `/api/analyses/:id/contacts/more` | Find 20 more contacts |
| PATCH | `/api/analyses/:id/contacts/:contactIndex` | Toggle verified status |
| DELETE | `/api/analyses/:id/contacts/:contactIndex` | Soft-delete a contact |

---

## Step 5: AI Integration - Report Generation

### OpenAI Configuration
```typescript
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
```

### Model: `gpt-5.1` with `response_format: { type: "json_object" }`

### Report System Prompt
The system prompt tells the AI to act as a "top-tier strategic business analyst" and return a structured JSON object matching the content schema above. Key instructions:
- Use the most up-to-date information available
- Ensure leadership team members are accurate as of today
- Financial figures must reflect the most recent fiscal years
- Include all 10 report sections
- For Technical Spend, combine "Managed Services" with "Outsourced Services/Contracts" (mention known vendors like Accenture, DXC, HCL, Tata, etc.)
- Estimate technical spend based on industry standards if exact figures aren't public

### Report Caching Strategy
Before calling the AI, check if a cached report exists:
1. Look up company name (case-insensitive, trimmed)
2. If found and less than 2 months old, return cached version (no AI cost)
3. If found but older than 2 months, regenerate
4. If not found, generate new

---

## Step 6: AI Integration - Contact Generation

### Contact Generation System Prompt
The AI acts as a "B2B sales intelligence expert." Key instructions:

**Source Priority Order (critical):**
1. **Crunchbase** - current leadership team, executives, and active investors
2. **Wikipedia** - check "Key people" and "Leadership" sections for C-Suite executives
3. **Company Website** - leadership/about/team pages
4. **LinkedIn** - profiles of key executives and decision-makers
5. **Other sources** - industry publications, press releases (within last 12 months)

**Important**: Wikipedia is excellent for recent C-Suite changes (CEO/CFO transitions).

**Verification requirement**: Only include contacts who are CURRENTLY employed. Before including any contact, verify they haven't been terminated, resigned, retired, or moved to a different company.

**Contact focus:**
- C-Suite executives (CEO, CFO, CTO, CIO, CMO, CHRO)
- VP and Director level in relevant departments (IT, Operations, Procurement, Digital)
- Key decision-makers for technology and services purchases

**Email format**: Use most likely corporate pattern (firstname.lastname@company.com)

**LinkedIn field**: Use search URL format: `https://www.linkedin.com/search/results/people/?keywords=FirstName%20LastName%20CompanyName`

### "Find 20 More" Contacts
Same approach but:
- Focus on Senior Managers, Directors, Regional leaders, Department heads, Technical leads
- Exclude all existing contact names (including deleted ones) from results
- Generate exactly 20 new contacts

### Contact Refresh Logic
When refreshing contacts:
1. **Preserve verified contacts** - Don't replace anyone the user has verified
2. **Track deleted contacts** - Keep deleted names in the database so they're never re-added
3. **Generate fresh unverified contacts** - Fill in with new AI-generated contacts
4. **Filter results** - Remove any AI-generated contacts that match verified or deleted names

---

## Step 7: Contact Management Features

### Verified Contacts (Locking)
- Each contact has a "Verified" checkbox
- When checked, the contact is **locked** in the database
- Verified contacts are preserved during refresh operations
- Verified contacts display with a green background (bg-green-50)

### Deleted Contacts (Soft Delete)
- Each contact has a "Remove" button (trash icon)
- Clicking it sets `deleted: true` on the contact (does NOT remove from database)
- Deleted contacts are hidden from the UI
- Deleted contacts are excluded from CSV exports
- Deleted contact names are tracked so the AI never re-adds them during refresh or "Find 20 More"

### Search/Verify Button
- Each contact has a "Search" button that opens a Google search
- Search URL format: `https://www.google.com/search?q=ContactName+Title+CompanyName`
- This lets users verify the contact is real and currently employed

### Important: Index Tracking
Since deleted contacts remain in the database array but are hidden from the UI, the frontend must track `originalIndex` (position in the full database array) vs display index. All API calls (verify, delete) must use the originalIndex.

---

## Step 8: Report Dashboard Features

### Company Branding Header
Display prominently above the Executive Summary:
- Company name (large heading)
- Company logo (from Clearbit: `https://logo.clearbit.com/{domain}`)
- Stock ticker symbol
- Company website URL
- Report generation date (dd/mm/yyyy format)

### Tab Navigation
10 tabs for the report sections, with smooth scroll to each section.

### Data Visualization (Recharts)
- **Financial chart**: Line/bar chart showing 5-year revenue and net income trends
- **Tech spend breakdown**: Pie or bar chart showing IT budget by category
- **SWOT**: Four-quadrant card layout
- **Risk assessment**: Color-coded severity indicators

### Export Options
| Format | Technology | Implementation |
|--------|------------|----------------|
| PDF | html2canvas + jsPDF | Capture report div as image, compile into multi-page A4 PDF |
| PowerPoint | pptxgenjs | Create slides with company branding colors, one slide per section |
| HTML | Blob download | Generate standalone HTML with embedded CSS |

---

## Step 9: Reports Portfolio Page

### "Deep Research Reports"
- Lists all generated analyses
- Sort options: newest first, oldest first, alphabetical A-Z, alphabetical Z-A
- Each report card shows: company name, generation date (dd/mm/yyyy), industry
- Click to open the full dashboard
- Delete button with confirmation
- Force-refresh button to regenerate with latest AI data

---

## Step 10: Batch CSV Upload

### CSV Format
Simple text file with one company name per line:
```
Apple
Microsoft
Google
Amazon
Meta
```

### Processing
- Upload CSV on the Home page
- Parse company names from the file
- Process 20-50 companies sequentially
- Show progress bar during processing
- Each company uses the same caching logic (skip if cached within 2 months)
- Display results with success/error status for each company

---

## Step 11: Date Formatting

All dates throughout the application display in **dd/mm/yyyy** format. Apply this consistently to:
- Report generation dates on the Dashboard
- Report cards on the Reports page
- Contact generation dates

---

## Step 12: Warning Banner for AI Contacts

Display an amber/warning banner above the contacts table:
> **Important:** AI-generated contacts may not reflect recent changes. Click "Search" to verify current employment before outreach.

This sets proper expectations that AI-generated contacts need manual verification.

---

## Step 13: CSV Export for Contacts

The contacts page has a "Download CSV" button that exports:
- Columns: Verified, Name, Title, Department, Email, LinkedIn, Source, Relevance
- Only includes non-deleted contacts
- Verified column shows "Yes" or "No"
- Filename: `{CompanyName}-Contacts.csv`

---

## Cost Estimates

| Scenario | Cost |
|----------|------|
| Single report | ~$0.12-$0.18 |
| Single contact generation | ~$0.05-$0.10 |
| Batch of 50 companies | ~$6-$9 |
| With 2-month caching | Repeated lookups cost $0 |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| PostgreSQL JSONB for report content | Flexible schema for AI-generated content without migrations |
| 2-month cache expiration | Balance data freshness vs. API costs |
| Case-insensitive company lookup | Prevent duplicate reports for "Apple" vs "apple" |
| Soft-delete contacts | Prevent AI from re-adding removed people |
| Verified = locked | Protect user-confirmed contacts during refresh |
| Client-side exports | No server load for PDF/PPTX generation |
| Wikipedia as source priority | Most up-to-date for C-Suite leadership changes |
| Google search for verification | Universal, free, always works (unlike guessed LinkedIn URLs) |
| Source priority: Crunchbase > Wikipedia > Company Website > LinkedIn > Other | Best accuracy for current leadership data |

---

## Branding

- **Primary Color**: #0047BB
- **Report Title**: "Deep Research Reports"
- **Footer**: "1GigLabs Strategic Analysis Platform"

---

*Document updated: February 2026*
*Platform: Replit Full-Stack Application*
