import React, { useState } from "react";
import {
  Check, Lock, Sparkles, Shield, Award,
  Zap, ArrowLeft, Star, AlertCircle, CheckCircle2, Loader2, Gift, Users, RefreshCw,
} from "lucide-react";
import { UserStats, Testimonial } from "../types";
import {
  createOneTimeCheckout,
  createPortalSession,
  syncMyPurchases,
} from "../lib/actions/billing";
import {
  TIERS, TIER_ORDER, CREDIT_PACKS, COACHING_OFFER, type TierId,
} from "../lib/pricing";
import { isRedirectError } from "../lib/is-redirect-error";
import TestimonialsSection from "./TestimonialsSection";
import CheckoutConsentModal, { type CheckoutOrderSummary } from "./CheckoutConsentModal";
import type { OneTimeCheckoutProduct } from "../lib/actions/billing";

interface MembershipViewProps {
  stats: UserStats;
  checkoutResult?: "cancelled" | null;
  onDismissCheckoutResult?: () => void;
  onBack?: () => void;
  onNavigateToTab?: (tabId: string) => void;
  testimonials?: Testimonial[];
  onSyncComplete?: (tier: UserStats["membershipTier"]) => void;
}

// "€52 one-time" -> "€52" — payment buttons need to state the amount, not
// repeat the "one-time" qualifier that already appears just above them.
function priceOnly(priceDisplay: string): string {
  return priceDisplay.replace(/\s*one-time$/i, "");
}

// Checkout order summary needs an actual description of what's included —
// tiers' first feature is sometimes just a lead-in ("Everything in Starter,
// plus:") with no content of its own, so skip those and take the next two
// real ones.
function summarizeFeatures(features: string[]): string {
  return features
    .filter((f) => !/plus:$/i.test(f.trim()))
    .slice(0, 2)
    .join("; ") || "Full access to this tier";
}

const TIER_ICONS: Record<TierId, React.ElementType> = {
  free: Gift,
  starter: Shield,
  professional: Zap,
  career_accelerator: Award,
};

