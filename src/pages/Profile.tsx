import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserCircle, Save } from "lucide-react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    company: "",
    licenseNumber: ""
  });

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/");
      return;
    }

    const fetchUser = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data: any = { id: docSnap.id, ...docSnap.data() };
          setUser(data);
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            company: data.company || "",
            licenseNumber: data.licenseNumber || ""
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    
    fetchUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = doc(db, "users", user.id);
      await updateDoc(docRef, formData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading profile...</div>;

  const backLink = user.role === "agent" ? "/agent" : user.role === "lender" ? "/lender" : "/admin";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={backLink}><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Full Name</label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Email Address (Read Only)</label>
                  <Input 
                    disabled 
                    value={user.email} 
                    className="bg-slate-100 text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Phone Number</label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Company / Brokerage</label>
                  <Input 
                    value={formData.company} 
                    onChange={(e) => setFormData({...formData, company: e.target.value})} 
                    placeholder="Acme Real Estate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">License Number</label>
                  <Input 
                    value={formData.licenseNumber} 
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})} 
                    placeholder="LIC-123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700">Role</label>
                  <Input 
                    disabled 
                    value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} 
                    className="bg-slate-100 text-slate-500 capitalize"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
