import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Home, Plus, Building, UserCircle, LogOut, Upload } from "lucide-react";
import { db, logOut, storage } from "../firebase";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AgentProperties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [propertyType, setPropertyType] = useState("Single Family");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const agentId = localStorage.getItem("userId");

  useEffect(() => {
    if (!agentId) {
      navigate("/");
      return;
    }
    
    const q = query(collection(db, "properties"), where("agentId", "==", agentId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(propsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching properties:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [agentId, navigate]);

  const handleLogout = async () => {
    await logOut();
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const imageRef = ref(storage, `properties/${agentId}_${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, "properties"), {
        agentId,
        title,
        description,
        price: Number(price),
        address,
        zipCode,
        propertyType,
        imageUrl,
        createdAt: new Date().toISOString()
      });

      setShowForm(false);
      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setAddress("");
      setZipCode("");
      setPropertyType("Single Family");
      setImageFile(null);
    } catch (error) {
      console.error("Error adding property:", error);
      alert("Failed to add property");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl text-slate-800 flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-600" />
          Realtor Portal
        </div>
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-slate-600">
            <Link to="/agent" className="flex items-center gap-2">
              Dashboard
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

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">My Properties & Developments</h1>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Property
          </Button>
        </div>

        {showForm && (
          <Card className="border-blue-100 shadow-md">
            <CardHeader>
              <CardTitle>Add New Property</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Property Title</label>
                    <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sunnyvale Development" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Property Type</label>
                    <select 
                      className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={propertyType}
                      onChange={e => setPropertyType(e.target.value)}
                    >
                      <option value="Single Family">Single Family</option>
                      <option value="Condo">Condo</option>
                      <option value="Townhouse">Townhouse</option>
                      <option value="Development">Development (Multi-Unit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Price ($)</label>
                    <Input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="500000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Zip Code</label>
                    <Input required value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="12345" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Address</label>
                    <Input required value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City, State" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Property Image</label>
                    <div className="flex items-center gap-4">
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 text-slate-700">Description</label>
                    <textarea 
                      required 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      className="w-full border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px]"
                      placeholder="Describe the property or development..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isUploading}>Cancel</Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Saving..." : "Save Property"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading properties...</div>
        ) : properties.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Home className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">No properties listed yet</p>
              <p className="text-sm mt-1">Add your first property or development to showcase to buyers.</p>
              <Button onClick={() => setShowForm(true)} className="mt-6" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Add Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(property => (
              <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-slate-200 relative">
                  {property.imageUrl ? (
                    <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <Home className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                    {property.propertyType}
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-1">{property.title}</h3>
                  <p className="text-xl font-semibold text-blue-600 mb-3">${property.price.toLocaleString()}</p>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-start gap-2">
                      <span className="font-medium text-slate-400 w-16 shrink-0">Address:</span>
                      <span className="line-clamp-2">{property.address}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-slate-400 w-16 shrink-0">Zip:</span>
                      <span>{property.zipCode}</span>
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 line-clamp-2">{property.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
