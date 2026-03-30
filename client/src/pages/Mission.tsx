import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Users,
  Search,
  Megaphone,
  Clock,
  DollarSign,
  Zap,
  BarChart3,
  FileText,
  Upload,
  UserSearch,
  Presentation,
  ChevronRight,
} from "lucide-react";
import logoUrl from "@/assets/logo.png";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const personas = [
  {
    title: "Investors & Analysts",
    icon: TrendingUp,
    color: "blue",
    traditionalCost: "$3,000 - $8,000",
    traditionalTime: "2 - 4 weeks",
    withTool: "Minutes",
    savings: "Up to 95%",
    description:
      "Equity research reports, due diligence packs, and competitive benchmarking typically require teams of analysts working for weeks. Our platform delivers institutional-grade strategic analysis — covering financials, SWOT, ESG, risk, and growth opportunities — in a single request.",
    tasks: [
      "Company due diligence reports",
      "Portfolio-wide competitive screening",
      "ESG & sustainability risk assessments",
      "Market positioning and SWOT analysis",
    ],
  },
  {
    title: "Researchers & Consultants",
    icon: Search,
    color: "emerald",
    traditionalCost: "$5,000 - $15,000",
    traditionalTime: "3 - 6 weeks",
    withTool: "Minutes",
    savings: "Up to 97%",
    description:
      "Market research firms charge thousands per report. Strategy consultants bill hundreds per hour for the same analysis. Our platform compresses weeks of desk research, data gathering, and report writing into a single automated workflow — without sacrificing depth.",
    tasks: [
      "Industry landscape reports",
      "Technology spend analysis",
      "Digital transformation assessments",
      "Multi-company batch analysis (up to 50 at once)",
    ],
  },
  {
    title: "Sales Teams",
    icon: Users,
    color: "violet",
    traditionalCost: "$50 - $200/user/month",
    traditionalTime: "Hours per prospect",
    withTool: "Seconds",
    savings: "Up to 90%",
    description:
      "Sales professionals spend hours researching prospects before outreach. Contact enrichment tools charge per-seat monthly fees. Our platform combines deep company intelligence with contact discovery — giving your team the strategic context they need to have meaningful conversations from the first touchpoint.",
    tasks: [
      "Pre-call company intelligence briefs",
      "Key decision-maker identification",
      "Competitive landscape for positioning",
      "Exportable reports for client-facing presentations",
    ],
  },
  {
    title: "Marketing Professionals",
    icon: Megaphone,
    color: "amber",
    traditionalCost: "$5,000 - $20,000",
    traditionalTime: "4 - 8 weeks",
    withTool: "Minutes",
    savings: "Up to 96%",
    description:
      "Competitive analysis, market sizing, and brand positioning projects are expensive agency engagements. Our platform delivers the same strategic intelligence that informs marketing campaigns — from market analysis to growth opportunities — at a fraction of the cost and turnaround time.",
    tasks: [
      "Competitive landscape and positioning",
      "Market opportunity analysis",
      "Industry trend identification",
      "Branded investor-quality presentations",
    ],
  },
];

const journeySteps = [
  {
    phase: "Foundation",
    title: "AI-Powered Analysis Engine",
    description:
      "Built the core analysis engine using GPT-5.1 to generate comprehensive 10-section strategic reports covering financials, strategy, market position, and more.",
    icon: Zap,
  },
  {
    phase: "Depth",
    title: "Expanded Report Sections",
    description:
      "Added ESG & Sustainability, SWOT Analysis, Growth Opportunities, Risk Assessment, and Digital Transformation sections for truly comprehensive coverage.",
    icon: BarChart3,
  },
  {
    phase: "Scale",
    title: "Batch Processing & Caching",
    description:
      "Introduced CSV batch upload for processing 20-50 companies simultaneously, plus 2-month intelligent caching to minimise AI costs and improve response times.",
    icon: Upload,
  },
  {
    phase: "Export",
    title: "Multi-Format Export",
    description:
      "Added professional PDF, PowerPoint (PPTX), and HTML export capabilities, enabling users to share and present findings in any format.",
    icon: FileText,
  },
  {
    phase: "Intelligence",
    title: "Contact Discovery",
    description:
      "Integrated Apollo.io as the primary B2B contact source with AI-powered fallback, CSV import/export, and contact verification tools.",
    icon: UserSearch,
  },
  {
    phase: "Presentation",
    title: "Investor Presentation Generator",
    description:
      "Built a branded, 8-slide investor presentation generator with one-click PowerPoint export — turning raw analysis into boardroom-ready materials.",
    icon: Presentation,
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", light: "bg-blue-50" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", light: "bg-emerald-50" },
  violet: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", light: "bg-violet-50" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", light: "bg-amber-50" },
};

