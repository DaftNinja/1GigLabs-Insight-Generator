import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, Download, RefreshCw, Linkedin, 
  Mail, Building2, User, Loader2, UserPlus, ExternalLink, Trash2, CheckCircle2, Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contact, Contacts as ContactsType } from "@shared/schema";

export default function ContactsPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const { data: contacts, isLoading, error, refetch } = useQuery<ContactsType>({
    queryKey: ['/api/analyses', id, 'contacts'],
    queryFn: async () => {
      const res = await fetch(`/api/analyses/${id}/contacts`);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    retry: false
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/analyses/${id}/contacts`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses', id, 'contacts'] });
      toast({ title: "Success", description: "Contacts generated successfully." });
      setIsGenerating(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate contacts.", variant: "destructive" });
      setIsGenerating(false);
    }
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/analyses/${id}/contacts/refresh`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses', id, 'contacts'] });
      toast({ title: "Success", description: "Contacts refreshed successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to refresh contacts.", variant: "destructive" });
    }
  });

  const findMoreMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/analyses/${id}/contacts/more`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses', id, 'contacts'] });
      toast({ title: "Success", description: "20 additional contacts added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to find more contacts.", variant: "destructive" });
    }
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleFindMore = () => {
    findMoreMutation.mutate();
  };

  const verifyMutation = useMutation({
    mutationFn: async ({ contactIndex, verified }: { contactIndex: number; verified: boolean }) => {
      const res = await apiRequest('PATCH', `/api/analyses/${id}/contacts/${contactIndex}`, { verified });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses', id, 'contacts'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update contact.", variant: "destructive" });
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (contactIndex: number) => {
      const res = await apiRequest('DELETE', `/api/analyses/${id}/contacts/${contactIndex}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses', id, 'contacts'] });
      toast({ title: "Success", description: "Contact removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove contact.", variant: "destructive" });
    }
  });

  const handleVerify = (contactIndex: number, verified: boolean) => {
    verifyMutation.mutate({ contactIndex, verified });
  };

  const handleRemove = (contactIndex: number) => {
    removeMutation.mutate(contactIndex);
  };

  const uploadMutation = useMutation({
    mutationFn: async (uploadedContacts: any[]) => {
      const res = await apiRequest('POST', `/api/analyses/${id}/contacts/upload`, { uploadedContacts });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/analyses', id, 'contacts'] });
      toast({ title: "Success", description: `${variables.length} contact(s) uploaded successfully.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload contacts.", variant: "destructive" });
    }
  });

  const parseUploadCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      toast({ title: "Error", description: "CSV must have a header row and at least one contact.", variant: "destructive" });
      return;
    }

    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

    const nameIdx = headers.findIndex(h => h === 'name');
    if (nameIdx === -1) {
      toast({ title: "Error", description: "CSV must have a 'Name' column.", variant: "destructive" });
      return;
    }

    const titleIdx = headers.findIndex(h => h === 'title');
    const deptIdx = headers.findIndex(h => h === 'department');
    const emailIdx = headers.findIndex(h => h === 'email');
    const linkedinIdx = headers.findIndex(h => h === 'linkedin');
    const relevanceIdx = headers.findIndex(h => h === 'relevance');

    const parsedContacts = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/("([^"]*)"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
      const name = values[nameIdx];
      if (!name) continue;
      parsedContacts.push({
        name,
        title: titleIdx >= 0 ? values[titleIdx] || '' : '',
        department: deptIdx >= 0 ? values[deptIdx] || '' : '',
        email: emailIdx >= 0 ? values[emailIdx] || '' : '',
        linkedin: linkedinIdx >= 0 ? values[linkedinIdx] || '' : '',
        relevance: relevanceIdx >= 0 ? values[relevanceIdx] || '' : '',
      });
    }

    if (parsedContacts.length === 0) {
      toast({ title: "Error", description: "No valid contacts found in CSV.", variant: "destructive" });
      return;
    }

    uploadMutation.mutate(parsedContacts);
  };

  const handleUploadCSV = () => {
    uploadInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) parseUploadCSV(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadCSV = () => {
    if (!contacts || !contacts.contacts) return;

    // Only export non-deleted contacts
    const allContactsList = contacts.contacts as Contact[];
    const activeContacts = allContactsList.filter(c => !c.deleted);
    const headers = ['Verified', 'Name', 'Title', 'Department', 'Email', 'LinkedIn', 'Source', 'Relevance'];
    const rows = activeContacts.map(c => [
      c.verified ? 'Yes' : 'No',
      c.name,
      c.title,
      c.department || '',
      c.email || '',
      c.linkedin || '',
      c.source,
      c.relevance
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contacts.companyName}-Contacts.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Success", description: "CSV downloaded successfully." });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter out deleted contacts from display, but track original indices
  const allContacts = contacts?.contacts as Contact[] || [];
  const contactList = allContacts
    .map((c, originalIndex) => ({ ...c, originalIndex }))
    .filter(c => !c.deleted);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/analyze/${id}`}>
              <Button variant="ghost" size="sm" data-testid="button-back-to-report">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Report
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              {contacts?.companyName || 'Company'} - Contacts
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="file"
              ref={uploadInputRef}
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-upload-csv"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUploadCSV}
              disabled={uploadMutation.isPending}
              data-testid="button-upload-csv"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload CSV
            </Button>
            {contactList.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFindMore}
                  disabled={findMoreMutation.isPending}
                  data-testid="button-find-more-contacts"
                >
                  {findMoreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Find 20 More
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={refreshMutation.isPending}
                  data-testid="button-refresh-contacts"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleDownloadCSV}
                  data-testid="button-download-csv"
                >
                  <Download className="w-4 h-4 mr-2" /> Download CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {!contacts || contactList.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">No Contacts Found</h2>
              <p className="text-slate-500 mb-6">
                Generate relevant business contacts for this company using AI-powered research.
              </p>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || generateMutation.isPending}
                data-testid="button-generate-contacts"
              >
                {isGenerating || generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Contacts...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Generate Contacts
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {contactList.length} Contacts Found
              </CardTitle>
              <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
                <span className="font-medium">Important:</span> 
                AI-generated contacts may not reflect recent changes. Click "Search" to verify current employment before outreach.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </div>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>Search</TableHead>
                    <TableHead>Relevance</TableHead>
                    <TableHead className="w-16">
                      <div className="flex items-center gap-1">
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactList.map((contact, index) => (
                    <TableRow key={contact.originalIndex} data-testid={`row-contact-${index}`} className={contact.verified ? "bg-green-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={contact.verified || false}
                          onCheckedChange={(checked) => handleVerify(contact.originalIndex, checked as boolean)}
                          data-testid={`checkbox-verified-${index}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.department || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a 
                            href={`mailto:${contact.email}`} 
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                            data-testid={`link-email-${index}`}
                          >
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.linkedin ? (
                          <a 
                            href={contact.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                            data-testid={`link-linkedin-${index}`}
                          >
                            <Linkedin className="w-3 h-3" />
                            Search LinkedIn
                          </a>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(`${contact.name} ${contact.title} ${contacts?.companyName || ''}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1"
                          data-testid={`link-verify-${index}`}
                        >
                          <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 text-blue-600 border-blue-300">
                            Search
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Badge>
                        </a>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-slate-600 line-clamp-2">{contact.relevance}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(contact.originalIndex)}
                          disabled={removeMutation.isPending}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-remove-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
