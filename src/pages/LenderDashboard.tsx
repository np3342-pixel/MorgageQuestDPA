import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, HelpCircle, ChevronDown, UserCircle, LogOut, Users, FileText, Sparkles, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { db, logOut } from "../firebase";
import { collection, query, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";
import ProgramCard from "../components/ProgramCard";
import { DPA_KNOWLEDGE_BASE } from "../lib/knowledgeBase";

export default function LenderDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [sortBy, setSortBy] = useState("date-desc");
  const [viewMode, setViewMode] = useState<"available" | "pipeline">("available");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    
    if (!userId || userRole !== "lender") {
      navigate("/");
      return;
    }

    const q = query(collection(db, "leads"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
    }, (error) => {
      console.error("Error fetching leads:", error);
    });

    return () => unsubscribe();
  }, [navigate]);

  const filteredAndSortedLeads = leads
    .filter((lead) => {
      if (viewMode === "available") {
        return !lead.claimedBy;
      } else {
        return lead.claimedBy === currentUserId;
      }
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "income-desc") return b.income - a.income;
      if (sortBy === "income-asc") return a.income - b.income;
      return 0;
    });

  const handleLogout = async () => {
    await logOut();
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const handleClaimLead = async (leadId: string) => {
    if (!currentUserId) return;
    try {
      await updateDoc(doc(db, "leads", leadId), {
        claimedBy: currentUserId,
        status: "Contacted"
      });
      setSelectedLead(null);
    } catch (error) {
      console.error("Error claiming lead:", error);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "leads", leadId), {
        status: newStatus
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const eligibleLeadsCount = leads.filter(lead => lead.eligibility?.some((p: any) => p.status === "PASS" || p.status === "VERIFY")).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl text-slate-800">Lender Portal</div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-slate-600">
            <Link to="/profile" className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" /> Profile
            </Link>
          </Button>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Log Out
          </Button>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{leads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Potentially Eligible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{eligibleLeadsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Needs Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {leads.filter(l => l.eligibility.some((p: any) => p.status === "VERIFY")).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-[calc(100vh-280px)] flex flex-col">
            <CardHeader className="shrink-0 space-y-4">
              <CardTitle>Lead Inbox</CardTitle>
              <div className="flex gap-2 mb-2">
                <Button 
                  variant={viewMode === "available" ? "default" : "outline"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setViewMode("available")}
                >
                  Available
                </Button>
                <Button 
                  variant={viewMode === "pipeline" ? "default" : "outline"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setViewMode("pipeline")}
                >
                  My Pipeline
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <select 
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="income-desc">Income (High to Low)</option>
                  <option value="income-asc">Income (Low to High)</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 overflow-y-auto flex-1">
              {filteredAndSortedLeads.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8 border rounded-lg border-dashed">No leads found.</div>
              ) : (
                filteredAndSortedLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={clsx(
                      "w-full text-left p-4 rounded-lg border transition-colors",
                      selectedLead?.id === lead.id ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white hover:bg-slate-50"
                    )}
                  >
                    <div className="font-medium text-sm text-slate-900">
                      {viewMode === "pipeline" ? (lead.name || `Lead #${lead.id.slice(0, 8)}`) : `Lead #${lead.id.slice(0, 8)}`}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-slate-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                      {viewMode === "pipeline" && (
                        <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          {lead.status || "New"}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 h-[calc(100vh-280px)] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lead Details & Eligibility</CardTitle>
              {selectedLead && viewMode === "available" && (
                <Button size="sm" onClick={() => handleClaimLead(selectedLead.id)}>
                  Claim Lead
                </Button>
              )}
              {selectedLead && viewMode === "pipeline" && (
                <div className="flex items-center gap-2">
                  <select 
                    className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
                    value={selectedLead.status || "New"}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Pre-Approved">Pre-Approved</option>
                    <option value="Lost">Lost</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/lead/${selectedLead.id}`)}>
                    Full Profile
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedLead ? (
                <div className="space-y-8">
                  {viewMode === "pipeline" && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                      <h3 className="font-semibold text-blue-900 mb-2">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 block mb-1">Name</span>
                          <span className="font-medium text-blue-900">{selectedLead.name || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 block mb-1">Phone</span>
                          <span className="font-medium text-blue-900">{selectedLead.phone || "N/A"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-blue-700 block mb-1">Email</span>
                          <span className="font-medium text-blue-900">{selectedLead.email || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 text-sm bg-slate-50 p-6 rounded-xl border">
                    <div>
                      <span className="text-slate-500 block mb-1">Household Income</span>
                      <span className="font-semibold text-slate-900 text-lg">${selectedLead.income?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Household Size</span>
                      <span className="font-semibold text-slate-900 text-lg">{selectedLead.householdSize}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Zip Code</span>
                      <span className="font-semibold text-slate-900 text-lg">{selectedLead.zipCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">First-Time Buyer</span>
                      <span className="font-semibold text-slate-900 text-lg">{selectedLead.isFthb ? "Yes" : "No"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Credit Score</span>
                      <span className="font-semibold text-slate-900 text-lg">{selectedLead.creditScore}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Est. Purchase Price</span>
                      <span className="font-semibold text-slate-900 text-lg">${selectedLead.purchasePrice?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-slate-900">Program Evaluation</h3>
                    <div className="space-y-3">
                      {selectedLead.eligibility?.map((prog: any) => (
                        <ProgramCard key={prog.id} prog={prog} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 border rounded-lg border-dashed py-12">
                  Select a lead to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
