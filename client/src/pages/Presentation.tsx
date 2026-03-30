import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, Presentation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import pptxgen from "pptxgenjs";

import slideHero from "@assets/slides/slide-hero.png";
import slideAI from "@assets/slides/slide-ai-powered.png";
import slideAnalytics from "@assets/slides/slide-analytics.png";
import slideContacts from "@assets/slides/slide-contacts.png";
import slideExports from "@assets/slides/slide-exports.png";
import slideCost from "@assets/slides/slide-cost.png";
import slideBatch from "@assets/slides/slide-batch.png";
import slideCTA from "@assets/slides/slide-cta.png";
import logo from "@assets/1GigLabs-Std-Logo_1769543638148.png";

const BRAND_BLUE = "0047BB";
const BRAND_DARK = "001A3D";
const WHITE = "FFFFFF";
const LIGHT_BLUE = "4DA3FF";
const ACCENT_CYAN = "00D4FF";

async function imageToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function PresentationPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generatePresentation = async () => {
    setIsGenerating(true);
    try {
      const [heroImg, aiImg, analyticsImg, contactsImg, exportsImg, costImg, batchImg, ctaImg, logoImg] = await Promise.all([
        imageToBase64(slideHero),
        imageToBase64(slideAI),
        imageToBase64(slideAnalytics),
        imageToBase64(slideContacts),
        imageToBase64(slideExports),
        imageToBase64(slideCost),
        imageToBase64(slideBatch),
        imageToBase64(slideCTA),
        imageToBase64(logo),
      ]);

      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "1GigLabs";
      pptx.company = "1GigLabs";
      pptx.subject = "Strategic Analysis Platform";
      pptx.title = "1GigLabs - AI-Powered Business Intelligence";

      const addDarkWash = (slide: any, bgImage: string) => {
        slide.addImage({ data: bgImage, x: 0, y: 0, w: "100%", h: "100%" });
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: "100%", h: "100%",
          fill: { color: "000000", transparency: 55 },
        });
      };

      const addLogo = (slide: any) => {
        slide.addImage({ data: logoImg, x: 0.4, y: 0.3, w: 1.2, h: 0.5 });
      };

      const addFooter = (slide: any) => {
        slide.addText("1GigLabs  |  AI-Powered Strategic Intelligence", {
          x: 0, y: 7.0, w: "100%", h: 0.5,
          fontSize: 9, color: "AAAAAA", align: "center", fontFace: "Arial",
        });
      };

      // === SLIDE 1: TITLE ===
      const slide1 = pptx.addSlide();
      addDarkWash(slide1, heroImg);
      addLogo(slide1);
      slide1.addText("AI-Powered\nStrategic Business Intelligence", {
        x: 0.8, y: 1.8, w: 8, h: 2.0,
        fontSize: 40, color: WHITE, fontFace: "Arial", bold: true,
        lineSpacingMultiple: 1.2,
      });
      slide1.addText("Comprehensive company analysis, B2B contact intelligence,\nand actionable insights — powered by GPT-5.1", {
        x: 0.8, y: 3.8, w: 8, h: 1.0,
        fontSize: 18, color: LIGHT_BLUE, fontFace: "Arial",
        lineSpacingMultiple: 1.3,
      });
      slide1.addText("www.1giglabs.com", {
        x: 0.8, y: 5.2, w: 4, h: 0.5,
        fontSize: 14, color: ACCENT_CYAN, fontFace: "Arial",
      });

      // === SLIDE 2: THE PROBLEM ===
      const slide2 = pptx.addSlide();
      addDarkWash(slide2, aiImg);
      addLogo(slide2);
      slide2.addText("The Challenge", {
        x: 0.8, y: 1.2, w: 8, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      const problems = [
        "Strategic research takes weeks of analyst time per company",
        "Leadership data becomes outdated within months",
        "B2B contact lists require expensive third-party subscriptions",
        "No single platform combines analysis with sales intelligence",
        "Batch processing dozens of companies is impractical manually",
      ];
      problems.forEach((problem, i) => {
        slide2.addText(problem, {
          x: 1.2, y: 2.3 + i * 0.75, w: 10, h: 0.6,
          fontSize: 18, color: WHITE, fontFace: "Arial",
          bullet: { type: "bullet" },
        });
      });
      addFooter(slide2);

      // === SLIDE 3: THE SOLUTION ===
      const slide3 = pptx.addSlide();
      addDarkWash(slide3, analyticsImg);
      addLogo(slide3);
      slide3.addText("Our Solution", {
        x: 0.8, y: 1.2, w: 8, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      slide3.addText("Enter a company name. Get a comprehensive strategic report in under 60 seconds.", {
        x: 0.8, y: 2.1, w: 10, h: 0.7,
        fontSize: 20, color: ACCENT_CYAN, fontFace: "Arial", italic: true,
      });
      const solutions = [
        ["10-Section Deep Research Reports", "Executive Summary, Financials, Strategy, Market Analysis, Tech Spend, ESG, SWOT, Growth, Risk, Digital Transformation"],
        ["AI-Powered Contact Intelligence", "Find key decision-makers with verification tools and source prioritisation"],
        ["Multi-Format Export", "PDF, PowerPoint, and HTML — ready for boardrooms and stakeholders"],
        ["Batch Processing", "Upload a CSV and analyse 20-50 companies simultaneously"],
      ];
      solutions.forEach((item, i) => {
        slide3.addText(item[0], {
          x: 1.0, y: 3.0 + i * 0.9, w: 4.5, h: 0.4,
          fontSize: 16, color: WHITE, fontFace: "Arial", bold: true,
        });
        slide3.addText(item[1], {
          x: 5.5, y: 3.0 + i * 0.9, w: 7, h: 0.4,
          fontSize: 14, color: "CCCCCC", fontFace: "Arial",
        });
      });
      addFooter(slide3);

      // === SLIDE 4: 10 REPORT SECTIONS ===
      const slide4 = pptx.addSlide();
      slide4.background = { color: BRAND_DARK };
      addLogo(slide4);
      slide4.addText("Deep Research Reports", {
        x: 0.8, y: 1.2, w: 12, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      slide4.addText("Every report covers 10 strategic dimensions, generated by GPT-5.1", {
        x: 0.8, y: 2.0, w: 12, h: 0.5,
        fontSize: 16, color: LIGHT_BLUE, fontFace: "Arial",
      });
      const sections = [
        ["Executive Summary", "High-level strategic overview"],
        ["Financial Performance", "Revenue, growth, 5-year trends"],
        ["Strategic Analysis", "Vision, initiatives, leadership"],
        ["Market Landscape", "Competitors, challenges, share"],
        ["Technical Spend", "IT budget breakdown by category"],
        ["ESG & Sustainability", "Environmental & governance ratings"],
        ["SWOT Analysis", "Strengths, weaknesses, opportunities, threats"],
        ["Growth Opportunities", "Emerging markets & expansion"],
        ["Risk Assessment", "Severity ratings & mitigation"],
        ["Digital Transformation", "Maturity, AI adoption, roadmap"],
      ];
      sections.forEach((section, i) => {
        const col = i < 5 ? 0 : 1;
        const row = i % 5;
        const xPos = col === 0 ? 0.8 : 6.8;
        const yPos = 2.8 + row * 0.8;
        slide4.addText(`${String(i + 1).padStart(2, '0')}`, {
          x: xPos, y: yPos, w: 0.5, h: 0.6,
          fontSize: 14, color: ACCENT_CYAN, fontFace: "Arial", bold: true,
        });
        slide4.addText(section[0], {
          x: xPos + 0.5, y: yPos, w: 2.5, h: 0.3,
          fontSize: 14, color: WHITE, fontFace: "Arial", bold: true,
        });
        slide4.addText(section[1], {
          x: xPos + 0.5, y: yPos + 0.3, w: 4.5, h: 0.3,
          fontSize: 11, color: "999999", fontFace: "Arial",
        });
      });
      addFooter(slide4);

      // === SLIDE 5: FIND CONTACTS ===
      const slide5 = pptx.addSlide();
      addDarkWash(slide5, contactsImg);
      addLogo(slide5);
      slide5.addText("B2B Contact Intelligence", {
        x: 0.8, y: 1.2, w: 10, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      slide5.addText("AI-powered contact discovery with manual verification workflow", {
        x: 0.8, y: 2.0, w: 10, h: 0.5,
        fontSize: 16, color: LIGHT_BLUE, fontFace: "Arial",
      });
      const contactFeatures = [
        ["Multi-Source Research", "Crunchbase, Wikipedia, Company Websites, LinkedIn"],
        ["Leadership Focus", "C-Suite, VPs, Directors, Key Decision-Makers"],
        ["Verification Workflow", "Google search links, verified checkboxes, soft-delete"],
        ["Find 20 More", "Append additional contacts without duplicates"],
        ["Upload Your Own", "CSV upload to add your own contacts to the list"],
        ["Smart Refresh", "Preserves verified contacts, tracks deleted names"],
      ];
      contactFeatures.forEach((feature, i) => {
        const col = i < 3 ? 0 : 1;
        const row = i % 3;
        const xPos = col === 0 ? 0.8 : 6.5;
        const yPos = 3.0 + row * 1.2;
        slide5.addText(feature[0], {
          x: xPos, y: yPos, w: 5, h: 0.4,
          fontSize: 16, color: ACCENT_CYAN, fontFace: "Arial", bold: true,
        });
        slide5.addText(feature[1], {
          x: xPos, y: yPos + 0.4, w: 5, h: 0.4,
          fontSize: 13, color: "CCCCCC", fontFace: "Arial",
        });
      });
      addFooter(slide5);

      // === SLIDE 6: EXPORT & DELIVER ===
      const slide6 = pptx.addSlide();
      addDarkWash(slide6, exportsImg);
      addLogo(slide6);
      slide6.addText("Export & Deliver", {
        x: 0.8, y: 1.2, w: 8, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      slide6.addText("Reports ready for every audience and format", {
        x: 0.8, y: 2.0, w: 8, h: 0.5,
        fontSize: 16, color: LIGHT_BLUE, fontFace: "Arial",
      });
      const exports = [
        ["PDF Reports", "Print-ready documents with full branding and charts", "Boardroom presentations & stakeholder briefings"],
        ["PowerPoint Decks", "Professional slides with company colours and data", "Executive presentations & team meetings"],
        ["HTML Reports", "Standalone web-ready reports with embedded styling", "Email sharing & archival"],
        ["CSV Contacts", "Downloadable contact lists with verification status", "CRM import & sales outreach campaigns"],
      ];
      exports.forEach((exp, i) => {
        slide6.addText(exp[0], {
          x: 0.8, y: 3.0 + i * 1.0, w: 3, h: 0.4,
          fontSize: 18, color: WHITE, fontFace: "Arial", bold: true,
        });
        slide6.addText(exp[1], {
          x: 3.8, y: 3.0 + i * 1.0, w: 5, h: 0.4,
          fontSize: 13, color: "CCCCCC", fontFace: "Arial",
        });
        slide6.addText(exp[2], {
          x: 8.8, y: 3.0 + i * 1.0, w: 4, h: 0.4,
          fontSize: 11, color: "999999", fontFace: "Arial", italic: true,
        });
      });
      addFooter(slide6);

      // === SLIDE 7: BATCH PROCESSING ===
      const slide7 = pptx.addSlide();
      addDarkWash(slide7, batchImg);
      addLogo(slide7);
      slide7.addText("Scale With Batch Processing", {
        x: 0.8, y: 1.2, w: 10, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      slide7.addText("Upload a CSV. Analyse an entire portfolio in minutes.", {
        x: 0.8, y: 2.1, w: 10, h: 0.5,
        fontSize: 20, color: ACCENT_CYAN, fontFace: "Arial", italic: true,
      });
      const batchFeatures = [
        "Process 20-50 companies from a single CSV file",
        "Progress tracking with real-time status updates",
        "Automatic 2-month caching eliminates redundant API costs",
        "Case-insensitive deduplication prevents duplicate reports",
        "Each company gets the same 10-section deep research report",
        "Perfect for portfolio reviews, competitive landscapes, and due diligence",
      ];
      batchFeatures.forEach((feature, i) => {
        slide7.addText(feature, {
          x: 1.2, y: 3.0 + i * 0.65, w: 10, h: 0.5,
          fontSize: 16, color: WHITE, fontFace: "Arial",
          bullet: { type: "bullet" },
        });
      });
      addFooter(slide7);

      // === SLIDE 8: COST EFFICIENCY ===
      const slide8 = pptx.addSlide();
      addDarkWash(slide8, costImg);
      addLogo(slide8);
      slide8.addText("Cost-Efficient by Design", {
        x: 0.8, y: 1.2, w: 10, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      const costs = [
        ["Single Report", "$0.12 - $0.18", "Generated in ~60 seconds"],
        ["Batch of 50", "$6 - $9", "Complete portfolio analysis"],
        ["Monthly (100 unique)", "$12 - $18", "Full research coverage"],
        ["With 2-Month Cache", "60-80% savings", "Repeated lookups cost $0"],
      ];
      costs.forEach((cost, i) => {
        slide8.addShape(pptx.ShapeType.roundRect, {
          x: 0.8 + i * 3.0, y: 2.5, w: 2.7, h: 3.0,
          fill: { color: "000000", transparency: 50 },
          rectRadius: 0.15,
          line: { color: ACCENT_CYAN, width: 1 },
        });
        slide8.addText(cost[0], {
          x: 0.8 + i * 3.0, y: 2.7, w: 2.7, h: 0.8,
          fontSize: 14, color: "CCCCCC", fontFace: "Arial", align: "center",
        });
        slide8.addText(cost[1], {
          x: 0.8 + i * 3.0, y: 3.4, w: 2.7, h: 0.8,
          fontSize: 26, color: ACCENT_CYAN, fontFace: "Arial", bold: true, align: "center",
        });
        slide8.addText(cost[2], {
          x: 0.8 + i * 3.0, y: 4.3, w: 2.7, h: 0.8,
          fontSize: 12, color: "999999", fontFace: "Arial", align: "center",
        });
      });
      addFooter(slide8);

      // === SLIDE 9: TECHNOLOGY ===
      const slide9 = pptx.addSlide();
      slide9.background = { color: BRAND_DARK };
      addLogo(slide9);
      slide9.addText("Built on Leading Technology", {
        x: 0.8, y: 1.2, w: 12, h: 0.8,
        fontSize: 36, color: WHITE, fontFace: "Arial", bold: true,
      });
      const techStack = [
        ["AI Engine", "OpenAI GPT-5.1 with structured JSON output for consistent, high-quality analysis"],
        ["Frontend", "React + TypeScript with Recharts visualisations and Framer Motion animations"],
        ["Backend", "Express 5 + Node.js with Drizzle ORM and Zod schema validation"],
        ["Database", "PostgreSQL with JSONB storage for flexible AI-generated content"],
        ["Security", "Session-based auth, encrypted secrets, environment variable management"],
        ["Deployment", "Cloud-hosted with automatic scaling and TLS encryption"],
      ];
      techStack.forEach((tech, i) => {
        const col = i < 3 ? 0 : 1;
        const row = i % 3;
        const xPos = col === 0 ? 0.8 : 6.8;
        const yPos = 2.5 + row * 1.4;
        slide9.addText(tech[0], {
          x: xPos, y: yPos, w: 5, h: 0.4,
          fontSize: 16, color: ACCENT_CYAN, fontFace: "Arial", bold: true,
        });
        slide9.addText(tech[1], {
          x: xPos, y: yPos + 0.45, w: 5.5, h: 0.7,
          fontSize: 12, color: "BBBBBB", fontFace: "Arial",
        });
      });
      addFooter(slide9);

      // === SLIDE 10: CTA ===
      const slide10 = pptx.addSlide();
      addDarkWash(slide10, ctaImg);
      addLogo(slide10);
      slide10.addText("Transform Your\nStrategic Intelligence", {
        x: 0.8, y: 1.5, w: 10, h: 2.0,
        fontSize: 42, color: WHITE, fontFace: "Arial", bold: true,
        lineSpacingMultiple: 1.2,
      });
      slide10.addText("From weeks of research to minutes of insight.\nOne platform. Every company. Complete intelligence.", {
        x: 0.8, y: 3.5, w: 10, h: 1.0,
        fontSize: 20, color: LIGHT_BLUE, fontFace: "Arial",
        lineSpacingMultiple: 1.3,
      });
      slide10.addShape(pptx.ShapeType.roundRect, {
        x: 0.8, y: 5.0, w: 4, h: 0.7,
        fill: { color: BRAND_BLUE },
        rectRadius: 0.1,
      });
      slide10.addText("Request a Demo  |  www.1giglabs.com", {
        x: 0.8, y: 5.0, w: 4, h: 0.7,
        fontSize: 16, color: WHITE, fontFace: "Arial", bold: true, align: "center",
      });
      slide10.addText("Contact: info@1giglabs.com", {
        x: 0.8, y: 5.9, w: 4, h: 0.5,
        fontSize: 14, color: "AAAAAA", fontFace: "Arial",
      });

      await pptx.writeFile({ fileName: "1GigLabs-Platform-Overview.pptx" });
      toast({ title: "Success", description: "Presentation downloaded successfully." });
    } catch (err) {
      console.error("Presentation generation error:", err);
      toast({ title: "Error", description: "Failed to generate presentation.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const slides = [
    { title: "Title Slide", description: "1GigLabs branding with tagline", image: slideHero },
    { title: "The Challenge", description: "Why businesses need this platform", image: slideAI },
    { title: "Our Solution", description: "Platform capabilities overview", image: slideAnalytics },
    { title: "Deep Research Reports", description: "10 strategic analysis sections", image: undefined },
    { title: "B2B Contact Intelligence", description: "AI-powered contact discovery", image: slideContacts },
    { title: "Export & Deliver", description: "PDF, PowerPoint, HTML, CSV", image: slideExports },
    { title: "Batch Processing", description: "Scale to 50 companies at once", image: slideBatch },
    { title: "Cost Efficiency", description: "Pricing and caching savings", image: slideCost },
    { title: "Technology Stack", description: "GPT-5.1, React, PostgreSQL", image: undefined },
    { title: "Call to Action", description: "Request a demo", image: slideCTA },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-2" /> Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">
              Platform Presentation
            </h1>
          </div>
          <Button
            onClick={generatePresentation}
            disabled={isGenerating}
            data-testid="button-download-presentation"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "Generating..." : "Download Presentation"}
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Presentation className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold" data-testid="text-presentation-info">1GigLabs Platform Overview</h2>
                <p className="text-sm text-slate-500">10-slide investor and customer presentation with branded visuals</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Click "Download Presentation" to generate a professional PowerPoint deck showcasing 
              the platform's capabilities, technology stack, and value proposition. The presentation 
              includes custom visuals and 1GigLabs branding throughout.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slides.map((slide, index) => (
            <Card key={index} className="overflow-hidden" data-testid={`card-slide-${index}`}>
              {slide.image ? (
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs text-blue-300 font-mono">Slide {index + 1}</span>
                    <h3 className="text-white font-semibold text-sm">{slide.title}</h3>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-end p-3" style={{ backgroundColor: `#${BRAND_DARK}` }}>
                  <div>
                    <span className="text-xs text-blue-300 font-mono">Slide {index + 1}</span>
                    <h3 className="text-white font-semibold text-sm">{slide.title}</h3>
                  </div>
                </div>
              )}
              <CardContent className="p-3">
                <p className="text-sm text-slate-500">{slide.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
