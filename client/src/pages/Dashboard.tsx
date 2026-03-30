import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useAnalysis } from "@/hooks/use-analysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/MetricCard";
import { SectionHeader } from "@/components/SectionHeader";
import { RevenueChart, SpendPieChart } from "@/components/Charts";
import { 
  Building2, Users, MapPin, Calendar, 
  PieChart, LineChart as LineChartIcon, Target, 
  ShieldAlert, Globe, Download, Printer, Home, FileText,
  Leaf, Grid3x3, TrendingUp, AlertTriangle, Zap, UserSearch
} from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";
import { useToast } from "@/hooks/use-toast";

import logoUrl from "@/assets/logo.png";

type Tab = "overview" | "financials" | "strategy" | "market" | "tech" | "esg" | "swot" | "growth" | "risk" | "digital";

export default function Dashboard() {
  const { id } = useParams();
  const { data: analysis, isLoading, error } = useAnalysis(Number(id));
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [, navigate] = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToSection = (tabId: Tab) => {
    setActiveTab(tabId);
    const element = document.getElementById(tabId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !analysis) return;
    
    try {
      toast({ title: "Generating PDF...", description: "This may take a moment." });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Get all top-level sections that should be on their own pages
      const sections = reportRef.current.querySelectorAll('.print\\:page-break-before, section');
      
      // If no specific sections found, fall back to capturing the whole ref as before but with multi-page support
      if (sections.length === 0) {
        const canvas = await html2canvas(reportRef.current, { 
          scale: 1.5,
          useCORS: true,
          logging: false
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.75);
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
      } else {
        // Capture each section individually for cleaner page breaks
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i] as HTMLElement;
          // Capture with specific width to ensure it fits A4
          const canvas = await html2canvas(section, { 
            scale: 1.5,
            useCORS: true,
            logging: false,
            width: section.offsetWidth,
            height: section.offsetHeight
          });
          
          const imgData = canvas.toDataURL("image/jpeg", 0.75);
          const margin = 15; // 15mm margin
          const imgWidth = pdfWidth - (margin * 2); 
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          if (i > 0) pdf.addPage();
          
          pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight, undefined, 'FAST');
        }
      }
      
      pdf.save(`${analysis.companyName}-Analysis.pdf`);
      toast({ title: "Success", description: "PDF downloaded successfully." });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportHTML = () => {
    if (!reportRef.current || !analysis) return;
    
    try {
      toast({ title: "Generating HTML...", description: "Preparing download." });
      
      const content = analysis.content as any;
      const primaryColor = content.colorScheme?.primary || "#0047BB";
      
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.companyName} - Strategic Analysis</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
        .header { background: ${primaryColor}; color: white; padding: 60px 40px; text-align: center; margin-bottom: 40px; border-radius: 12px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .section { background: white; padding: 30px; margin-bottom: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .section h2 { color: ${primaryColor}; font-size: 1.5rem; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid ${primaryColor}; }
        .section h3 { color: #1e293b; font-size: 1.2rem; margin: 20px 0 10px; }
        .section p { margin-bottom: 15px; color: #475569; }
        .section ul { margin-left: 20px; margin-bottom: 15px; }
        .section li { margin-bottom: 8px; color: #475569; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-card .value { font-size: 1.5rem; font-weight: bold; color: ${primaryColor}; }
        .metric-card .label { font-size: 0.875rem; color: #64748b; margin-top: 5px; }
        .footer { text-align: center; padding: 40px; color: #64748b; font-size: 0.875rem; }
        .logo { max-height: 40px; margin-bottom: 20px; }
        @media print { body { background: white; } .container { padding: 0; } .section { box-shadow: none; border: 1px solid #e2e8f0; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${content.companyName}</h1>
            <p>Strategic Business Analysis Report</p>
            <p style="font-size: 0.875rem; margin-top: 15px; opacity: 0.8;">Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        </div>

        <div class="section">
            <h2>Executive Summary</h2>
            <p>${content.executiveSummary || 'No executive summary available.'}</p>
        </div>

        <div class="section">
            <h2>Company Overview</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="value">${content.overview?.employees || 'N/A'}</div>
                    <div class="label">Employees</div>
                </div>
                <div class="metric-card">
                    <div class="value">${content.overview?.headquarters || 'N/A'}</div>
                    <div class="label">Headquarters</div>
                </div>
                <div class="metric-card">
                    <div class="value">${content.overview?.founded || 'N/A'}</div>
                    <div class="label">Founded</div>
                </div>
                <div class="metric-card">
                    <div class="value">${content.overview?.industry || 'N/A'}</div>
                    <div class="label">Industry</div>
                </div>
            </div>
            <p>${content.overview?.description || ''}</p>
        </div>

        <div class="section">
            <h2>Financial Performance</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="value">${content.financials?.revenue || 'N/A'}</div>
                    <div class="label">Revenue</div>
                </div>
                <div class="metric-card">
                    <div class="value">${content.financials?.netIncome || 'N/A'}</div>
                    <div class="label">Net Income</div>
                </div>
                <div class="metric-card">
                    <div class="value">${content.financials?.revenueGrowth || 'N/A'}</div>
                    <div class="label">Revenue Growth</div>
                </div>
                <div class="metric-card">
                    <div class="value">${content.financials?.profitMargin || 'N/A'}</div>
                    <div class="label">Profit Margin</div>
                </div>
            </div>
            ${content.financials?.analysis ? `<p>${content.financials.analysis}</p>` : ''}
        </div>

        <div class="section">
            <h2>Strategic Analysis</h2>
            ${content.strategy?.vision ? `<h3>Vision</h3><p>${content.strategy.vision}</p>` : ''}
            ${content.strategy?.initiatives ? `<h3>Strategic Initiatives</h3><ul>${(content.strategy.initiatives as any[]).map((i: any) => `<li><strong>${i.title}:</strong> ${i.description}</li>`).join('')}</ul>` : ''}
            ${content.strategy?.leadership ? `<h3>Leadership</h3><ul>${(content.strategy.leadership as any[]).map((l: any) => `<li><strong>${l.name}</strong> - ${l.role}</li>`).join('')}</ul>` : ''}
        </div>

        <div class="section">
            <h2>Market Landscape</h2>
            ${content.market?.competitors ? `<h3>Key Competitors</h3><ul>${(content.market.competitors as any[]).map((c: any) => `<li><strong>${c.name}:</strong> ${c.description || ''}</li>`).join('')}</ul>` : ''}
            ${content.market?.marketShare ? `<h3>Market Share</h3><p>${content.market.marketShare}</p>` : ''}
            ${content.market?.challenges ? `<h3>Market Challenges</h3><ul>${(content.market.challenges as string[]).map((c: string) => `<li>${c}</li>`).join('')}</ul>` : ''}
        </div>

        <div class="section">
            <h2>Technology & IT Spend</h2>
            ${content.technicalSpend?.totalEstimatedBudget ? `<div class="metrics-grid"><div class="metric-card"><div class="value">${content.technicalSpend.totalEstimatedBudget}</div><div class="label">Total IT Spend</div></div></div>` : ''}
            ${content.technicalSpend?.breakdown ? `<h3>Spend Breakdown</h3><ul>${(content.technicalSpend.breakdown as any[]).map((b: any) => `<li><strong>${b.category}:</strong> ${b.percentage}% - ${b.estimatedAmount}</li>`).join('')}</ul>` : ''}
            ${content.technicalSpend?.categories ? `<h3>Categories</h3><ul>${Object.entries(content.technicalSpend.categories).map(([key, val]) => `<li><strong>${key}:</strong> ${val}</li>`).join('')}</ul>` : ''}
        </div>

        <div class="section">
            <h2>ESG & Sustainability</h2>
            ${content.esgSustainability?.esgRating ? `<div class="metrics-grid"><div class="metric-card"><div class="value">${content.esgSustainability.esgRating}</div><div class="label">ESG Rating</div></div></div>` : ''}
            ${content.esgSustainability?.overview ? `<h3>Overview</h3><p>${content.esgSustainability.overview}</p>` : ''}
            ${content.esgSustainability?.environmentalInitiatives ? `<h3>Environmental Initiatives</h3><ul>${(content.esgSustainability.environmentalInitiatives as string[]).map((i: string) => `<li>${i}</li>`).join('')}</ul>` : ''}
            ${content.esgSustainability?.socialResponsibility ? `<h3>Social Responsibility</h3><ul>${Array.isArray(content.esgSustainability.socialResponsibility) ? (content.esgSustainability.socialResponsibility as string[]).map((s: string) => `<li>${s}</li>`).join('') : `<li>${content.esgSustainability.socialResponsibility}</li>`}</ul>` : ''}
            ${content.esgSustainability?.governancePractices ? `<h3>Governance Practices</h3><ul>${(content.esgSustainability.governancePractices as string[]).map((g: string) => `<li>${g}</li>`).join('')}</ul>` : ''}
            ${content.esgSustainability?.netZeroTarget ? `<h3>Net Zero Target</h3><p>${content.esgSustainability.netZeroTarget}</p>` : ''}
        </div>

        <div class="section">
            <h2>SWOT Analysis</h2>
            ${content.swotAnalysis?.strengths ? `<h3>Strengths</h3><ul>${(content.swotAnalysis.strengths as string[]).map((s: string) => `<li>${s}</li>`).join('')}</ul>` : ''}
            ${content.swotAnalysis?.weaknesses ? `<h3>Weaknesses</h3><ul>${(content.swotAnalysis.weaknesses as string[]).map((w: string) => `<li>${w}</li>`).join('')}</ul>` : ''}
            ${content.swotAnalysis?.opportunities ? `<h3>Opportunities</h3><ul>${(content.swotAnalysis.opportunities as string[]).map((o: string) => `<li>${o}</li>`).join('')}</ul>` : ''}
            ${content.swotAnalysis?.threats ? `<h3>Threats</h3><ul>${(content.swotAnalysis.threats as string[]).map((t: string) => `<li>${t}</li>`).join('')}</ul>` : ''}
        </div>

        <div class="section">
            <h2>Growth Opportunities</h2>
            ${content.growthOpportunities?.summary ? `<p>${content.growthOpportunities.summary}</p>` : ''}
            ${content.growthOpportunities?.opportunities ? `<h3>Key Opportunities</h3><ul>${(content.growthOpportunities.opportunities as any[]).map((o: any) => `<li><strong>${o.title}:</strong> ${o.description}</li>`).join('')}</ul>` : ''}
            ${content.growthOpportunities?.emergingMarkets ? `<h3>Emerging Markets</h3><ul>${(content.growthOpportunities.emergingMarkets as string[]).map((m: string) => `<li>${m}</li>`).join('')}</ul>` : ''}
        </div>

        <div class="section">
            <h2>Risk Assessment</h2>
            ${content.riskAssessment?.overallRiskLevel ? `<div class="metrics-grid"><div class="metric-card"><div class="value">${content.riskAssessment.overallRiskLevel}</div><div class="label">Overall Risk Level</div></div></div>` : ''}
            ${content.riskAssessment?.risks ? `<h3>Key Risks</h3><ul>${(content.riskAssessment.risks as any[]).map((r: any) => `<li><strong>${r.category} (${r.severity}):</strong> ${r.description}</li>`).join('')}</ul>` : ''}
            ${content.riskAssessment?.regulatoryRisks ? `<h3>Regulatory Risks</h3><ul>${(content.riskAssessment.regulatoryRisks as string[]).map((r: string) => `<li>${r}</li>`).join('')}</ul>` : ''}
        </div>

        <div class="section">
            <h2>Digital Transformation</h2>
            ${content.digitalTransformation?.maturityLevel ? `<div class="metrics-grid"><div class="metric-card"><div class="value">${content.digitalTransformation.maturityLevel}</div><div class="label">Digital Maturity</div></div></div>` : ''}
            ${content.digitalTransformation?.aiAdoption ? `<h3>AI Adoption</h3><p>${content.digitalTransformation.aiAdoption}</p>` : ''}
            ${content.digitalTransformation?.currentInitiatives ? `<h3>Current Initiatives</h3><ul>${(content.digitalTransformation.currentInitiatives as any[]).map((i: any) => `<li><strong>${i.title}:</strong> ${i.description} (${i.status})</li>`).join('')}</ul>` : ''}
            ${content.digitalTransformation?.techStack ? `<h3>Technology Stack</h3><ul>${(content.digitalTransformation.techStack as string[]).map((t: string) => `<li>${t}</li>`).join('')}</ul>` : ''}
            ${content.digitalTransformation?.futureRoadmap ? `<h3>Future Roadmap</h3><p>${content.digitalTransformation.futureRoadmap}</p>` : ''}
        </div>

        <div class="footer">
            <p>Report generated by 1GigLabs Strategic Analysis Platform</p>
            <p>© ${new Date().getFullYear()} 1GigLabs. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${content.companyName}-Analysis.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "HTML downloaded successfully." });
    } catch (err) {
      console.error("HTML generation error:", err);
      toast({ title: "Error", description: "Failed to generate HTML.", variant: "destructive" });
    }
  };

  const handleExportPPTX = () => {
    if (!analysis) return;
    const content = analysis.content as any;
    const pptx = new pptxgen();
    
    // Define standard colors from company scheme
    const primaryColor = content.colorScheme?.primary?.replace("#", "") || "0047BB";
    const secondaryColor = content.colorScheme?.secondary?.replace("#", "") || "666666";
    const textColor = "333333";
    const white = "FFFFFF";

    // 1. Title Slide (Slide 1)
    let slide = pptx.addSlide();
    slide.background = { color: primaryColor };

    // Add Logo to PPTX
    slide.addImage({ path: logoUrl, x: 0.5, y: 0.5, w: 3.0, h: 1.2 });

    slide.addText(content.companyName.toUpperCase(), {
      x: 0, y: "35%", w: "100%", h: 1, fontSize: 48, bold: true, color: white, align: "center", fontFace: "Arial"
    });
    slide.addText("STRATEGIC BUSINESS ANALYSIS", {
      x: 0, y: "50%", w: "100%", h: 0.5, fontSize: 24, color: white, align: "center", fontFace: "Arial", italic: true
    });
    slide.addText("PRIVATE & CONFIDENTIAL", {
      x: 0, y: "90%", w: "100%", h: 0.3, fontSize: 10, color: white, align: "center"
    });

    // 2. Executive Summary (Slide 2)
    slide = pptx.addSlide();
    slide.addText("EXECUTIVE SUMMARY", { 
      x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor, fontFace: "Arial" 
    });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    slide.addText(content.executiveSummary, { 
      x: 0.5, y: 1.2, w: "90%", h: 4, fontSize: 14, color: textColor, align: "left", valign: "top", lineSpacing: 24 
    });

    // 3. Company Overview (Slide 3)
    slide = pptx.addSlide();
    slide.addText("COMPANY OVERVIEW", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    
    const overviewData = [
      ["Headquarters", content.overview.headquarters],
      ["Founded", content.overview.founded],
      ["Employees", content.overview.employees],
      ["Locations", content.overview.locations.join(", ")]
    ];
    slide.addTable(overviewData, { 
      x: 0.5, y: 1.5, w: 9, border: { type: "none" }, fill: { color: "F8F9FA" }, fontSize: 14, color: textColor 
    });
    slide.addText(content.overview.description, { x: 0.5, y: 4, w: 9, fontSize: 14, color: textColor });

    // 4. Financial Performance (Slide 4)
    slide = pptx.addSlide();
    slide.addText("FINANCIAL PERFORMANCE", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    
    slide.addText(`Current Revenue: ${content.financials.revenue}`, { x: 0.5, y: 1.3, fontSize: 20, bold: true, color: primaryColor });
    slide.addText(`Growth: ${content.financials.revenueGrowth}`, { x: 0.5, y: 1.8, fontSize: 16, color: secondaryColor });
    slide.addText(`Net Income: ${content.financials.netIncome}`, { x: 0.5, y: 2.3, fontSize: 16, color: textColor });
    
    if (content.financials.chartData) {
      const chartData = [
        {
          name: "Revenue",
          labels: content.financials.chartData.map((d: any) => d.year),
          values: content.financials.chartData.map((d: any) => d.revenue)
        }
      ];
      slide.addChart(pptx.ChartType.bar, chartData, { x: 0.5, y: 3, w: 9, h: 2.5, showLegend: true, barGapWidthPct: 20 });
    }

    // 5. Strategic Vision & Initiatives (Slide 5)
    slide = pptx.addSlide();
    slide.addText("STRATEGIC DIRECTION", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    
    slide.addText("Vision Statement:", { x: 0.5, y: 1.2, fontSize: 14, bold: true, color: secondaryColor });
    slide.addText(`"${content.strategy.vision}"`, { x: 0.5, y: 1.5, w: 9, fontSize: 16, italic: true, color: textColor });
    
    content.strategy.initiatives.slice(0, 4).forEach((item: any, idx: number) => {
      slide.addText(item.title, { x: 0.5, y: 2.5 + (idx * 0.8), w: 3, fontSize: 14, bold: true, color: primaryColor });
      slide.addText(item.description, { x: 3.5, y: 2.5 + (idx * 0.8), w: 6, fontSize: 12, color: textColor });
    });

    // 6. Market Landscape (Slide 6)
    slide = pptx.addSlide();
    slide.addText("MARKET LANDSCAPE", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    
    slide.addText("Key Competitors", { x: 0.5, y: 1.2, fontSize: 18, bold: true, color: secondaryColor });
    content.market.competitors.slice(0, 3).forEach((comp: any, idx: number) => {
      slide.addText(`${comp.name}: ${comp.description}`, { x: 0.5, y: 1.7 + (idx * 0.6), w: 9, fontSize: 12, color: textColor, bullet: true });
    });

    // 7. Market Challenges (Slide 7)
    slide = pptx.addSlide();
    slide.addText("MARKET CHALLENGES", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    content.market.challenges.forEach((challenge: any, idx: number) => {
      slide.addText(challenge, { x: 0.5, y: 1.5 + (idx * 0.5), w: 9, fontSize: 14, color: textColor, bullet: true });
    });

    // 8. Technical Spend Overview (Slide 8)
    slide = pptx.addSlide();
    slide.addText("TECHNICAL SPEND ANALYSIS", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    
    slide.addText(`Total Estimated IT Budget: ${content.technicalSpend.totalEstimatedBudget}`, { 
      x: 0.5, y: 1.2, w: 9, h: 0.8, fontSize: 24, bold: true, color: white, fill: { color: primaryColor }, align: "center", valign: "middle" 
    });

    const spendData = [
      {
        name: "Budget Distribution",
        labels: content.technicalSpend.breakdown.map((b: any) => b.category),
        values: content.technicalSpend.breakdown.map((b: any) => b.percentage)
      }
    ];
    slide.addChart(pptx.ChartType.pie, spendData, { x: 0.5, y: 2.2, w: 4.5, h: 3.5, showLegend: true, legendPos: "b" });
    
    const breakdownTable = content.technicalSpend.breakdown.map((b: any) => [b.category, b.estimatedAmount, `${b.percentage}%`]);
    slide.addTable(breakdownTable, { x: 5.2, y: 2.2, w: 4.3, border: { type: "none" }, fontSize: 10, color: textColor, fill: { color: "F8F9FA" } });

    // 9. Technology Strategy (Slide 9)
    slide = pptx.addSlide();
    slide.addText("TECHNOLOGY STRATEGY", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
    slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
    
    const techCategories = Object.entries(content.technicalSpend.categories).slice(0, 6);
    techCategories.forEach(([key, value], idx) => {
      const xPos = idx % 2 === 0 ? 0.5 : 5.2;
      const yPos = 1.3 + Math.floor(idx / 2) * 1.5;
      slide.addText(key.replace(/([A-Z])/g, ' $1').toUpperCase(), { x: xPos, y: yPos, w: 4, fontSize: 12, bold: true, color: primaryColor });
      slide.addText(value as string, { x: xPos, y: yPos + 0.3, w: 4, h: 1, fontSize: 10, color: textColor, valign: "top" });
    });

    // 10. ESG & Sustainability (Slide 10)
    if (content.esgSustainability) {
      slide = pptx.addSlide();
      slide.addText("ESG & SUSTAINABILITY", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
      slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
      
      if (content.esgSustainability.esgRating) {
        slide.addText(`ESG Rating: ${content.esgSustainability.esgRating}`, { x: 0.5, y: 1.2, fontSize: 20, bold: true, color: primaryColor });
      }
      if (content.esgSustainability.environmentalInitiatives) {
        slide.addText("Environmental Initiatives:", { x: 0.5, y: 1.8, fontSize: 14, bold: true, color: secondaryColor });
        content.esgSustainability.environmentalInitiatives.slice(0, 4).forEach((init: string, idx: number) => {
          slide.addText(init, { x: 0.5, y: 2.2 + (idx * 0.4), w: 9, fontSize: 12, color: textColor, bullet: true });
        });
      }
      if (content.esgSustainability.netZeroTarget) {
        slide.addText(`Net Zero Target: ${content.esgSustainability.netZeroTarget}`, { x: 0.5, y: 4, fontSize: 14, bold: true, color: secondaryColor });
      }
    }

    // 11. SWOT Analysis (Slide 11)
    if (content.swotAnalysis) {
      slide = pptx.addSlide();
      slide.addText("SWOT ANALYSIS", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
      slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
      
      // Strengths
      slide.addText("Strengths", { x: 0.5, y: 1.2, w: 4.2, fontSize: 14, bold: true, color: "228B22", fill: { color: "E8F5E9" }, align: "center" });
      (content.swotAnalysis.strengths || []).slice(0, 3).forEach((s: string, idx: number) => {
        slide.addText(s, { x: 0.5, y: 1.6 + (idx * 0.4), w: 4.2, fontSize: 10, color: textColor, bullet: true });
      });
      
      // Weaknesses
      slide.addText("Weaknesses", { x: 5.3, y: 1.2, w: 4.2, fontSize: 14, bold: true, color: "D32F2F", fill: { color: "FFEBEE" }, align: "center" });
      (content.swotAnalysis.weaknesses || []).slice(0, 3).forEach((w: string, idx: number) => {
        slide.addText(w, { x: 5.3, y: 1.6 + (idx * 0.4), w: 4.2, fontSize: 10, color: textColor, bullet: true });
      });
      
      // Opportunities
      slide.addText("Opportunities", { x: 0.5, y: 3.2, w: 4.2, fontSize: 14, bold: true, color: "1976D2", fill: { color: "E3F2FD" }, align: "center" });
      (content.swotAnalysis.opportunities || []).slice(0, 3).forEach((o: string, idx: number) => {
        slide.addText(o, { x: 0.5, y: 3.6 + (idx * 0.4), w: 4.2, fontSize: 10, color: textColor, bullet: true });
      });
      
      // Threats
      slide.addText("Threats", { x: 5.3, y: 3.2, w: 4.2, fontSize: 14, bold: true, color: "F57C00", fill: { color: "FFF3E0" }, align: "center" });
      (content.swotAnalysis.threats || []).slice(0, 3).forEach((t: string, idx: number) => {
        slide.addText(t, { x: 5.3, y: 3.6 + (idx * 0.4), w: 4.2, fontSize: 10, color: textColor, bullet: true });
      });
    }

    // 12. Growth Opportunities (Slide 12)
    if (content.growthOpportunities) {
      slide = pptx.addSlide();
      slide.addText("GROWTH OPPORTUNITIES", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
      slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
      
      let yPos = 1.3;
      if (content.growthOpportunities.opportunities) {
        slide.addText("Key Opportunities:", { x: 0.5, y: yPos, fontSize: 14, bold: true, color: secondaryColor });
        content.growthOpportunities.opportunities.slice(0, 4).forEach((o: any, idx: number) => {
          slide.addText(`${o.title}: ${o.description.substring(0, 100)}...`, { x: 0.5, y: yPos + 0.4 + (idx * 0.5), w: 9, fontSize: 10, color: textColor, bullet: true });
        });
        yPos += 2.5;
      }
      if (content.growthOpportunities.emergingMarkets) {
        slide.addText("Emerging Markets:", { x: 0.5, y: yPos, fontSize: 14, bold: true, color: secondaryColor });
        content.growthOpportunities.emergingMarkets.slice(0, 3).forEach((m: string, idx: number) => {
          slide.addText(m, { x: 0.5, y: yPos + 0.4 + (idx * 0.35), w: 9, fontSize: 10, color: textColor, bullet: true });
        });
      }
    }

    // 13. Risk Assessment (Slide 13)
    if (content.riskAssessment) {
      slide = pptx.addSlide();
      slide.addText("RISK ASSESSMENT", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
      slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
      
      if (content.riskAssessment.overallRiskLevel) {
        slide.addText(`Overall Risk Level: ${content.riskAssessment.overallRiskLevel}`, { x: 0.5, y: 1.2, fontSize: 18, bold: true, color: "D32F2F" });
      }
      
      let yPos = 1.7;
      if (content.riskAssessment.risks) {
        content.riskAssessment.risks.slice(0, 4).forEach((r: any, idx: number) => {
          slide.addText(`${r.category} (${r.severity}):`, { x: 0.5, y: yPos + (idx * 0.8), fontSize: 11, bold: true, color: "D32F2F" });
          slide.addText(r.description.substring(0, 120) + "...", { x: 0.5, y: yPos + 0.25 + (idx * 0.8), w: 9, fontSize: 9, color: textColor });
        });
      }
    }

    // 14. Digital Transformation (Slide 14)
    if (content.digitalTransformation) {
      slide = pptx.addSlide();
      slide.addText("DIGITAL TRANSFORMATION", { x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: primaryColor });
      slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.9, w: 9, h: 0, line: { color: primaryColor, width: 2 } });
      
      if (content.digitalTransformation.maturityLevel) {
        slide.addText(`Digital Maturity: ${content.digitalTransformation.maturityLevel}`, { x: 0.5, y: 1.2, fontSize: 18, bold: true, color: primaryColor });
      }
      if (content.digitalTransformation.currentInitiatives) {
        slide.addText("Current Initiatives:", { x: 0.5, y: 1.8, fontSize: 14, bold: true, color: secondaryColor });
        content.digitalTransformation.currentInitiatives.slice(0, 4).forEach((init: any, idx: number) => {
          slide.addText(`${init.title}: ${init.status}`, { x: 0.5, y: 2.2 + (idx * 0.4), w: 9, fontSize: 11, color: textColor, bullet: true });
        });
      }
      if (content.digitalTransformation.techStack) {
        slide.addText("Technology Stack:", { x: 0.5, y: 4.2, fontSize: 14, bold: true, color: secondaryColor });
        slide.addText(content.digitalTransformation.techStack.slice(0, 5).join(" • "), { x: 0.5, y: 4.5, w: 9, fontSize: 10, color: textColor });
      }
    }

    // Final Slide - Conclusion
    slide = pptx.addSlide();
    slide.background = { color: primaryColor };
    slide.addText("THANK YOU", { x: 0, y: "45%", w: "100%", h: 1, fontSize: 44, bold: true, color: white, align: "center" });

    pptx.writeFile({ fileName: `${content.companyName}_Strategic_Analysis.pptx` });
    toast({ title: "Success", description: "Professional PowerPoint downloaded successfully." });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Analysis Not Found</h1>
        <p className="text-slate-600 mb-6">We couldn't locate the requested report.</p>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const content = analysis.content as any;

  // Extract domain from website URL for company logo
  const getDomain = (website: string | undefined): string | null => {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  };
  
  const domain = getDomain(content.website);
  // Use Google's favicon service as primary (more reliable), with Clearbit as fallback
  const companyLogoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
  const companyLogoFallbackUrl = domain ? `https://logo.clearbit.com/${domain}` : null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "financials", label: "Financials", icon: LineChartIcon },
    { id: "strategy", label: "Strategy", icon: Target },
    { id: "market", label: "Market", icon: Globe },
    { id: "tech", label: "Tech Spend", icon: PieChart },
    { id: "esg", label: "ESG", icon: Leaf },
    { id: "swot", label: "SWOT", icon: Grid3x3 },
    { id: "growth", label: "Growth", icon: TrendingUp },
    { id: "risk", label: "Risk", icon: AlertTriangle },
    { id: "digital", label: "Digital", icon: Zap },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full hidden lg:flex flex-col no-print z-20">
        <div className="p-6 border-b border-slate-800">
          {/* Company Logo and Name - Prominent Display */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-2 shadow-lg flex-shrink-0 overflow-hidden">
              {companyLogoUrl && !logoError ? (
                <img 
                  src={companyLogoUrl} 
                  alt={content.companyName} 
                  className="w-full h-full object-contain"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="w-8 h-8 text-slate-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold font-serif tracking-tight leading-tight text-white" title={content.companyName}>
                {content.companyName}
              </h1>
              <p className="text-xs text-slate-400">{content.stockSymbol || "Private Company"}</p>
            </div>
          </div>
          
          {Number(id) !== 143 && (
          <div className="flex items-center gap-4 mb-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Home className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Home</span>
            </Link>
            <Link href="/reports" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Reports</span>
            </Link>
          </div>
          )}
          
          {analysis.createdAt && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Report: {new Date(analysis.createdAt).toLocaleDateString('en-GB', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </p>
          )}
          
          {/* 1GigLabs Branding - Small */}
          <a href="https://www.1giglabs.com" target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <img src={logoUrl} alt="1GigLabs" className="h-5 w-auto object-contain opacity-60" />
            <span>Powered by 1GigLabs</span>
          </a>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900">
          <Button variant="outline" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-white mb-2" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button variant="outline" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-white mb-2" onClick={handleExportPPTX}>
            <Download className="w-4 h-4 mr-2" /> Export PPTX
          </Button>
          <Button variant="outline" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" onClick={handleExportHTML}>
            <Download className="w-4 h-4 mr-2" /> Export HTML
          </Button>
        </div>
      </aside>

      {/* Mobile Header (visible only on small screens) */}
      <div className="lg:hidden fixed top-0 w-full bg-slate-900 text-white z-20 no-print">
        <div className="p-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5 shadow flex-shrink-0 overflow-hidden">
              {companyLogoUrl && !logoError ? (
                <img 
                  src={companyLogoUrl} 
                  alt={content.companyName} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div>
              <span className="font-bold font-serif text-white">{content.companyName}</span>
              {analysis.createdAt && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Generated: {new Date(analysis.createdAt).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </p>
              )}
            </div>
          </div>
          {Number(id) !== 143 && (
          <div className="flex items-center gap-3">
            <Link href="/reports">
              <FileText className="w-5 h-5 text-slate-300" />
            </Link>
            <Link href="/">
              <Home className="w-5 h-5 text-slate-300" />
            </Link>
          </div>
          )}
        </div>
        {/* Mobile Tab Navigation */}
        <div className="flex overflow-x-auto gap-1 p-2 bg-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-28 lg:pt-8 overflow-y-auto h-screen bg-slate-50">
        <div ref={reportRef} className="max-w-5xl mx-auto space-y-8 bg-white p-8 lg:p-12 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
          
          {/* Print Header (Visible only when printing) */}
          <div className="hidden print:block mb-8 border-b border-black pb-4">
            <div className="flex items-center gap-4">
              {companyLogoUrl && (
                <img src={companyLogoUrl} alt={content.companyName} className="h-16 w-16 object-contain" />
              )}
              <div>
                <h1 className="text-4xl font-serif font-bold mb-2">{content.companyName}</h1>
                <p className="text-lg text-slate-600">Strategic Analysis Report</p>
              </div>
            </div>
          </div>

          {/* Company Header Banner - Prominent display */}
          <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 no-print">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center p-3 shadow-lg flex-shrink-0 overflow-hidden">
                {companyLogoUrl && !logoError ? (
                  <img 
                    src={companyLogoUrl} 
                    alt={content.companyName} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-500" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold font-serif tracking-tight mb-1 text-white">{content.companyName}</h2>
                <p className="text-slate-300 text-sm">{content.stockSymbol || "Private Company"} • Strategic Analysis Report</p>
                {content.website && (
                  <a href={content.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
                    {content.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-xs text-slate-400">Report Generated</p>
                <p className="text-sm text-white font-medium">
                  {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar (Top right) */}
          <div className="flex justify-end gap-2 mb-4 no-print">
            <Button variant="default" size="sm" disabled title="Feature coming soon..." data-testid="button-find-contacts">
              <UserSearch className="w-4 h-4 mr-2" /> Find Contacts
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPPTX}>
              <Download className="w-4 h-4 mr-2" /> PPTX
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportHTML}>
              <Download className="w-4 h-4 mr-2" /> HTML
            </Button>
          </div>

          {/* Prominent Company Header */}
          <div className="mb-8 pb-6 border-b-2 border-slate-200">
            <h1 className="text-4xl font-bold font-serif text-slate-900 mb-2">{content.companyName}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {content.stockSymbol && (
                <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{content.stockSymbol}</span>
              )}
              {content.website && (
                <a href={content.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {content.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
              {analysis.createdAt && (
                <span className="text-slate-500">
                  Report Date: {new Date(analysis.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          {/* Overview Section */}
          <section id="overview" className={cn(activeTab !== "overview" && "hidden lg:block print:block")}>
            <SectionHeader title="Executive Summary" subtitle={`Overview of ${content.companyName} business operations and key metrics.`} />
            
            <div className="flex flex-col gap-4 mb-8">
              <MetricCard title="Employees" value={content.overview.employees} icon={<Users className="w-5 h-5" />} />
              <MetricCard title="Headquarters" value={content.overview.headquarters.split(",")[0]} icon={<MapPin className="w-5 h-5" />} />
              <MetricCard title="Founded" value={content.overview.founded} icon={<Calendar className="w-5 h-5" />} />
              <MetricCard title="Revenue" value={content.financials.revenue} subValue={content.financials.revenueGrowth} trend="up" icon={<LineChartIcon className="w-5 h-5" />} />
            </div>

            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed mb-8">
              <p className="text-lg font-medium text-slate-800 mb-4">Company Description</p>
              <p>{content.overview.description}</p>
              
              <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-serif font-bold text-slate-900 mb-4">Strategic Vision</h3>
                <p className="italic text-slate-700 mb-6">"{content.strategy.vision}"</p>
                
                <div className="flex flex-wrap gap-x-8 gap-y-2 pt-4 border-t border-slate-200">
                  <div className="text-[10px] text-slate-400 font-mono">
                    NAICS: {content.overview.naics || "N/A"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    SIC: {content.overview.sic || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Financials Section */}
          <section id="financials" className={cn(activeTab !== "financials" && "hidden lg:block print:block")}>
             <SectionHeader title="Financial Performance" subtitle="Revenue and Net Income trends over recent fiscal periods." className="mt-8 lg:mt-0" />
             
             <Card className="mb-8 border-slate-200 shadow-sm">
               <CardContent className="pt-6">
                 {content.financials.chartData ? (
                   <RevenueChart data={content.financials.chartData} />
                 ) : (
                   <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-lg">
                     Insufficient data for visualization
                   </div>
                 )}
               </CardContent>
             </Card>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Net Income</h4>
                  <p className="text-3xl font-bold font-serif text-slate-900">{content.financials.netIncome}</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 md:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Performance Notes</h4>
                  <p className="text-slate-700">{content.financials.recentPerformance}</p>
               </div>
             </div>
          </section>

          {/* Strategy Section */}
          <section id="strategy" className={cn(activeTab !== "strategy" && "hidden lg:block print:block")}>
            <SectionHeader title="Strategic Initiatives" subtitle="Key forward-looking business priorities." className="mt-8 lg:mt-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.strategy.initiatives.map((item: any, idx: number) => (
                <Card key={idx} className="border-slate-200 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {content.strategy.leadership && content.strategy.leadership.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-bold mb-6 font-serif">Leadership Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {content.strategy.leadership.map((leader: any, idx: number) => (
                    <Card key={idx} className="border-slate-200">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                          <Users className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-900">{leader.name}</h4>
                        <p className="text-sm font-medium text-blue-600 mb-2">{leader.role}</p>
                        {leader.bio && <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{leader.bio}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Market Section */}
          <section id="market" className={cn(activeTab !== "market" && "hidden lg:block print:block")}>
            <SectionHeader title="Market Landscape" subtitle="Competitive analysis and market challenges." className="mt-8 lg:mt-0" />

            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 font-serif">Key Competitors</h3>
              <div className="grid grid-cols-1 gap-4">
                {content.market.competitors.map((comp: any, idx: number) => (
                   <div key={idx} className="flex items-start p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                     <div className="mr-4 mt-1 bg-slate-100 p-2 rounded-full">
                       <Building2 className="w-4 h-4 text-slate-500" />
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-900">{comp.name}</h4>
                       <p className="text-sm text-slate-600 mt-1">{comp.description}</p>
                     </div>
                   </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4 font-serif">Market Challenges</h3>
              <ul className="space-y-3">
                {content.market.challenges.map((challenge: any, idx: number) => (
                  <li key={idx} className="flex items-start text-slate-700">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2.5 mr-3 flex-shrink-0" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Tech Spend Section */}
          <section id="tech" className={cn(activeTab !== "tech" && "hidden lg:block print:block")}>
            <SectionHeader title="Technical Spend Estimates" subtitle="Estimated budget allocation across IT categories." className="mt-8 lg:mt-0" />

            <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg mb-8">
              <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Total Estimated IT Budget</p>
              <p className="text-4xl font-serif font-bold">{content.technicalSpend.totalEstimatedBudget}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.technicalSpend.breakdown.map((item: any, idx: number) => {
                // Map any category name variation to the canonical key used in categories object
                const keyMapping: Record<string, string> = {
                  // Title case (legacy)
                  "Network": "network",
                  "Hardware": "hardware",
                  "Software": "software",
                  "Cloud": "cloud",
                  "Data Centre": "dataCenter",
                  "AI & Automation": "aiAndAutomation",
                  "Services": "outsourcedServices",
                  // Camel case (from API)
                  "network": "network",
                  "hardware": "hardware",
                  "software": "software",
                  "cloud": "cloud",
                  "dataCenter": "dataCenter",
                  "dataCentre": "dataCenter",
                  "aiAndAutomation": "aiAndAutomation",
                  "outsourcedServices": "outsourcedServices",
                  "oursourcedServices": "outsourcedServices"
                };
                
                // Find the canonical key for the category
                const normalizedKey = keyMapping[item.category] || item.category;

                // Get the category description using the normalized key
                const detailedDescription = content.technicalSpend.categories?.[normalizedKey] || 
                  "Strategic context for this category is currently being synthesized based on industry benchmarks.";
                
                const displayTitles: Record<string, string> = {
                  network: "Network",
                  hardware: "Hardware",
                  software: "Software",
                  cloud: "Cloud",
                  dataCenter: "Data Centre",
                  dataCentre: "Data Centre",
                  aiAndAutomation: "AI & Automation",
                  outsourcedServices: "Services",
                  oursourcedServices: "Services"
                };
                const displayTitle = displayTitles[normalizedKey] || "Category";

                return (
                  <div key={idx} className="p-6 border border-slate-100 rounded-lg bg-white flex flex-row gap-6">
                    <div className="w-32 flex-shrink-0 flex flex-col justify-start">
                      <h5 className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest whitespace-nowrap">
                        {displayTitle}
                      </h5>
                      <div className="text-base font-medium text-slate-900">
                        {item.estimatedAmount}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600 leading-relaxed text-justify">
                        {detailedDescription}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ESG & Sustainability Section */}
          {content.esgSustainability && (
            <section id="esg" className={cn(activeTab !== "esg" && "hidden lg:block print:block")}>
              <SectionHeader title="ESG & Sustainability" subtitle="Environmental, Social, and Governance initiatives." className="mt-8 lg:mt-0" />
              
              <div className="p-6 bg-green-50 rounded-xl border border-green-100 mb-6">
                <p className="text-green-900">{content.esgSustainability.overview}</p>
                {content.esgSustainability.esgRating && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                    <span className="text-sm font-medium text-green-800">Rating: {content.esgSustainability.esgRating}</span>
                  </div>
                )}
                {content.esgSustainability.netZeroTarget && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full ml-2">
                    <span className="text-sm font-medium text-green-800">Net Zero Target: {content.esgSustainability.netZeroTarget}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-green-200">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                      <Leaf className="w-5 h-5" /> Environmental
                    </h4>
                    <ul className="space-y-2">
                      {content.esgSustainability.environmentalInitiatives?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" /> Social
                    </h4>
                    <ul className="space-y-2">
                      {content.esgSustainability.socialResponsibility?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5" /> Governance
                    </h4>
                    <ul className="space-y-2">
                      {content.esgSustainability.governancePractices?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* SWOT Analysis Section */}
          {content.swotAnalysis && (
            <section id="swot" className={cn(activeTab !== "swot" && "hidden lg:block print:block")}>
              <SectionHeader title="SWOT Analysis" subtitle="Strategic strengths, weaknesses, opportunities, and threats." className="mt-8 lg:mt-0" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-green-800 mb-4 uppercase tracking-wider text-sm">Strengths</h4>
                    <ul className="space-y-2">
                      {content.swotAnalysis.strengths?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-green-600 font-bold">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200 bg-red-50/50">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-red-800 mb-4 uppercase tracking-wider text-sm">Weaknesses</h4>
                    <ul className="space-y-2">
                      {content.swotAnalysis.weaknesses?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-red-600 font-bold">-</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-blue-800 mb-4 uppercase tracking-wider text-sm">Opportunities</h4>
                    <ul className="space-y-2">
                      {content.swotAnalysis.opportunities?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-orange-800 mb-4 uppercase tracking-wider text-sm">Threats</h4>
                    <ul className="space-y-2">
                      {content.swotAnalysis.threats?.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* Growth Opportunities Section */}
          {content.growthOpportunities && (
            <section id="growth" className={cn(activeTab !== "growth" && "hidden lg:block print:block")}>
              <SectionHeader title="Growth Opportunities" subtitle="Strategic expansion and revenue growth potential." className="mt-8 lg:mt-0" />
              
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <p className="text-blue-900">{content.growthOpportunities.summary}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {content.growthOpportunities.opportunities?.map((opp: any, idx: number) => (
                  <Card key={idx} className="border-slate-200 hover:border-blue-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{opp.title}</h4>
                      <p className="text-slate-600 text-sm mb-3">{opp.description}</p>
                      <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full inline-block">
                        Impact: {opp.potentialImpact}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {content.growthOpportunities.emergingMarkets && content.growthOpportunities.emergingMarkets.length > 0 && (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4">Emerging Markets</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.growthOpportunities.emergingMarkets.map((market: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700">
                        {market}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Risk Assessment Section */}
          {content.riskAssessment && (
            <section id="risk" className={cn(activeTab !== "risk" && "hidden lg:block print:block")}>
              <SectionHeader title="Risk Assessment" subtitle="Enterprise risk evaluation and mitigation strategies." className="mt-8 lg:mt-0" />
              
              <div className={cn(
                "p-6 rounded-xl border mb-6",
                content.riskAssessment.overallRiskLevel === "Low" && "bg-green-50 border-green-200",
                content.riskAssessment.overallRiskLevel === "Medium" && "bg-yellow-50 border-yellow-200",
                content.riskAssessment.overallRiskLevel === "High" && "bg-red-50 border-red-200"
              )}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={cn(
                    "w-8 h-8",
                    content.riskAssessment.overallRiskLevel === "Low" && "text-green-600",
                    content.riskAssessment.overallRiskLevel === "Medium" && "text-yellow-600",
                    content.riskAssessment.overallRiskLevel === "High" && "text-red-600"
                  )} />
                  <div>
                    <p className="text-sm text-slate-600">Overall Risk Level</p>
                    <p className="text-2xl font-bold">{content.riskAssessment.overallRiskLevel}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {content.riskAssessment.risks?.map((risk: any, idx: number) => (
                  <Card key={idx} className="border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{risk.category}</span>
                          <p className="text-slate-800 mt-1">{risk.description}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          risk.severity === "Low" && "bg-green-100 text-green-800",
                          risk.severity === "Medium" && "bg-yellow-100 text-yellow-800",
                          risk.severity === "High" && "bg-red-100 text-red-800"
                        )}>
                          {risk.severity}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium text-slate-700">Mitigation:</span> {risk.mitigation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {content.riskAssessment.regulatoryRisks && content.riskAssessment.regulatoryRisks.length > 0 && (
                <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4">Regulatory Risks</h4>
                  <ul className="space-y-2">
                    {content.riskAssessment.regulatoryRisks.map((risk: string, idx: number) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Digital Transformation Section */}
          {content.digitalTransformation && (
            <section id="digital" className={cn(activeTab !== "digital" && "hidden lg:block print:block")}>
              <SectionHeader title="Digital Transformation" subtitle="Technology modernization and digital maturity." className="mt-8 lg:mt-0" />
              
              <div className="p-6 bg-purple-50 rounded-xl border border-purple-100 mb-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600">Digital Maturity Level</p>
                    <p className="text-2xl font-bold text-purple-900">{content.digitalTransformation.maturityLevel}</p>
                  </div>
                </div>
                {content.digitalTransformation.aiAdoption && (
                  <p className="mt-4 text-sm text-purple-800">
                    <span className="font-medium">AI Adoption:</span> {content.digitalTransformation.aiAdoption}
                  </p>
                )}
              </div>

              <h4 className="font-bold text-slate-800 mb-4">Current Initiatives</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {content.digitalTransformation.currentInitiatives?.map((initiative: any, idx: number) => (
                  <Card key={idx} className="border-slate-200">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-bold text-slate-900">{initiative.title}</h5>
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full",
                          initiative.status === "Completed" && "bg-green-100 text-green-800",
                          initiative.status === "In Progress" && "bg-blue-100 text-blue-800",
                          initiative.status === "Planned" && "bg-slate-100 text-slate-800"
                        )}>
                          {initiative.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{initiative.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {content.digitalTransformation.techStack && content.digitalTransformation.techStack.length > 0 && (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                  <h4 className="font-bold text-slate-800 mb-4">Technology Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.digitalTransformation.techStack.map((tech: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {content.digitalTransformation.futureRoadmap && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-2">Future Roadmap</h4>
                  <p className="text-blue-900">{content.digitalTransformation.futureRoadmap}</p>
                </div>
              )}
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
