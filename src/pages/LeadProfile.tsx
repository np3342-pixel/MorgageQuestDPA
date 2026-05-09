import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, HelpCircle, UserCircle, Sparkles, Loader2 } from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import ProgramCard from "../components/ProgramCard";

export default function LeadProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "leads", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLead({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Failed to fetch lead");
        }
      } catch (error) {
        console.error("Error fetching lead:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="text-slate-500">Lead not found</div>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isEligible = lead.eligibility?.some((p: any) => p.status === "PASS" || p.status === "VERIFY");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="font-bold text-xl text-slate-800">Buyer Profile</div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UserCircle className="w-8 h-8 text-slate-400" />
              {lead.name || `Lead #${lead.id.slice(0, 8)}`}
              {lead.status && (
                <span className="text-sm font-medium px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full ml-2">
                  {lead.status}
                </span>
              )}
            </h1>
            <div className="text-slate-500 mt-1 ml-10">
              Captured on {new Date(lead.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            {isEligible ? (
              <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Potentially Eligible
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                Unlikely Eligible
              </span>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Name</span>
                <span className="font-semibold text-slate-900 text-lg">{lead.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Email</span>
                <span className="font-semibold text-slate-900 text-lg">{lead.email || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Phone</span>
                <span className="font-semibold text-slate-900 text-lg">{lead.phone || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Household Income</span>
                <span className="font-semibold text-slate-900 text-lg">${lead.income?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Household Size</span>
                <span className="font-semibold text-slate-900 text-lg">{lead.householdSize}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Zip Code</span>
                <span className="font-semibold text-slate-900 text-lg">{lead.zipCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">First-Time Buyer</span>
                <span className="font-semibold text-slate-900 text-lg">{lead.isFthb ? "Yes" : "No"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Credit Score</span>
                <span className="font-semibold text-slate-900 text-lg">{lead.creditScore}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Est. Purchase Price</span>
                <span className="font-semibold text-slate-900 text-lg">${lead.purchasePrice?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DPA Program Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lead.eligibility?.map((prog: any) => (
                <ProgramCard key={prog.id} prog={prog} />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
