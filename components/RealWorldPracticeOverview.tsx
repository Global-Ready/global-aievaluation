"use client";

import { Layers, Gauge, TrendingUp, Lock, ChevronRight } from "lucide-react";
import { PRACTICE_DOMAINS, type PracticeDomainId } from "@/lib/practice-domains";

const HOW_IT_WORKS = [
  "Choose a domain below",
  "Select your difficulty level",
  "Complete realistic tasks and receive feedback",
];

interface RealWorldPracticeOverviewProps {
  canPractice: boolean;
  onSelectDomain: (domainId: PracticeDomainId) => void;
}

export default function RealWorldPracticeOverview({ canPractice, onSelectDomain }: RealWorldPracticeOverviewProps) {
  return (
    <div className="max-w-5xl mx-auto pl-1 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Assessment
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Practice realistic, job-style AI evaluation tasks across different domains — the
          same kind of judgment calls you&apos;ll make as a working AI evaluator.
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-550 leading-relaxed">
          Global Ready AIEval practice exercises are independently created for training purposes and should not
          be interpreted as official assessment questions from any third-party platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {PRACTICE_DOMAINS.length} available domains
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Beginner, Intermediate and Expert difficulty levels
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            Progress / XP tracking
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight block">
          How It Works
        </span>
        <ol className="space-y-2">
          {HOW_IT_WORKS.map((step, idx) => (
            <li key={step} className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-450">Choose a Domain</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRACTICE_DOMAINS.map((domain) => (
            <button
              key={domain.id}
              id={`assessment-domain-card-${domain.id}`}
              type="button"
              disabled={domain.comingSoon}
              onClick={() => {
                if (domain.comingSoon) return;
                onSelectDomain(domain.id);
              }}
              className={`group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-6 transition-all relative overflow-hidden ${
                domain.comingSoon
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"
              }`}
            >
              {domain.comingSoon && (
                <div className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  Soon
                </div>
              )}
              {!domain.comingSoon && !canPractice && (
                <div className="absolute top-3 right-3 bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 p-1.5 rounded-md">
                  <Lock className="w-3 h-3" />
                </div>
              )}

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight pr-14">
                  {domain.label}
                </h3>
              </div>

              {!domain.comingSoon && (
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Start practicing
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