export default function Mission() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <a href="https://www.1giglabs.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white p-2 rounded-lg hover:opacity-90 transition-opacity">
            <img src={logoUrl} alt="1GigLabs" className="h-10 w-auto object-contain" />
          </a>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-primary" data-testid="button-home">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-primary" data-testid="button-reports">
                Reports
              </Button>
            </Link>
            <a href="/case-studies/" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-primary" data-testid="button-deep-research">
                Deep Research Reports
              </Button>
            </a>
            <Link href="/presentation">
              <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-primary" data-testid="button-presentation">
                Presentation
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.section {...fadeIn} className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Target className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900" data-testid="text-page-title">
              Our Mission
            </h1>
          </div>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-slate-700 leading-relaxed mb-6" data-testid="text-mission-statement">
              To democratise strategic business intelligence by replacing weeks of expensive analyst work with
              AI-powered reports delivered in minutes — making institutional-grade company analysis accessible
              to every investor, researcher, sales professional, and marketer.
            </p>
            <p className="text-slate-500 leading-relaxed">
              We believe that deep company insight should not be locked behind six-figure consulting fees
              or month-long research cycles. By combining the latest advances in AI with structured analytical
              frameworks, we deliver the same depth of analysis that Fortune 500 strategy teams rely on —
              at a fraction of the cost and turnaround time.
            </p>
          </div>
        </motion.section>

        <motion.section
          {...fadeIn}
          transition={{ delay: 0.1 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mb-3" data-testid="text-journey-title">
              How We Got Here
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Built through rapid iteration, each phase added a new layer of capability — transforming a simple
              analysis tool into a full-stack business intelligence platform.
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2" />
            <div className="space-y-8">
              {journeySteps.map((step, index) => {
                const Icon = step.icon;
                const isLeft = index % 2 === 0;
                return (
                  <motion.div
                    key={step.phase}
                    initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
                    data-testid={`journey-step-${index}`}
                  >
                    <div className={`flex-1 ${isLeft ? "md:text-right" : "md:text-left"}`}>
                      <Card className="inline-block w-full max-w-md border border-slate-200">
                        <CardContent className="p-6">
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1 block">
                            {step.phase}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="relative z-10 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          {...fadeIn}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mb-3" data-testid="text-value-title">
              The Value We Deliver
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Traditional business intelligence is slow and expensive. Here is how our platform compares
              across four key professional personas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {personas.map((persona, index) => {
              const Icon = persona.icon;
              const colors = colorMap[persona.color];
              return (
                <motion.div
                  key={persona.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.08 }}
                >
                  <Card className={`h-full border ${colors.border} hover:shadow-lg transition-shadow`} data-testid={`card-persona-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{persona.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-5">{persona.description}</p>

                      <div className={`grid grid-cols-2 gap-3 mb-5 p-4 rounded-lg ${colors.light}`}>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Traditional Cost</p>
                          <p className="text-sm font-semibold text-slate-800">{persona.traditionalCost}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Traditional Time</p>
                          <p className="text-sm font-semibold text-slate-800">{persona.traditionalTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">With Our Platform</p>
                          <div className="flex items-center gap-1">
                            <Clock className={`w-3.5 h-3.5 ${colors.text}`} />
                            <p className={`text-sm font-semibold ${colors.text}`}>{persona.withTool}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Cost Savings</p>
                          <div className="flex items-center gap-1">
                            <DollarSign className={`w-3.5 h-3.5 ${colors.text}`} />
                            <p className={`text-sm font-bold ${colors.text}`}>{persona.savings}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Key Use Cases</p>
                        <ul className="space-y-1.5">
                          {persona.tasks.map((task) => (
                            <li key={task} className="flex items-start gap-2 text-sm text-slate-600">
                              <ChevronRight className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          {...fadeIn}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
            <CardContent className="p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mb-4" data-testid="text-bottom-line-title">
                The Bottom Line
              </h2>
              <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto mb-8">
                What once required a team of analysts, weeks of research, and tens of thousands in consulting fees
                can now be accomplished by a single person in minutes. Our platform does not just save money — it
                fundamentally changes who can access strategic business intelligence and how quickly they can act on it.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
                <div>
                  <p className="text-3xl font-bold text-blue-600" data-testid="text-stat-sections">10</p>
                  <p className="text-xs text-slate-500 mt-1">Report Sections</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600" data-testid="text-stat-formats">3</p>
                  <p className="text-xs text-slate-500 mt-1">Export Formats</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600" data-testid="text-stat-batch">50</p>
                  <p className="text-xs text-slate-500 mt-1">Companies per Batch</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600" data-testid="text-stat-time">~2 min</p>
                  <p className="text-xs text-slate-500 mt-1">Per Report</p>
                </div>
              </div>
              <Link href="/">
                <Button size="lg" className="font-semibold" data-testid="button-get-started">
                  Get Started — Generate a Report
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
          Built by{" "}
          <a href="https://www.1giglabs.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            1GigLabs
          </a>{" "}
          — Strategic Business Intelligence, Powered by AI
        </div>
      </footer>
    </div>
  );
}
