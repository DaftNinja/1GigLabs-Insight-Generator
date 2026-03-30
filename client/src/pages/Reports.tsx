import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowRight, ArrowLeft, FileText, ArrowUpDown, Trash2, RefreshCw, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import logoUrl from "@/assets/logo.png";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Analysis = {
  id: number;
  companyName: string;
  content: {
    overview?: {
      description?: string;
      industry?: string;
    };
  };
  createdAt: string | null;
};

type SortOption = "alphabetical" | "industry" | "date-newest" | "date-oldest";

export default function Reports() {
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { data: analyses, isLoading } = useQuery<Analysis[]>({
    queryKey: ["/api/analyses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/analyses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      toast({
        title: "Report Deleted",
        description: "The report has been permanently removed.",
      });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Could not delete the report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (id: number) => {
      setRefreshingId(id);
      const response = await apiRequest("POST", `/api/analyses/${id}/refresh`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      toast({
        title: "Report Refreshed",
        description: "The report has been regenerated with the latest AI analysis.",
      });
      setRefreshingId(null);
    },
    onError: () => {
      toast({
        title: "Refresh Failed",
        description: "Could not regenerate the report. Please try again.",
        variant: "destructive",
      });
      setRefreshingId(null);
    },
  });

  const sortedAnalyses = useMemo(() => {
    if (!analyses) return [];
    
    const sorted = [...analyses];
    
    switch (sortBy) {
      case "alphabetical":
        return sorted.sort((a, b) => a.companyName.localeCompare(b.companyName));
      case "industry":
        return sorted.sort((a, b) => {
          const industryA = a.content?.overview?.industry || "Unknown";
          const industryB = b.content?.overview?.industry || "Unknown";
          const industryCompare = industryA.localeCompare(industryB);
          if (industryCompare !== 0) return industryCompare;
          return a.companyName.localeCompare(b.companyName);
        });
      case "date-newest":
        return sorted.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      case "date-oldest":
        return sorted.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      default:
        return sorted;
    }
  }, [analyses, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
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
            <a href="/case-studies/" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-primary" data-testid="button-deep-research">
                Deep Research Reports
              </Button>
            </a>
            <Link href="/mission">
              <Button variant="ghost" className="text-sm font-medium text-slate-600 hover:text-primary" data-testid="button-mission">
                Our Mission
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900">
              Generated Reports
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Browse all AI-generated strategic analysis reports.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : sortedAnalyses && sortedAnalyses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <p className="text-sm text-slate-500">
                {sortedAnalyses.length} report{sortedAnalyses.length !== 1 ? 's' : ''} available
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">Sort by:</span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical" data-testid="sort-alphabetical">Alphabetical (A-Z)</SelectItem>
                    <SelectItem value="industry" data-testid="sort-industry">Industry</SelectItem>
                    <SelectItem value="date-newest" data-testid="sort-date-newest">Date (Newest First)</SelectItem>
                    <SelectItem value="date-oldest" data-testid="sort-date-oldest">Date (Oldest First)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAnalyses.map((analysis, index) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <Link href={`/analyze/${analysis.id}`} className="block">
                    <Card className="h-full hover:shadow-xl hover:border-blue-200 transition-all duration-300 group-hover:-translate-y-1" data-testid={`card-report-${analysis.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-full">
                              {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`button-menu-${analysis.id}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    refreshMutation.mutate(analysis.id);
                                  }}
                                  disabled={refreshingId === analysis.id}
                                  data-testid={`button-refresh-${analysis.id}`}
                                >
                                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshingId === analysis.id ? 'animate-spin' : ''}`} />
                                  {refreshingId === analysis.id ? 'Refreshing...' : 'Force Refresh'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setDeleteId(analysis.id);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                  data-testid={`button-delete-${analysis.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">
                          {analysis.companyName}
                        </h3>
                        {sortBy === "industry" && analysis.content?.overview?.industry && (
                          <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-2">
                            {analysis.content.overview.industry}
                          </span>
                        )}
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {analysis.content?.overview?.description || 'Strategic analysis report'}
                        </p>
                        <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                          View Report <ArrowRight className="ml-1 w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  {refreshingId === analysis.id && (
                    <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-sm text-slate-600">Regenerating report...</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Reports Yet</h3>
            <p className="text-slate-500 mb-6">Generate your first strategic analysis to see it here.</p>
            <Link href="/">
              <Button data-testid="button-generate-first">
                Generate Your First Report
              </Button>
            </Link>
          </div>
        )}
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
