import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, AlertCircle, FileText, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export default function ProgramCard({ prog }: { prog: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm mb-4">
      {/* Header */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="bg-slate-900 text-white rounded-lg p-2 flex flex-col items-center justify-center min-w-[70px]">
            <span className="text-xs font-bold text-slate-400">{prog.id}</span>
            <span className="text-sm font-bold">{prog.benefit?.label || "DPA"}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{prog.name}</h3>
            {prog.subtitle && <p className="text-sm text-slate-500">{prog.subtitle}</p>}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {prog.tags && prog.tags.map((tag: string, i: number) => (
            <span key={i} className="px-2.5 py-1 rounded-full border border-slate-200 text-xs font-medium text-slate-600 bg-white whitespace-nowrap">
              {tag}
            </span>
          ))}
          
          {prog.status === "PASS" && (
            <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-bold border border-green-200 whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4" /> PASS
            </span>
          )}
          {prog.status === "FAIL" && (
            <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1 rounded-full text-sm font-bold border border-red-200 whitespace-nowrap">
              <XCircle className="w-4 h-4" /> FAIL
            </span>
          )}
          {prog.status === "VERIFY" && (
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-sm font-bold border border-amber-200 whitespace-nowrap">
              <HelpCircle className="w-4 h-4" /> VERIFY
            </span>
          )}
          <ChevronDown className={clsx("w-5 h-5 text-slate-400 transition-transform hidden sm:block", expanded && "rotate-180")} />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && prog.blocks && (
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {prog.blocks.map((block: any, i: number) => {
              let bg = "bg-slate-50", border = "border-slate-200", text = "text-slate-800", iconColor = "text-slate-500";
              let Icon = FileText;

              if (block.type === "HARD STOP") {
                bg = "bg-red-50/50"; border = "border-red-200"; text = "text-red-800"; iconColor = "text-red-600"; Icon = XCircle;
              } else if (block.type === "THRESHOLD") {
                bg = "bg-amber-50/50"; border = "border-amber-200"; text = "text-amber-800"; iconColor = "text-amber-600"; Icon = AlertCircle;
              } else if (block.type === "POPULATION") {
                bg = "bg-emerald-50/50"; border = "border-emerald-200"; text = "text-emerald-800"; iconColor = "text-emerald-600"; Icon = CheckCircle2;
              }

              return (
                <div key={i} className={`p-4 rounded-xl border ${bg} ${border}`}>
                  <div className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase mb-2 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                    {block.type} — {block.label}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {block.text}
                  </p>
                </div>
              );
            })}
          </div>

          {prog.benefit && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
              <div className="text-xl font-black text-amber-700 whitespace-nowrap">{prog.benefit.label}</div>
              <div className="text-sm text-amber-900">{prog.benefit.description}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
