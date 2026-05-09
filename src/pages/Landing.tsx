import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, ShieldCheck, Calculator, Network, Hexagon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Hexagon className="w-6 h-6 text-blue-400" />
            <span>MortgageQuest</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
              The Future of Real Estate Lead Generation
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Connect Buyers, Realtors, and Lenders <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Instantly.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-3xl mx-auto">
              Automate Down Payment Assistance (DPA) eligibility, capture leads at open houses with QR codes, and seamlessly route qualified buyers to preferred lenders.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-base rounded-full bg-white text-slate-950 hover:bg-slate-200 transition-all w-full sm:w-auto">
                <Link to="/login">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-slate-700 hover:bg-slate-800 text-slate-300 w-full sm:w-auto">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section (Glassmorphism) */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to close more deals.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">A unified platform designed specifically for the modern real estate ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Calculator className="w-6 h-6 text-amber-400" />,
                title: "Instant DPA Evaluation",
                desc: "Automatically screen buyers for Down Payment Assistance programs like SONYMA, FHA, and local grants the moment they apply."
              },
              {
                icon: <Network className="w-6 h-6 text-blue-400" />,
                title: "Seamless Lead Routing",
                desc: "Realtors capture leads via custom QR codes at open houses. Qualified buyers are instantly routed to partner lenders."
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
                title: "Secure Pipeline Management",
                desc: "Lenders get a dedicated dashboard to claim leads, update statuses, and view detailed financial profiles and eligibility reasoning."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 rounded-3xl hover:bg-white/[0.05] transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 border border-white/[0.05]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative z-10 bg-slate-900/50 border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Choose the plan that fits your business. Built on the core principles of our founding document.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-950 border border-white/[0.1] rounded-3xl p-8 flex flex-col"
            >
              <div className="mb-8">
                <h3 className="text-xl font-medium text-slate-300 mb-2">Realtor Basic</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-slate-400 mt-4 text-sm">Perfect for individual agents starting out.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Basic Lead Capture', 'Standard DPA Evaluation', 'Up to 50 leads/mo', 'Email Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full rounded-full border-slate-700 hover:bg-slate-800 text-slate-300">
                <Link to="/login">Get Started</Link>
              </Button>
            </motion.div>

            {/* Pro Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-b from-blue-900/40 to-slate-950 border border-blue-500/30 rounded-3xl p-8 flex flex-col relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-medium text-blue-300 mb-2">Realtor Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-slate-400 mt-4 text-sm">For top producers who need advanced tools.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Unlimited Leads', 'Advanced DPA Reasoning', 'Custom QR Codes', 'Priority Lender Matching', 'Analytics Dashboard'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full rounded-full bg-blue-600 hover:bg-blue-500 text-white">
                <Link to="/login">Start 14-Day Trial</Link>
              </Button>
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-slate-950 border border-white/[0.1] rounded-3xl p-8 flex flex-col"
            >
              <div className="mb-8">
                <h3 className="text-xl font-medium text-slate-300 mb-2">Lender Enterprise</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$299</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-slate-400 mt-4 text-sm">For loan officers and mortgage brokerages.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Exclusive Lead Claiming', 'Full Pipeline Management', 'Custom DPA Rules Engine', 'White-labeling Options', 'Dedicated Account Manager'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full rounded-full border-slate-700 hover:bg-slate-800 text-slate-300">
                <Link to="/login">Contact Sales</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.05] text-center text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <Hexagon className="w-5 h-5" />
            <span>MortgageQuest</span>
          </div>
          <p>© {new Date().getFullYear()} MortgageQuest. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
