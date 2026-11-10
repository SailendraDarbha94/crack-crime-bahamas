/**
 * The type-of-crime list a tipster chooses from, and the record of how a tip
 * reached us. Both exist so the organisation can analyse tips without reading
 * them: the category and the source are stored in the clear beside the
 * encrypted tip.
 *
 * No imports, so the intake route, the web form, the admin pages and the unit
 * tests all share this one copy. The mobile app loads the list at runtime from
 * /api/tip-categories (with a bundled fallback), so changing the list here
 * reaches the app without a store release.
 *
 * Ids are what is stored and counted. Never change or reuse an id; to rename a
 * category change its label, and to retire one remove it from the list (tips
 * already filed under it keep showing, see `categoryLabel`). Ids must stay
 * lowercase letters and underscores: the database rules refuse anything else.
 */

export type TipCategory = { id: string; label: string };

export const OTHER_CATEGORY_ID = "other";

export const TIP_CATEGORIES: readonly TipCategory[] = [
  { id: "auto_theft", label: "Auto Theft" },
  { id: "home_theft", label: "Home Theft" },
  { id: "business_theft", label: "Business Theft" },
  { id: "marine_theft", label: "Marine Theft" },
  { id: "illegal_drugs", label: "Illegal Drugs" },
  { id: "illegal_guns", label: "Illegal Guns" },
  { id: "violence_against_women", label: "Violence Against Women" },
  { id: "white_collar_crime", label: "White Collar Crime" },
  { id: "human_trafficking", label: "Human Trafficking" },
  { id: "human_smuggling", label: "Human Smuggling" },
  { id: "homicide", label: "Homicide" },
  { id: OTHER_CATEGORY_ID, label: "Other" },
];

/** Longest description accepted for "Other". */
export const MAX_CATEGORY_OTHER_LENGTH = 100;

/**
 * The text with any lone surrogate (half of an emoji, left behind by a cut or a
 * broken keyboard) replaced by the Unicode replacement character. The cipher
 * throws on such a string, and a tip must never be lost over one stray
 * character. Written without a lookbehind regex because this module is also
 * bundled for browsers, and older Safari cannot parse one.
 */
export function wellFormedText(text: string): string {
  return Array.from(text) // by code point: a lone surrogate comes out on its own
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return ch.length === 1 && code >= 0xd800 && code <= 0xdfff ? "\uFFFD" : ch;
    })
    .join("");
}

export const isKnownCategory = (id: unknown): id is string =>
  typeof id === "string" && TIP_CATEGORIES.some((c) => c.id === id);

/**
 * What to store for the category a client sent.
 *
 * Deliberately forgiving: it returns nothing for a missing or unrecognised
 * category instead of failing, because app versions released before the list
 * existed send none, and a tip must never be lost over its label. The forms
 * are what make choosing one compulsory.
 *
 * The "Other" description is free text typed by the tipster, so the caller
 * encrypts it like the tip itself.
 */
export function normaliseCategory(
  category: unknown,
  other: unknown
): { category?: string; categoryOther?: string } {
  if (!isKnownCategory(category)) return {};
  if (category !== OTHER_CATEGORY_ID) return { category };
  // Cut by character, not by UTF-16 unit, so an emoji at the limit is kept or
  // dropped whole rather than split in two.
  const description =
    typeof other === "string"
      ? Array.from(wellFormedText(other.trim())).slice(0, MAX_CATEGORY_OTHER_LENGTH).join("").trim()
      : "";
  return description ? { category, categoryOther: description } : { category };
}

/**
 * What a form still needs before a tip can be sent: a category, and a short
 * description when the category is "Other". The forms use this to make the
 * choice compulsory; the intake route stays forgiving (see normaliseCategory).
 */
export function missingCategoryField(category: unknown, other: unknown): "category" | "other" | null {
  if (!isKnownCategory(category)) return "category";
  if (category === OTHER_CATEGORY_ID && !(typeof other === "string" && other.trim())) return "other";
  return null;
}

/** Label for a stored category id. */
export function categoryLabel(id: unknown): string {
  if (typeof id !== "string" || !id) return "Not specified";
  const known = TIP_CATEGORIES.find((c) => c.id === id);
  if (known) return known.label;
  // A category retired from the list since the tip was filed: show its id as
  // words rather than hiding what the tipster chose.
  return id
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * How a tip reached us.
 *   text – sent from the mobile app's "Text a Tip" screen
 *   web  – typed into the tip form on the website
 *   call – phoned in and typed up by Crime Stoppers staff
 */
export type TipSource = "text" | "web" | "call";

export const TIP_SOURCES: readonly TipSource[] = ["text", "web", "call"];

export const SOURCE_LABELS: Record<TipSource, string> = {
  text: "Text",
  web: "Web",
  call: "Call",
};

/**
 * The source recorded on a stored tip, or null when none was. Tips stored
 * before the flag existed have none, and it cannot be worked out afterwards
 * (most came from the app, but the website has had a tip form before), so
 * they are shown as "not recorded" rather than guessed at.
 */
export function sourceOf(stored: unknown): TipSource | null {
  return stored === "text" || stored === "web" || stored === "call" ? stored : null;
}


/**
 * The label fields exactly as stored on a tip, for copying onto the police
 * copy of it. Only values the police-copy rules accept are returned, so a
 * tip carrying something unexpected can still be forwarded without its label
 * rather than being refused.
 */
export function storedLabelFields(stored: unknown): Record<string, string> {
  const tip = (stored ?? {}) as Record<string, unknown>;
  const fields: Record<string, string> = {};
  if (typeof tip.category === "string" && /^[a-z_]{1,40}$/.test(tip.category)) {
    fields.category = tip.category;
    const other = tip.category_other;
    if (tip.category === OTHER_CATEGORY_ID && typeof other === "string" && other.length > 0 && other.length <= 1000) {
      fields.category_other = other;
    }
  }
  if (tip.source === "text" || tip.source === "web" || tip.source === "call") fields.source = tip.source;
  return fields;
}