const TIER_ACCENT: Record<TierId, { text: string; ring: string; badge: string; button: string }> = {
  free: {
    text: "text-slate-500 dark:text-slate-400",
    ring: "border-slate-100 dark:border-slate-850",
    badge: "bg-slate-500",
    button: "bg-slate-950 hover:bg-slate-850 text-white dark:bg-slate-800 dark:hover:bg-slate-750",
  },
  starter: {
    text: "text-slate-500 dark:text-slate-400",
    ring: "border-slate-100 dark:border-slate-850",
    badge: "bg-slate-500",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  professional: {
    text: "text-indigo-600 dark:text-indigo-400",
    ring: "border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600/10 dark:ring-indigo-500/10",
    badge: "bg-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  career_accelerator: {
    text: "text-amber-600 dark:text-amber-500",
    ring: "border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/10",
    badge: "bg-amber-500",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
};

// Starter is no longer sold — removed from the pricing grid entirely.
// "professional" is still sold, just re-branded as the "Self-Paced" tier
// (see lib/pricing.ts) — existing Professional-tier owners are unaffected
// since access gating keys off the tier id, not the display copy. Kept
// "starter" in TIER_ORDER itself (rather than filtered only here) would
// break index math for anyone still on that tier from before, so this
// filters only what renders, not the shared order used for index
// comparisons.
const VISIBLE_TIER_ORDER = TIER_ORDER.filter((id) => id !== "starter");

// Temporarily hidden per request — flip back to true to restore the
// 1-to-1 Coaching add-on card.
const SHOW_COACHING_OFFER = false;

export default function MembershipView({ stats, checkoutResult, onDismissCheckoutResult, onBack, testimonials, onSyncComplete }: MembershipViewProps) {
  const currentTier: TierId = stats.membershipTier || "free";
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setErrorMessage(null);
    setPendingAction(key);
    try {
      await action();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setPendingAction(null);
    }
  };

  // Every purchase button opens the consent modal rather than checking out
  // directly — German law requires express, logged consent to immediate
  // digital delivery (or early service start, for coaching) before the
  // checkout can proceed. See lib/checkout-consent.ts and
  // lib/actions/billing.ts's createOneTimeCheckout.
  interface PendingOrder {
    key: string;
    product: OneTimeCheckoutProduct;
    quantity: number;
    summary: CheckoutOrderSummary;
  }
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);

  const handleConfirmOrder = async () => {
    if (!pendingOrder) return;
    await runAction(pendingOrder.key, async () => {
      const result = await createOneTimeCheckout(pendingOrder.product, pendingOrder.quantity, {
        termsAccepted: true,
        secondConsentAccepted: true,
      });
      if (result?.error) throw new Error(result.error);
    });
    setPendingOrder(null);
  };

  const handleGetTier = (tier: "starter" | "professional") => {
    const meta = TIERS[tier];
    setPendingOrder({
      key: tier,
      product: tier,
      quantity: 1,
      summary: {
        productName: meta.displayName,
        priceDisplay: meta.priceDisplay,
        whatYouGet: summarizeFeatures(meta.features),
        product: tier,
      },
    });
  };

  const handleGetAccelerator = () => {
    const meta = TIERS.career_accelerator;
    setPendingOrder({
      key: "career_accelerator",
      product: "career_accelerator",
      quantity: 1,
      summary: {
        productName: meta.displayName,
        priceDisplay: meta.priceDisplay,
        whatYouGet: summarizeFeatures(meta.features),
        product: "career_accelerator",
      },
    });
  };

  const handleManageBilling = () =>
    runAction("manage", () => createPortalSession());

  // Self-serve fallback for when a payment went through on Stripe's side
  // but the webhook hasn't (yet) reflected it here — re-checks Stripe
  // directly rather than making the user wait on us to notice.
  const handleSyncPlan = async () => {
    setErrorMessage(null);
    setSyncMessage(null);
    setPendingAction("sync");
    try {
      const { membershipTier, syncedCount } = await syncMyPurchases();
      onSyncComplete?.(membershipTier);
      setSyncMessage(
        syncedCount > 0
          ? `Found and applied ${syncedCount} recent purchase${syncedCount === 1 ? "" : "s"}. You're now on the ${TIERS[membershipTier || "free"].label} plan.`
          : `No new purchases found. You're currently on the ${TIERS[membershipTier || "free"].label} plan.`,
      );
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Couldn't sync your plan. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  const [packQuantities, setPackQuantities] = useState<Record<string, number>>({});
  const getPackQuantity = (packId: string) => packQuantities[packId] ?? 1;
  const setPackQuantity = (packId: string, qty: number) =>
    setPackQuantities((prev) => ({ ...prev, [packId]: Math.min(20, Math.max(1, qty)) }));

  const handleBuyCreditPack = (packId: "credit_pack_a" | "credit_pack_b") => {
    const pack = CREDIT_PACKS.find((p) => p.id === packId)!;
    const qty = getPackQuantity(packId);
    const unitPrice = parseInt(pack.priceDisplay.replace(/\D/g, ""), 10) || 0;
    setPendingOrder({
      key: packId,
      product: packId,
      quantity: qty,
      summary: {
        productName: `${pack.priceDisplay} AI Interview Credit Pack`,
        priceDisplay: `€${unitPrice * qty}`,
        whatYouGet: `+${pack.sessions * qty} AI interview sessions, never expires`,
        product: packId,
      },
    });
  };

  const handleBookCoaching = () => {
    setPendingOrder({
      key: "coaching",
      product: "coaching",
      quantity: 1,
      summary: {
        productName: COACHING_OFFER.title,
        priceDisplay: COACHING_OFFER.priceDisplay,
        whatYouGet: COACHING_OFFER.sessionDetails,
        product: "coaching",
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in pb-24">

      {/* Back Header */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Career Hub
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSyncPlan}
            disabled={pendingAction !== null}
            title="Just paid and it's not showing yet? Re-check with Stripe."
            className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-50"
          >
            {pendingAction === "sync" ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            )}
            Sync My Plan
          </button>

          {currentTier === "career_accelerator" && (
            <button
              onClick={handleManageBilling}
              disabled={pendingAction !== null}
              className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-50"
            >
              {pendingAction === "manage" ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
              )}
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Notification Banners */}
      {syncMessage && (
        <div className="mb-8 p-4 bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-start gap-3 shadow-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold my-0 leading-tight">Plan Synced</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-relaxed">{syncMessage}</p>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer shrink-0">×</button>
        </div>
      )}
      {checkoutResult === "cancelled" && (
        <div className="mb-8 p-4 bg-slate-500/10 border-2 border-slate-500/20 text-slate-700 dark:text-slate-300 rounded-2xl flex items-start gap-3 shadow-md animate-fade-in">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold my-0 leading-tight">Checkout Cancelled</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-relaxed">No charge was made. You can try again anytime.</p>
          </div>
          <button onClick={onDismissCheckoutResult} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer shrink-0">×</button>
        </div>
      )}
      {errorMessage && (
        <div className="mb-8 p-4 bg-rose-500/10 border-2 border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-2xl flex items-start gap-3 shadow-md animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold my-0 leading-tight">Something Went Wrong</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-relaxed">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer shrink-0">×</button>
        </div>
      )}

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-mono">
          Empower Your AI Career
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Simple, One-Time Pricing
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Every plan is a one-time purchase — pay once, keep access forever. Career Accelerator is a 2-week
          intensive with live coaching and community support.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-16">
        {VISIBLE_TIER_ORDER.map((tierId) => {
          const meta = TIERS[tierId];
          const Icon = TIER_ICONS[tierId];
          const accent = TIER_ACCENT[tierId];
          const tierIndex = TIER_ORDER.indexOf(tierId);
          const isCurrent = tierId === currentTier;
          const isIncluded = tierIndex < currentIndex;
          const isPending = pendingAction === tierId;

          return (
            <div
              key={tierId}
              className={`bg-white dark:bg-slate-900 rounded-[28px] p-6 flex flex-col justify-between transition-all relative border-2 ${
                isCurrent ? accent.ring : "border-slate-100 dark:border-slate-850"
              } hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md`}
            >
              {tierId === "career_accelerator" && (
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-600 text-white text-[9px] uppercase font-mono font-black px-3 py-1 rounded-full tracking-widest shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Popular
                </div>
              )}
              {isCurrent && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 ${accent.badge} text-white text-[10px] uppercase font-mono font-extrabold px-3 py-1 rounded-full tracking-wider shadow-sm whitespace-nowrap`}>
                  Your Current Plan
                </span>
              )}

              <div className="space-y-5">
                <div>
                  <span className={`${accent.text} text-xs font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5`}>
                    <Icon className="w-3.5 h-3.5" /> {meta.label}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {meta.displayName}
                  </h3>
                  {meta.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {meta.description}
                    </p>
                  )}
                </div>

                <div className="py-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {meta.priceDisplay}
                  </span>
                  {tierId !== "free" && (
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
                      One-time purchase. No recurring subscription or automatic renewal.
                    </p>
                  )}
                </div>

                {tierId === "free" ? (
                  <div className="w-full py-3 px-4 rounded-xl text-xs font-bold text-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-550 border border-slate-200/50 dark:border-slate-800">
                    {isCurrent ? "Active Plan" : "Included automatically"}
                  </div>
                ) : tierId === "career_accelerator" ? (
                  <button
                    onClick={handleGetAccelerator}
                    disabled={isCurrent || pendingAction !== null}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer disabled:cursor-default flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900 cursor-default"
                        : `${accent.button} shadow-xs hover:shadow-md disabled:opacity-60`
                    }`}
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isCurrent ? "Active Plan" : `Order and Pay ${priceOnly(meta.priceDisplay)}`}
                  </button>
                ) : (
                  <button
                    onClick={() => handleGetTier(tierId as "starter" | "professional")}
                    disabled={isCurrent || isIncluded || pendingAction !== null}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer disabled:cursor-default flex items-center justify-center gap-2 ${
                      isCurrent || isIncluded
                        ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-550 border border-slate-200/50 dark:border-slate-800 cursor-default"
                        : `${accent.button} shadow-xs hover:shadow-md disabled:opacity-60`
                    }`}
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isCurrent ? "Active Plan" : isIncluded ? "Included" : `Order and Pay ${priceOnly(meta.priceDisplay)}`}
                  </button>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {meta.featuresIntro && (
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{meta.featuresIntro}</p>
                  )}
                  <ul className="space-y-2.5">
                    {meta.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  {meta.callToAction && (
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{meta.callToAction}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social proof, directly under the pricing cards */}
      <TestimonialsSection testimonials={testimonials ?? []} />

      {/* AI Credit Top-Up Packs */}
      {currentTier !== "free" && (
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 sm:p-8 border border-slate-150 dark:border-slate-850 mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0 mb-1 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            AI Interview Credit Top-Ups
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Out of interview sessions before your monthly allotment resets? Top up with extra credits that never expire.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREDIT_PACKS.map((pack) => {
              const qty = getPackQuantity(pack.id);
              const unitPrice = parseInt(pack.priceDisplay.replace(/\D/g, ""), 10) || 0;
              return (
                <div key={pack.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-850 dark:text-white my-0">+{pack.sessions * qty} sessions</p>
                    <p className="text-xs text-slate-450 dark:text-slate-400 my-0">Never expires</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPackQuantity(pack.id, qty - 1)}
                        disabled={qty <= 1}
                        className="w-6 h-7 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setPackQuantity(pack.id, qty + 1)}
                        disabled={qty >= 20}
                        className="w-6 h-7 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleBuyCreditPack(pack.id)}
                      disabled={pendingAction !== null}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                    >
                      {pendingAction === pack.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Order and Pay &euro;{unitPrice * qty}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1-to-1 Coaching add-on — a paid service, not a membership tier;
          available to everyone regardless of current plan.
          Temporarily hidden per request — flip SHOW_COACHING_OFFER back on
          to restore it, nothing else needs to change. */}
      {SHOW_COACHING_OFFER && (
      <div className="relative bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/10 dark:to-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-amber-200 dark:border-amber-900/40 mb-8 overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              <Users className="w-3 h-3" /> 1-to-1 Coaching
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {COACHING_OFFER.tagline}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              {COACHING_OFFER.sessionDetails}
            </p>
            <ul className="space-y-2 pt-1">
              {COACHING_OFFER.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 pt-2">
              {COACHING_OFFER.disclaimer}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-amber-150 dark:border-amber-900/30 shadow-xs">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{COACHING_OFFER.priceDisplay}</span>
            <button
              onClick={handleBookCoaching}
              disabled={pendingAction !== null}
              className="w-full px-5 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              {pendingAction === "coaching" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Order and Pay {COACHING_OFFER.priceDisplay}
            </button>
          </div>
        </div>
      </div>
      )}

      {pendingOrder && (
        <CheckoutConsentModal
          order={pendingOrder.summary}
          isSubmitting={pendingAction === pendingOrder.key}
          onCancel={() => setPendingOrder(null)}
          onConfirm={handleConfirmOrder}
        />
      )}
    </div>
  );
}
