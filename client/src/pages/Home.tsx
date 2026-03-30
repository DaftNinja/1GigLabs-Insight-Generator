import { useState, useRef } from "react";
import { useCreateAnalysis, useAnalyses } from "@/hooks/use-analysis";
import { LoadingAnalysis } from "@/components/LoadingAnalysis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, ShieldCheck, ArrowRight, Building2, Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

import logoUrl from "@/assets/logo.png";

interface BatchResult {
  companyName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  analysisId?: number;
  error?: string;
}

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const { mutate: createAnalysis, isPending } = useCreateAnalysis();
  const { data: recentAnalyses } = useAnalyses();
  
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim()) {
      createAnalysis({ companyName });
    }
  };

  const parseCSV = (text: string): string[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const companies: string[] = [];
    
    for (const line of lines) {
      let current = '';
      let inQuotes = false;
      const values: string[] = [];
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      for (const value of values) {
        const cleaned = value.replace(/^["']|["']$/g, '').trim();
        if (cleaned && cleaned.toLowerCase() !== 'company' && cleaned.toLowerCase() !== 'company name' && cleaned.toLowerCase() !== 'name') {
          companies.push(cleaned);
        }
      }
    }
    
    return Array.from(new Set(companies)).slice(0, 50);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const companies = parseCSV(text);
    
    if (companies.length === 0) {
      alert('No valid company names found in the CSV file.');
      return;
    }

    if (companies.length < 1) {
      alert('Please provide at least one company name.');
      return;
    }

    if (companies.length > 50) {
      alert('Maximum 50 companies allowed per batch. Only the first 50 will be processed.');
    }
    
    if (companies.length < 20) {
      const proceed = confirm(`You have ${companies.length} companies. For optimal batch processing, 20-50 companies are recommended. Continue anyway?`);
      if (!proceed) return;
    }

    setBatchProcessing(true);
    setBatchProgress(0);
    setBatchResults(companies.map(name => ({ companyName: name, status: 'pending' })));

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      setBatchResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'processing' } : r
      ));

      try {
        const response = await apiRequest('POST', '/api/analyze', { companyName: company });
        const data = await response.json();
        
        setBatchResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'success', analysisId: data.id } : r
        ));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate';
        setBatchResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'error', error: errorMessage } : r
        ));
      }

      setBatchProgress(((i + 1) / companies.length) * 100);
    }

    setBatchProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isPending) {
    return <LoadingAnalysis />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <a href="https://www.1giglabs.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white p-2 rounded-lg hover:opacity-90 transition-opacity">
            <img src={logoUrl} alt="1GigLabs" className="h-10 w-auto object-contain" />
          </a>
          <div className="flex items-center gap-2">
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
            <Link href="/mission">
              <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-primary" data-testid="button-mission">
                Our Mission
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-slate-900 tracking-tight mb-6"
          >
            Strategic Intelligence, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Generated Instantly.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 mb-10 leading-relaxed"
          >
            Generate comprehensive business analyses, technical spend breakdowns, 
            and competitive landscapes for any company in seconds. 
            Used by executives and investors worldwide.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-200"></div>
              <div className="relative flex shadow-xl bg-white rounded-xl p-2 border border-slate-100">
                <div className="flex-1 flex items-center pl-4">
                  <Search className="text-slate-400 w-5 h-5 mr-3" />
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name or URL (e.g. Acme Corp)" 
                    className="border-none shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                  />
                </div>
                <Button 
                  size="lg" 
                  type="submit"
                  disabled={!companyName.trim()}
                  className="rounded-lg h-12 px-8 font-semibold shadow-lg shadow-blue-500/20"
                >
                  Generate Report
                </Button>
              </div>
            </form>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" /> Verified Data Sources
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>10M+ Companies Tracked</span>
            </div>
          </motion.div>

          {/* Batch Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 max-w-xl mx-auto"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gradient-to-b from-slate-50 to-white px-4 text-slate-400">Or batch process</span>
              </div>
            </div>

            <Card className="mt-6 border-dashed border-2 border-slate-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  data-testid="input-csv-upload"
                  disabled={batchProcessing}
                />
                <label 
                  htmlFor="csv-upload" 
                  className={`cursor-pointer flex flex-col items-center gap-3 ${batchProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Upload CSV for Batch Processing</p>
                    <p className="text-sm text-slate-500 mt-1">Process 20-50 companies at once</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={batchProcessing} className="mt-2 pointer-events-none" data-testid="button-select-csv">
                    <Upload className="w-4 h-4 mr-2" />
                    {batchProcessing ? 'Processing...' : 'Select CSV File'}
                  </Button>
                </label>
                <p className="text-xs text-slate-400 mt-4">
                  CSV format: One company name per line or comma-separated
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Batch Processing Results */}
          {batchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Batch Processing</h3>
                    <span className="text-sm text-slate-500">
                      {batchResults.filter(r => r.status === 'success').length} / {batchResults.length} completed
                    </span>
                  </div>
                  
                  {batchProcessing && (
                    <div className="mb-4">
                      <Progress value={batchProgress} className="h-2" />
                      <p className="text-xs text-slate-500 mt-1 text-center">{Math.round(batchProgress)}% complete</p>
                    </div>
                  )}

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {batchResults.map((result, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {result.status === 'pending' && (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                          )}
                          {result.status === 'processing' && (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          )}
                          {result.status === 'success' && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                          {result.status === 'error' && (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className="text-sm font-medium text-slate-700">{result.companyName}</span>
                        </div>
                        {result.status === 'success' && result.analysisId && (
                          <Link href={`/analyze/${result.analysisId}`}>
                            <Button variant="ghost" size="sm" className="text-xs" data-testid={`button-view-report-${result.analysisId}`}>
                              View Report <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}
                        {result.status === 'error' && (
                          <span className="text-xs text-red-500">{result.error}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {!batchProcessing && batchResults.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 w-full"
                      onClick={() => setBatchResults([])}
                      data-testid="button-clear-results"
                    >
                      Clear Results
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Recent Analyses Grid */}
        {recentAnalyses && recentAnalyses.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-24 border-t border-slate-200 pt-16"
          >
            <h2 className="text-center font-serif text-2xl font-bold mb-8">Recent Analyses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentAnalyses.slice(0, 3).map((analysis) => (
                <Link key={analysis.id} href={`/analyze/${analysis.id}`} className="group block">
                  <Card className="h-full hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full">
                          {new Date(analysis.createdAt || "").toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">
                        {analysis.companyName}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {(analysis.content as { overview?: { description?: string } })?.overview?.description}
                      </p>
                      <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                        View Report <ArrowRight className="ml-1 w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
