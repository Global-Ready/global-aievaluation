"use client";

import { PartyPopper, Check, Loader2, AlertTriangle, ArrowRight, BookOpen, Briefcase, MessageSquare, Users } from "lucide-react";
import { TIERS, type TierId } from "../lib/pricing";
import type { LatestPurchase } from "../lib/actions/billing";

export type WelcomeSyncStatus = "syncing" | "ready" | "error";

const PRODUCT_LABELS: Record<string, string> = {
  tier_starter: "Starter",
  tier_professional_founding: "Professional (Founding price)",
  tier_professional_regular: "Professional",
  tier_career_accelerator: "Career Accelerator",
  credit_pack_a: "AI Interview Credit Pack",
  credit_pack_b: "AI Interview Credit Pack",
  coaching_session: "1-to-1 Coaching",
};

function formatAmount(cents: number | null, currency: string): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-DE", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

interface WelcomeViewProps {
  status: WelcomeSyncStatus;
  tier: TierId;
  latestPurchase: LatestPurchase | null;
  onRetry: () => void;
  onContinue: () => void;
  onGoToPractice: () => void;
  onGoToInterview: () => void;
}

export default function WelcomeView({
  status,
  tier,
  latestPurchase,
  onRetry,
  onContinue,
  onGoToPractice,
  onGoToInterview,
}: WelcomeViewProps) {
  if (status === "syncing") {
    return (
      <div className="max-w-lg mx-auto pl-1 py-16 text-center space-y-4 animate-fade-in">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-900 dark:text-white">Confirming your payment&hellip;</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">This usually takes just a few seconds.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-lg mx-auto pl-1 py-16 text-center space-y-5 animate-fade-in">
        <div className="inline-flex p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-full text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Still confirming your payment</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Stripe processed your payment, but it's taking a little longer than usual to reflect on your account.
            This is safe to retry — it won't charge you again.
          </p>
        </div>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          Check Again
        </button>
      </div>
    );
  }

  const meta = TIERS[tier];
  const isDigitalContent = latestPurchase?.productType !== "coaching_session";
  const productLabel = latestPurchase ? PRODUCT_LABELS[latestPurchase.productType] ?? latestPurchase.productType : meta.displayName;

  return (
    <div className="max-w-2xl mx-auto pl-1 py-8 space-y-8 animate-fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-600 dark:text-emerald-400">
          <PartyPopper className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Payment successful. Your order has been confirmed.
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Your account is now on the <span className="font-bold text-slate-700 dark:text-slate-300">{meta.label}</span> plan.
        </p>
      </div>

      {/* Order confirmation — DEVELOPER_COMPLIANCE.MD §9 */}
      {latestPurchase && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Product</span>
            <span className="font-bold text-slate-900 dark:text-white">{productLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount paid</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatAmount(latestPurchase.amountCents, latestPurchase.currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Order reference</span>
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{latestPurchase.orderReference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Support</span>
            <a href="mailto:contact@globalready.tech" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              contact@globalready.tech
            </a>
          </div>
          {isDigitalContent && (
            <p className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-450 leading-relaxed">
              You requested immediate access to your digital content and acknowledged the applicable effect on
              your statutory withdrawal right — see our{" "}
              <a href="/refunds" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Refund, Cancellation &amp; Withdrawal Policy
              </a>
              .
            </p>
          )}
        </div>
      )}

      {latestPurchase?.productType === "tier_career_accelerator" && (
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-2 border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white my-0">Your Accelerator community is ready</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-relaxed">
                Join the private group for live coaching, Q&amp;A calls, and other Accelerator members.
              </p>
            </div>
          </div>
          <a
            href="https://www.skool.com/ai-hustle-skuul-5237/about"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Access Community on Skool
          </a>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-450">What's unlocked</span>
        <ul className="space-y-2.5">
          {meta.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={onContinue}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-4 text-left transition-colors cursor-pointer flex flex-col gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-bold">Start Learning</span>
        </button>
        <button
          onClick={onGoToPractice}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 text-left transition-colors cursor-pointer flex flex-col gap-2"
        >
          <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">Assessment</span>
        </button>
        <button
          onClick={onGoToInterview}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 text-left transition-colors cursor-pointer flex flex-col gap-2"
        >
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">AI Interview Simulator</span>
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onContinue}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          Go to AI Career Hub <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
