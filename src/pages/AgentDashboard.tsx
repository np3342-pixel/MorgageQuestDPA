import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Copy, QrCode, UserCircle, LogOut, Users, CheckCircle2 } from "lucide-react";
import { db, logOut } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [agentId, setAgentId] = useState<string | null>(localStorage.getItem("userId"));
  const [leads, setLeads] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("date-desc");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!agentId || localStorage.getItem("userRole") !== "agent") {
      navigate("/");
      return;
    }

    const q = query(collection(db, "leads"), where("agentId", "==", agentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
    }, (error) => {
      console.error("Error fetching leads:", error);
    });

    return () => unsubscribe();
  }, [agentId, navigate]);

  const filteredAndSortedLeads = leads
    .filter((lead) => {
      const isEligible = lead.eligibility.some((p: any) => p.status === "PASS" || p.status === "VERIFY");
      if (filterStatus === "eligible") return isEligible;
      if (filterStatus === "ineligible") return !isEligible;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "date-asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "income-desc") return b.income - a.income;
      if (sortBy === "income-asc") return a.income - b.income;
      return 0;
    });

  const qrUrl = `${window.location.origin}/apply/${agentId}`;
  const isDevEnv = window.location.origin.includes('ais-dev-');

  const handleLogout = async () => {
    await logOut();
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const eligibleLeadsCount = leads.filter(lead => lead.eligibility.some((p: any) => p.status === "PASS" || p.status === "VERIFY")).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl text-slate-800">Realtor Portal</div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-slate-600">
            <Link to="/agent/properties" className="flex items-center gap-2">
              My Properties
            </Link>
          </Button>
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

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Leads Captured
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
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Open House QR
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
              {isDevEnv && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-md text-center">
                  <strong>Note:</strong> You are in the private dev environment. To get a public QR code that anyone can scan, click <strong>"Share"</strong> in the top right of AI Studio, open the shared app, and use the QR code from there.
                </div>
              )}
              <p className="text-sm text-center text-slate-500">
                Print this QR code and place it at your open house to capture leads.
              </p>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => navigator.clipboard.writeText(qrUrl)}
              >
                <Copy className="w-4 h-4" /> Copy Link
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Leads</CardTitle>
              <div className="flex items-center gap-2">
                <select 
                  className="text-sm border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="eligible">Potentially Eligible</option>
                  <option value="ineligible">Unlikely Eligible</option>
                </select>
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
            <CardContent>
              {filteredAndSortedLeads.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border rounded-lg border-dashed">
                  No leads found matching criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedLeads.map((lead) => {
                    const isEligible = lead.eligibility.some((p: any) => p.status === "PASS" || p.status === "VERIFY");
                    return (
                      <button 
                        key={lead.id} 
                        onClick={() => navigate(`/lead/${lead.id}`)}
                        className="w-full text-left flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-sm hover:border-blue-200 transition-all"
                      >
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            {lead.name || `Lead #${lead.id.slice(0, 8)}`}
                            <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                              {lead.status || "New"}
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            Income: ${lead.income.toLocaleString()} | Zip: {lead.zipCode}
                          </div>
                        </div>
                        <div>
                          {isEligible ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                              Potentially Eligible
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                              Unlikely Eligible
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
