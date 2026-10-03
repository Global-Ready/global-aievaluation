// Single source of truth for tier/pricing copy — imported by MembershipView
// and every scattered upgrade CTA so they can't drift out of sync with each
// other or with the actual Stripe products.

export type TierId = "free" | "starter" | "professional" | "career_accelerator";

export interface TierMeta {
  id: TierId;
  label: string; // short badge/nav text, e.g. "Starter"
  displayName: string; // marketing name, e.g. "Independent Learner"
  priceDisplay: string; // e.g. "€20 one-time"
  billing: "free" | "one_time" | "subscription";
  description?: string;
  featuresIntro?: string;
  features: string[];
  callToAction?: string;
}

export const TIERS: Record<TierId, TierMeta> = {
  free: {
    id: "free",
    label: "Free",
    displayName: "Free",
    priceDisplay: "€0",
    billing: "free",
    features: [
      "Module 1: what AI evaluation is and why it matters",
      "Curated job board — open to everyone, no signup required",
    ],
  },
  starter: {
    id: "starter",
    label: "Starter",
    displayName: "Independent Learner",
    priceDisplay: "€20 one-time",
    billing: "one_time",
    features: [
      "Full access to the AI Evaluation Academy",
      "Curated job board access",
      "Unlimited practice exercises",
      "AI Interview Simulator — 10 sessions included",
      "Progress tracking",
      "Updated lessons and assessment tips at no extra cost",
    ],
  },
  professional: {
    id: "professional",
    label: "Professional",
    displayName: "Job Ready Simulator",
    priceDisplay: "€52 one-time",
    billing: "one_time",
    features: [
      "Everything in Starter, plus:",
      "Full task-simulation bank (real-platform-style tasking exercises)",
      "AI Interview Simulator — 30 sessions/month, resets monthly",
      "Platform-specific interview simulations",
      "Adaptive, scenario-based interview questions",
      "AI Interview Report + Interview Readiness Score",
    ],
  },
  career_accelerator: {
    id: "career_accelerator",
    label: "Accelerator",
    displayName: "Become Job-Ready for AI Training Opportunities",
    priceDisplay: "€149 one-time",
    billing: "one_time",
    description:
      "Join our two-week practical programme designed to help you prepare for AI evaluation and data annotation opportunities.",
    featuresIntro: "For a one-time payment of €149, you get:",
    callToAction: "Join the next cohort and start preparing for AI training opportunities.",
    features: [
      "Four live training and support sessions",
      "Guidance to register on suitable AI training platforms",
      "CV and LinkedIn profile optimisation",
      "Practical assessment preparation",
      "Community access",
      "Direct access to ask questions and receive support",
      "No coding experience is required",
    ],
  },
};

export const TIER_ORDER: TierId[] = ["free", "starter", "professional", "career_accelerator"];

export interface CreditPack {
  id: "credit_pack_a" | "credit_pack_b";
  priceDisplay: string;
  sessions: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "credit_pack_a", priceDisplay: "€5", sessions: 15 },
  { id: "credit_pack_b", priceDisplay: "€10", sessions: 35 },
];

// A one-off paid add-on, not a membership tier — doesn't gate any in-app
// feature or change membership_tier, it just records a purchase (see
// "coaching_session" in lib/stripe.ts / lib/actions/billing.ts). Available
// to any user regardless of their current tier.
export interface CoachingOffer {
  id: "coaching";
  title: string;
  tagline: string;
  priceDisplay: string;
  sessionDetails: string;
  features: string[];
  disclaimer: string;
}

export const COACHING_OFFER: CoachingOffer = {
  id: "coaching",
  title: "1-to-1 Coaching",
  tagline: "Just Got Your Mercor Offer? Stuck On The Task?",
  priceDisplay: "€120",
  sessionDetails:
    "2 hours with me, one-to-one, plus 14 days on WhatsApp. Limited slots each week.",
  features: [
    "You got the offer but don't know where to start. We get on a call and I walk you through it, step by step, on your actual task.",
    "The guide doesn't make sense. We read it together and I show you what it is really asking, so you stop guessing.",
    "You are scared of doing it wrong and losing it. I show you what a passing task actually looks like, so you submit with confidence.",
    "You have no one to ask. For 14 days after, I am on WhatsApp while you work. Send me a screenshot and I will tell you if you are on track.",
    "From someone actually doing this. I task on Mercor right now, so this is real experience, not theory.",
    "If it does not help, you do not pay. Full refund if you still cannot make sense of your guide by the end of the session.",
  ],
  disclaimer:
    "Independent coaching. Not affiliated with, endorsed by, or acting on behalf of Mercor or Outlier.",
};
