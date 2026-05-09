import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { db } from "../firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { evaluateDPA } from "../lib/dpa";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function BorrowerIntake() {
  const { agentId } = useParams();
  const [step, setStep] = useState(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    income: "",
    householdSize: "1",
    zipCode: "",
    isFthb: true,
    creditScore: "",
    purchasePrice: "",
    homebuyerEducation: "not_completed",
    dpalPlusAtd: "yes",
    sonymaLender: "not_yet",
    gradYear: "none",
    isVeteran: "no",
    hasContract: "no",
    hdpPlusPayStubs: "not_yet",
    stackingHdp: "no",
    ownedWithin100Miles: "no",
    counselingBeforeOffer: "not_yet",
  });
  const [result, setResult] = useState<any>(null);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLead = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        agentId: agentId || "unknown",
        status: "New",
        claimedBy: null,
        createdAt: new Date().toISOString(),
        income: 0,
        householdSize: 1,
        purchasePrice: 0,
        zipCode: "10001",
        isFthb: true,
        creditScore: 0,
        homebuyerEducation: "not_completed",
        dpalPlusAtd: "yes",
        sonymaLender: "not_yet",
        gradYear: "none",
        isVeteran: "no",
        hasContract: "no",
        hdpPlusPayStubs: "not_yet",
        stackingHdp: "no",
        ownedWithin100Miles: "no",
        counselingBeforeOffer: "not_yet",
        eligibility: []
      };

      const docRef = await addDoc(collection(db, "leads"), newLead);
      setLeadId(docRef.id);
      setStep(2);
    } catch (error: any) {
      console.error(error);
      alert("Failed to submit information: " + (error.message || error));
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    try {
      const updatedLead = {
        ...formData,
        income: Number(formData.income),
        householdSize: Number(formData.householdSize),
        purchasePrice: Number(formData.purchasePrice),
        creditScore: Number(formData.creditScore),
      };

      await updateDoc(doc(db, "leads", leadId), updatedLead);
      
      setStep(3);
    } catch (error: any) {
      console.error(error);
      alert("Failed to proceed to verification. Please try again.");
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    try {
      const eligibility = evaluateDPA(formData);
      
      const updatedLead = {
        ...formData,
        income: Number(formData.income),
        householdSize: Number(formData.householdSize),
        purchasePrice: Number(formData.purchasePrice),
        creditScore: Number(formData.creditScore),
        eligibility,
      };

      await updateDoc(doc(db, "leads", leadId), updatedLead);
      
      setResult(updatedLead);
      setStep(4);
    } catch (error: any) {
      console.error(error);
      alert("Failed to evaluate eligibility. Please try again.");
    }
  };

  const handleConnectLender = async () => {
    if (!leadId) return;
    try {
      await updateDoc(doc(db, "leads", leadId), {
        status: "Requested Lender"
      });
      alert("Your profile has been flagged for a preferred lender to contact you!");
    } catch (error: any) {
      console.error(error);
      alert("Failed to connect with lender. Please try again.");
    }
  };

  if (step === 4 && result) {
    const isEligible = result.eligibility.some((p: any) => p.status === "PASS" || p.status === "VERIFY");
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEligible ? "Good News!" : "Thank You"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {isEligible 
                ? "Based on your preliminary information, you may be eligible for down payment assistance programs in New York. Your real estate agent has been notified and will connect you with a mortgage professional to verify your eligibility."
                : "We've received your information. While you might not meet the standard criteria for the most common down payment assistance programs right now, your real estate agent will follow up to discuss other financing options."}
            </p>
            <div className="pt-4 text-sm text-gray-400">
              Your data will be automatically deleted in 30 days.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>
            {step === 1 && "Welcome! Let's get started"}
            {step === 2 && "Financial Details"}
            {step === 3 && "Program-Specific Verification"}
          </CardTitle>
          <p className="text-sm text-gray-500">
            {step === 1 && "Step 1 of 3: Contact Information"}
            {step === 2 && "Step 2 of 3: Financial Details"}
            {step === 3 && "Step 3 of 3: Eligibility Verification"}
          </p>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input 
                  required 
                  placeholder="John Doe"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input 
                    type="email"
                    required 
                    placeholder="john@example.com"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input 
                    type="tel"
                    required 
                    placeholder="(555) 123-4567"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-6">
                Continue to Financial Details <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Household Income</label>
                <Input 
                  type="number" 
                  required 
                  placeholder="e.g. 85000"
                  value={formData.income} 
                  onChange={(e) => setFormData({...formData, income: e.target.value})} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Household Size</label>
                  <Input 
                    type="number" 
                    required 
                    min="1"
                    value={formData.householdSize} 
                    onChange={(e) => setFormData({...formData, householdSize: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New York Area</label>
                  <select 
                    required 
                    value={formData.zipCode} 
                    onChange={(e) => setFormData({...formData, zipCode: e.target.value})} 
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select your area</option>
                    <option value="10001">New York City - Manhattan</option>
                    <option value="10451">New York City - Bronx</option>
                    <option value="11201">New York City - Brooklyn</option>
                    <option value="11101">New York City - Queens</option>
                    <option value="10301">New York City - Staten Island</option>
                    <option value="11501">Long Island - Nassau</option>
                    <option value="11701">Long Island - Suffolk</option>
                    <option value="10701">Westchester - Yonkers</option>
                    <option value="12201">Capital Region - Albany</option>
                    <option value="13201">Central NY - Syracuse</option>
                    <option value="14601">Finger Lakes - Rochester</option>
                    <option value="14201">Western NY - Buffalo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estimated Purchase Price</label>
                <Input 
                  type="number" 
                  required 
                  placeholder="e.g. 400000"
                  value={formData.purchasePrice} 
                  onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estimated Credit Score</label>
                <Input 
                  type="number" 
                  required 
                  placeholder="e.g. 720"
                  value={formData.creditScore} 
                  onChange={(e) => setFormData({...formData, creditScore: e.target.value})} 
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="fthb"
                  checked={formData.isFthb}
                  onChange={(e) => setFormData({...formData, isFthb: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="fthb" className="text-sm font-medium">
                  I am a First-Time Homebuyer (haven't owned in 3 years)
                </label>
              </div>

              <Button type="submit" className="w-full mt-6">
                Continue to Verification <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Have you completed a certified Homebuyer Education course?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.homebuyerEducation}
                    onChange={(e) => setFormData({...formData, homebuyerEducation: e.target.value})}
                  >
                    <option value="not_completed">No, not yet completed</option>
                    <option value="in_progress">Yes, in progress</option>
                    <option value="completed">Yes, completed (have certificate)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Are you planning to apply for the SONYMA "Achieving the Dream" loan?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.dpalPlusAtd}
                    onChange={(e) => setFormData({...formData, dpalPlusAtd: e.target.value})}
                  >
                    <option value="yes">Yes, applying together</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Are you currently working with a SONYMA participating mortgage lender?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.sonymaLender}
                    onChange={(e) => setFormData({...formData, sonymaLender: e.target.value})}
                  >
                    <option value="not_yet">Not yet / I don't know</option>
                    <option value="yes">Yes, confirmed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">When did you graduate from a college or university in New York State?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.gradYear}
                    onChange={(e) => setFormData({...formData, gradYear: e.target.value})}
                  >
                    <option value="none">Did not graduate from NY institution</option>
                    <option value="before_2021">Before 2021</option>
                    <option value="2021">2021</option>
                    <option value="2022_2025">2022 / 2023 / 2024 / 2025</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Are you an eligible U.S. Military Veteran?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.isVeteran}
                    onChange={(e) => setFormData({...formData, isVeteran: e.target.value})}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Do you already have a signed contract to purchase a home?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.hasContract}
                    onChange={(e) => setFormData({...formData, hasContract: e.target.value})}
                  >
                    <option value="no">Not yet</option>
                    <option value="negotiation">In negotiation</option>
                    <option value="yes">Yes, signed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Do you have recent paystubs available to confirm your household income?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.hdpPlusPayStubs}
                    onChange={(e) => setFormData({...formData, hdpPlusPayStubs: e.target.value})}
                  >
                    <option value="not_yet">Not yet / Unknown</option>
                    <option value="yes">Yes, Paystubs Available</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Are you applying for both the Homebuyer Dream Program and the HDP Wealth Builder grant?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.stackingHdp}
                    onChange={(e) => setFormData({...formData, stackingHdp: e.target.value})}
                  >
                    <option value="no">No / Not sure</option>
                    <option value="yes">Yes, applying for both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Have you owned a residential property within 100 miles of New York City in the last 3 years?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.ownedWithin100Miles}
                    onChange={(e) => setFormData({...formData, ownedWithin100Miles: e.target.value})}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">For Rochester buyers: Have you completed Homebuyer Counseling before making an offer?</label>
                  <select 
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={formData.counselingBeforeOffer}
                    onChange={(e) => setFormData({...formData, counselingBeforeOffer: e.target.value})}
                  >
                    <option value="not_yet">No, not yet completed</option>
                    <option value="yes">Yes, completed BEFORE any offer</option>
                    <option value="already_made_offer">No, already made offer without it</option>
                  </select>
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-8">
                Submit & Check Eligibility <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
