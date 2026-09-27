"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Gift, Link2, Share2, TrendingUp, Wallet, Check, Copy,
  ShieldAlert, RefreshCw, CheckCircle2, Megaphone, Sparkles, FileText, CalendarClock,
  Clock, Lock,
} from "lucide-react";
import {
  becomeAffiliate,
  getMyAffiliateStatus,
  getMyReferralSummary,
  type AffiliateStatus,
  type AffiliateReferralSummary,
} from "../lib/actions/affiliates";
import { AFFILIATE_TERMS_VERSION } from "../lib/affiliate-terms";

const DEFAULT_COMMISSION_LABEL = "30%";

function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

const PROMOTE_ITEMS = [
  "Learn AI evaluation & AI training skills",
  "Practise AI evaluation tasks & assessments",
  "Prepare for AI evaluation interviews",
  "Discover AI training opportunities",
];

export default function AffiliateView({
  onBack,
  membershipTier,
}: {
  onBack: () => void;
  membershipTier?: string;
}) {
  const isEligible = membershipTier === "career_accelerator";
  const [affiliateStatus, setAffiliateStatus] = useState<AffiliateStatus | null>(null);
  const [referralSummary, setReferralSummary] = useState<AffiliateReferralSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBecomingAffiliate, setIsBecomingAffiliate] = useState(false);
  const [affiliateError, setAffiliateError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyAffiliateStatus().then((status) => {
      if (cancelled) return;
      setAffiliateStatus(status);
      setIsLoading(false);
      if (status) {
        getMyReferralSummary().then((summary) => {
          if (!cancelled) setReferralSummary(summary);
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const referralLink =
    affiliateStatus && typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${affiliateStatus.code}`
      : "";

  const rateLabel = affiliateStatus ? `${Math.round(affiliateStatus.commissionRate * 100)}%` : DEFAULT_COMMISSION_LABEL;

  const handleBecomeAffiliate = async () => {
    setAffiliateError("");
    setIsBecomingAffiliate(true);
    const result = await becomeAffiliate(termsAccepted);
    setIsBecomingAffiliate(false);

    if (result.error) {
      setAffiliateError(result.error);
      return;
    }
    const status = await getMyAffiliateStatus();
    setAffiliateStatus(status);
    const summary = await getMyReferralSummary();
    setReferralSummary(summary);
  };

  const handleCopyReferralLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto pl-1 space-y-6 animate-fade-in pb-16">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to AI Career Hub
      </button>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Affiliate Program
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Share Global Ready AIEval. Earn <span className="text-indigo-600 dark:text-indigo-400">{rateLabel}</span>.
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
          Help more people discover practical AI evaluation training and earn a {rateLabel} commission on every qualifying sale you refer.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl px-3.5 py-2">
            <Gift className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">No setup fee — it&apos;s free to join</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl px-3.5 py-2">
            <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Your link — ready to share</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl px-3.5 py-2">
            <CalendarClock className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Payouts processed weekly</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-5 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Link2, label: "Copy Your Link", desc: "Grab your unique affiliate link below." },
            { icon: Share2, label: "Share It", desc: "Share it with your audience on any platform." },
            { icon: Sparkles, label: `Earn ${rateLabel}`, desc: "You earn commission when someone makes a qualifying purchase." },
            { icon: Wallet, label: "Get Paid Weekly", desc: "Approved commissions are paid out every week." },
          ].map((step) => (
            <div key={step.label} className="text-center space-y-2">
              <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                <step.icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{step.label}</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Link + stats / join CTA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading...</p>
        ) : !affiliateStatus && !isEligible ? (
          <div className="text-center space-y-4 py-4 max-w-md mx-auto">
            <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-850 rounded-full text-slate-400 dark:text-slate-500">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Career Accelerator members only</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The Affiliate Program is currently available to Career Accelerator members. Upgrade your plan to request access.
              </p>
            </div>
          </div>
        ) : !affiliateStatus ? (
          <div className="text-center space-y-4 py-4 max-w-md mx-auto">
            <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
              <Gift className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Ready to start earning?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Request to join the Affiliate Program and earn {rateLabel} of every qualifying sale you bring in — an admin reviews each request.
              </p>
            </div>

            <label className="flex items-start gap-2.5 text-left bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 shrink-0"
              />
              <span className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">
                I have read and agree to the Global Ready AIEval{" "}
                <Link href="/affiliate-terms" target="_blank" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  Affiliate Program Terms
                </Link>
                .
              </span>
            </label>

            {affiliateError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-405 font-bold flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> {affiliateError}
              </p>
            )}
            <button
              type="button"
              onClick={handleBecomeAffiliate}
              disabled={isBecomingAffiliate || !termsAccepted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {isBecomingAffiliate && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Request to Join
            </button>
          </div>
        ) : affiliateStatus.status === "pending" ? (
          <div className="text-center space-y-3 py-4 max-w-md mx-auto">
            <div className="inline-flex p-4 bg-amber-50 dark:bg-amber-950/30 rounded-full text-amber-600 dark:text-amber-400">
              <Clock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Request submitted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your request to join the Affiliate Program is awaiting review. We&apos;ll unlock your referral link once it&apos;s approved.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-xs text-slate-455 font-bold uppercase tracking-wider block mb-1.5">
                Your Affiliate Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleCopyReferralLink}
                  title="Copy link"
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copySuccess ? "Copied" : "Copy Link"}
                </button>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                <Megaphone className="w-3 h-3 shrink-0" />
                Share this link and earn {rateLabel} commission — always disclose that it&apos;s an affiliate link.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-850 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Commission</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-1.5 block">{rateLabel}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Referrals</span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-1.5 block">{referralSummary?.referrals.length ?? 0}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Pending</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1.5 block">{formatCents(referralSummary?.pendingCommissionCents ?? 0)}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Paid Out</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1.5 block">{formatCents(referralSummary?.paidCommissionCents ?? 0)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 dark:text-slate-500">
              {rateLabel} commission on qualifying sales · Payouts processed weekly
            </p>

            {affiliateStatus.status === "disabled" && (
              <p className="text-[11px] text-rose-600 dark:text-rose-405 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Your affiliate account is currently disabled — new referrals won&apos;t earn commission.
              </p>
            )}
          </div>
        )}
      </div>

      {/* What can you promote / disclosure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> What Can You Promote?
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">You can share Global Ready AIEval with people who want to:</p>
          <ul className="space-y-1.5">
            {PROMOTE_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-350">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="bg-slate-50 dark:bg-slate-850 rounded-xl p-3 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-700 dark:text-slate-300">Important:</strong> Global Ready AIEval is an independent training platform. Do not tell people we are officially affiliated with Mercor, Outlier, Alignerr, Micro1, or any other platform unless we expressly state otherwise.
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-indigo-500" /> Affiliate Disclosure
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Whenever you share your referral link, clearly disclose that you may earn a commission.
          </p>
          <blockquote className="border-l-2 border-indigo-300 dark:border-indigo-700 pl-3 text-[11px] italic text-slate-600 dark:text-slate-350">
            &ldquo;Affiliate link: I may earn a commission if you purchase through this link, at no additional cost to you.&rdquo;
          </blockquote>
          <p className="text-[10px] text-slate-450 dark:text-slate-500">
            Place this disclosure near your link or recommendation in your content.
          </p>
        </div>
      </div>

      {/* Full terms link */}
      <Link
        href="/affiliate-terms"
        target="_blank"
        className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
      >
        <span className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
          Read the full Affiliate Program Terms
        </span>
        <span className="text-[10px] text-slate-400 group-hover:text-indigo-500 transition-colors">
          Version {AFFILIATE_TERMS_VERSION} &rarr;
        </span>
      </Link>

      {affiliateStatus && affiliateStatus.status !== "pending" && (
        <div className="bg-indigo-600 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="text-sm font-black text-white">Ready to start earning?</p>
            <p className="text-xs text-indigo-100 mt-0.5">
              Copy your link, share Global Ready AIEval with the right people, and earn {rateLabel} on qualifying sales.
            </p>
          </div>
          <button
            onClick={handleCopyReferralLink}
            className="shrink-0 bg-white hover:bg-indigo-50 text-indigo-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copySuccess ? "Copied!" : "Copy My Affiliate Link"}
          </button>
        </div>
      )}
    </div>
  );
}
