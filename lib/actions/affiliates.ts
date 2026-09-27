"use server";

import { createClient } from "@/lib/supabase/server";
import { AFFILIATE_TERMS_VERSION } from "@/lib/affiliate-terms";

export type AffiliateReferralStatus = "pending" | "approved" | "paid" | "reversed" | "cancelled";

export interface AffiliateStatus {
  code: string;
  commissionRate: number;
  status: "pending" | "active" | "disabled";
}

export interface AffiliateReferral {
  id: string;
  productType: string | null;
  saleAmountCents: number;
  commissionCents: number;
  currency: string;
  status: AffiliateReferralStatus;
  createdAt: string;
}

export interface AffiliateReferralSummary {
  referrals: AffiliateReferral[];
  pendingCommissionCents: number;
  paidCommissionCents: number;
}

function generateCode(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function getMyAffiliateStatus(): Promise<AffiliateStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("affiliates")
    .select("code, commission_rate, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return { code: data.code, commissionRate: data.commission_rate, status: data.status };
}

// The program isn't self-serve — only Career Accelerator members can
// request to join, and a request lands as 'pending' until an admin
// approves it (see app/admin/affiliates). This check is the real gate;
// hiding the nav entry for ineligible users is just UI, not enforcement.
export async function becomeAffiliate(
  termsAccepted: boolean,
): Promise<{ error?: string; code?: string; status?: AffiliateStatus["status"] }> {
  if (!termsAccepted) {
    return { error: "You must accept the Affiliate Program Terms to join." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const existing = await getMyAffiliateStatus();
  if (existing) return { code: existing.code, status: existing.status };

  const { data: profile } = await supabase
    .from("profiles")
    .select("membership_tier, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin) {
    return { error: "Admin accounts can't join the Affiliate Program." };
  }
  if (profile?.membership_tier !== "career_accelerator") {
    return { error: "The Affiliate Program is currently available to Career Accelerator members only." };
  }

  const acceptedAt = new Date().toISOString();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await supabase.from("affiliates").insert({
      user_id: user.id,
      code,
      status: "pending",
      terms_accepted_at: acceptedAt,
      terms_version: AFFILIATE_TERMS_VERSION,
    });
    if (!error) return { code, status: "pending" };
    if (error.code !== "23505") return { error: error.message };
    // Unique violation on the generated code — regenerate and retry.
  }

  return { error: "Could not generate a unique referral code. Please try again." };
}

export async function getMyReferralSummary(): Promise<AffiliateReferralSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { referrals: [], pendingCommissionCents: 0, paidCommissionCents: 0 };

  const { data } = await supabase
    .from("affiliate_referrals")
    .select("id, product_type, sale_amount_cents, commission_cents, currency, status, created_at")
    .eq("affiliate_user_id", user.id)
    .order("created_at", { ascending: false });

  const referrals: AffiliateReferral[] = (data ?? []).map((r) => ({
    id: r.id,
    productType: r.product_type,
    saleAmountCents: r.sale_amount_cents,
    commissionCents: r.commission_cents,
    currency: r.currency,
    status: r.status,
    createdAt: r.created_at,
  }));

  return {
    referrals,
    // "Approved" still shows as Pending to the affiliate — it means the
    // sale is confirmed and queued for the next payout, not that it's been
    // paid yet. Reversed/cancelled commissions are voided and excluded
    // from both totals entirely.
    pendingCommissionCents: referrals
      .filter((r) => r.status === "pending" || r.status === "approved")
      .reduce((sum, r) => sum + r.commissionCents, 0),
    paidCommissionCents: referrals
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + r.commissionCents, 0),
  };
}
