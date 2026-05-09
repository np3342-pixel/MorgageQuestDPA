import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Building, UserCircle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { GoogleGenAI } from "@google/genai";
import { signInWithGoogle, db, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function Home() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"agent" | "lender">("agent");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

  useEffect(() => {
    const generateBg = async () => {
      const cachedBg = localStorage.getItem("heroBgImage");
      if (cachedBg) {
        setBgImage(cachedBg);
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: 'A professional, modern, and subtle background image for a real estate and mortgage lending web application. The theme includes modern homes, buyers, and lenders. It should have a dark, sleek, and minimalist aesthetic suitable for a glassmorphism UI overlay. High quality, architectural, abstract elements, deep blue and slate tones.',
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            }
          }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const imageUrl = `data:image/jpeg;base64,${base64EncodeString}`;
            setBgImage(imageUrl);
            localStorage.setItem("heroBgImage", imageUrl);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to generate background image:", error);
      }
    };

    generateBg();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    if (!isLogin && password.length < 6) {
      alert("Password should be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      let user;
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      }

      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        let userRole: string = role;
        
        if (userSnap.exists()) {
          userRole = userSnap.data().role;
        } else {
          await setDoc(userRef, {
            email: user.email,
            name: name || user.email?.split('@')[0] || "User",
            role: userRole,
            createdAt: new Date().toISOString()
          });
        }

        // Force admin role for the owner email
        if (user.email === "zuansah.munggaran@gmail.com" && userRole !== "admin") {
          userRole = "admin";
          await updateDoc(userRef, { role: "admin" });
        }

        localStorage.setItem("userId", user.uid);
        localStorage.setItem("userRole", userRole);
        
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "agent") {
          navigate("/agent");
        } else {
          navigate("/lender");
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.message.includes('auth/invalid-credential')) {
        alert("Invalid email or password. Please check your credentials and try again.");
      } else if (error.code === 'auth/email-already-in-use' || error.message.includes('auth/email-already-in-use')) {
        alert("An account with this email already exists. Please sign in instead.");
      } else {
        alert(error.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        // Check if user exists in Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          let userRole = userSnap.data().role;
          
          // Force admin role for the owner email
          if (user.email === "zuansah.munggaran@gmail.com" && userRole !== "admin") {
            userRole = "admin";
            await updateDoc(userRef, { role: "admin" });
          }

          localStorage.setItem("userId", user.uid);
          localStorage.setItem("userRole", userRole);
          
          if (userRole === "admin") {
            navigate("/admin");
          } else if (userRole === "agent") {
            navigate("/agent");
          } else {
            navigate("/lender");
          }
        } else {
          // New user via Google, ask for role
          setPendingGoogleUser(user);
        }
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGoogleSignUp = async (selectedRole: "agent" | "lender") => {
    if (!pendingGoogleUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", pendingGoogleUser.uid);
      
      let finalRole = selectedRole as string;
      if (pendingGoogleUser.email === "zuansah.munggaran@gmail.com") {
        finalRole = "admin";
      }

      await setDoc(userRef, {
        email: pendingGoogleUser.email,
        name: pendingGoogleUser.displayName || pendingGoogleUser.email?.split('@')[0] || "User",
        role: finalRole,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem("userId", pendingGoogleUser.uid);
      localStorage.setItem("userRole", finalRole);
      
      if (finalRole === "admin") {
        navigate("/admin");
      } else if (finalRole === "agent") {
        navigate("/agent");
      } else {
        navigate("/lender");
      }
    } catch (error: any) {
      console.error(error);
      alert("Failed to complete sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-1000"
      style={bgImage ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      {/* Subtle background glow for professional glassmorphism */}
      {!bgImage && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-800/30 rounded-full blur-[120px] pointer-events-none" />
      )}
      
      {/* Dark overlay to ensure text readability over the image */}
      {bgImage && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
      )}

      <div className="max-w-[400px] w-full z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Mortgage Quest
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Down Payment Assistance Matching
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl text-white rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center font-medium">
              {pendingGoogleUser 
                ? "Complete your profile" 
                : (isLogin ? "Sign in to your account" : "Create an account")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingGoogleUser ? (
              <div className="space-y-5 text-center">
                <p className="text-sm text-slate-300 mb-4">
                  Welcome, {pendingGoogleUser.displayName || pendingGoogleUser.email}! Are you a Realtor or a Lender?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCompleteGoogleSignUp("agent")}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-200"
                  >
                    <UserCircle className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">I'm a Realtor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteGoogleSignUp("lender")}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-200"
                  >
                    <Building className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">I'm a Lender</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleEmailAuth} className="space-y-5">
                  {!isLogin && (
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setRole("agent")}
                        className={clsx(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                          role === "agent" 
                            ? "bg-white/10 border-white/30 text-white" 
                            : "bg-transparent border-white/5 text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <UserCircle className="w-6 h-6 mb-1.5" />
                        <span className="text-xs font-medium">Realtor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("lender")}
                        className={clsx(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                          role === "lender" 
                            ? "bg-white/10 border-white/30 text-white" 
                            : "bg-transparent border-white/5 text-slate-400 hover:bg-white/5"
                        )}
                      >
                        <Building className="w-6 h-6 mb-1.5" />
                        <span className="text-xs font-medium">Lender</span>
                      </button>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Full Name</label>
                      <Input 
                        required 
                        placeholder="John Doe" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <Input 
                      type="email" 
                      required 
                      placeholder="name@example.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <Input 
                      type="password" 
                      required 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium h-11 transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white text-slate-950 hover:bg-slate-200 font-medium h-11 transition-colors"
                  disabled={loading}
                >
                  Google
                </Button>

                <div className="mt-6 text-center text-sm text-slate-400">
                  {isLogin ? (
                    <p>
                      Don't have an account?{" "}
                      <button onClick={() => setIsLogin(false)} className="text-blue-400 hover:text-blue-300 font-medium">
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button onClick={() => setIsLogin(true)} className="text-blue-400 hover:text-blue-300 font-medium">
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
