// Single source of truth for Real World Practice domains — used by the
// admin practice-task form, the sidebar, and the level-selection modal so
// they can't drift out of sync with each other or the DB check constraint
// (supabase/migrations/0027_practice_task_domain.sql).
//
// Only Generalist has content yet — the rest are listed per the product
// spec but marked comingSoon so they show in the sidebar without being
// clickable. Launching a new domain later is just flipping its flag here
// once an admin has tagged practice tasks with it.
export const PRACTICE_DOMAINS = [
  { id: "generalist", label: "Generalist", comingSoon: false },
  { id: "coding_engineering", label: "Coding & Engineering", comingSoon: false },
  { id: "stem", label: "STEM Skills Challenge", comingSoon: true },
  { id: "cybersecurity", label: "Cybersecurity", comingSoon: true },
  { id: "finance_accounting", label: "Finance & Accounting", comingSoon: true },
  { id: "law_legal", label: "Law & Legal", comingSoon: true },
  { id: "nursing", label: "Nursing", comingSoon: true },
  { id: "medicine", label: "Medicine", comingSoon: true },
  { id: "data_science", label: "Data Science & Analytics", comingSoon: true },
  { id: "writing_humanities", label: "Writing & Humanities", comingSoon: true },
] as const;

export type PracticeDomainId = (typeof PRACTICE_DOMAINS)[number]["id"];

export function getPracticeDomainLabel(id: string): string {
  return PRACTICE_DOMAINS.find((d) => d.id === id)?.label ?? id;
}
