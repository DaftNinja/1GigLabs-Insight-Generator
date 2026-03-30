# replit.md

## Overview

This is a full-stack business intelligence application that generates AI-powered strategic company analyses. Users enter a company name, and the system uses OpenAI to generate comprehensive reports covering financials, strategy, market position, and technical spend. Reports can be viewed in an interactive dashboard and exported to PDF, PowerPoint, and HTML formats.

The application follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

### Report Features
- **10 Report Sections**: Executive Summary, Financials, Strategy, Market Analysis, Tech Spend, ESG & Sustainability, SWOT Analysis, Growth Opportunities, Risk Assessment, Digital Transformation
- **Export Formats**: PDF, PowerPoint (PPTX), HTML
- **Report Management**: Delete reports, force-refresh to regenerate with latest AI
- **Caching**: 2-month report cache to minimize API costs
- **Batch Upload**: CSV upload for processing 20-50 companies simultaneously

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Animations**: Framer Motion for page transitions and loading states
- **Data Visualization**: Recharts for financial charts and graphs
- **Export Features**: html2canvas and jsPDF for PDF generation, pptxgenjs for PowerPoint

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript
- **Build Tool**: esbuild for production server bundle, tsx for development
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **AI Integration**: OpenAI API (via Replit AI Integrations) for generating company analyses

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for main app tables, `shared/models/chat.ts` for chat features
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Connection**: Uses `DATABASE_URL` environment variable

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (Charts, MetricCard, etc.)
    pages/        # Route pages (Home, Dashboard)
    hooks/        # Custom React hooks
    lib/          # Utilities (queryClient, utils)
server/           # Express backend
  replit_integrations/  # AI integration modules (chat, image, audio)
shared/           # Shared types, schemas, and route definitions
```

### Key Design Patterns
- **Shared Types**: TypeScript types and Zod schemas shared between frontend and backend via `@shared/*` path alias
- **API Contract**: Routes defined with method, path, input/output schemas in `shared/routes.ts`
- **Storage Pattern**: Database operations abstracted through storage classes (e.g., `DatabaseStorage`, `chatStorage`)
- **Integration Modules**: Reusable AI integration code organized in `server/replit_integrations/`

## External Dependencies

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for text generation, image generation, and audio processing
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Session Storage**: connect-pg-simple for Express session management

### Third-Party APIs
- **Apollo.io**: Primary source for Find Contacts feature. Uses People Search API (`/api/v1/mixed_people/search`) and Organization Search (`/api/v1/mixed_companies/search`) to find real contacts at companies. Falls back gracefully to AI-only generation if Apollo API is unavailable (e.g., free plan). Helper module: `server/apollo.ts`. Environment variable: `APOLLO_API_KEY`
- **Clearbit**: Company logos based on domain (referenced in client requirements)

### Key NPM Packages
- **Backend**: express, drizzle-orm, pg, openai, zod, express-session
- **Frontend**: @tanstack/react-query, recharts, framer-motion, html2canvas, jspdf, pptxgenjs
- **UI**: @radix-ui components, tailwindcss, class-variance-authority