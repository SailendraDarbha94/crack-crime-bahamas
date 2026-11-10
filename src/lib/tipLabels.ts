/**
 * Reading a tip's category and source in the browser, for the pages that list
 * tips (inbox, archive, police portal). Kept apart from tipCategories.ts,
 * which has no imports, because this needs the tip cipher.
 */
import { OTHER_CATEGORY_ID, sourceOf, type TipSource } from "./tipCategories";
import { readTipText } from "./tipCrypto";

export type TipLabelData = {
  /** Stored category id, or null for a tip filed without one (older app versions). */
  category: string | null;
  /** What the tipster typed for "Other", decrypted; empty otherwise. */
  categoryOther: string;
  /** How the tip reached us, or null for a tip stored before that was recorded. */
  source: TipSource | null;
};

/** The labels on a stored tip or police copy, ready to show. */
export function readTipLabels(stored: unknown): TipLabelData {
  const tip = (stored ?? {}) as Record<string, unknown>;
  const category = typeof tip.category === "string" && tip.category ? tip.category : null;
  const categoryOther =
    category === OTHER_CATEGORY_ID && typeof tip.category_other === "string" && tip.category_other
      ? readTipText({ message: tip.category_other, encrypted: true }, "")
      : "";
  return { category, categoryOther, source: sourceOf(tip.source) };
}
