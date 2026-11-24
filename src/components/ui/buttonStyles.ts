/**
 * The one look for buttons on this site.
 *
 * Every button, and every link drawn as a button, takes its classes from here,
 * so they cannot drift apart again. The look is the one the staff sidebar
 * has always had: a frosted-glass pill with a pale border and bold, dark amber
 * text, in the Nunito face. Labels are written in ordinary case ("Archive"),
 * as the sidebar's are.
 *
 * Tones:
 *   glass    – the default, for anything sitting on the amber page or on a
 *              frosted card.
 *   solid    – the same pill for a WHITE surface (the pop-up forms), where
 *              frosted glass would be white on white. It is filled with the
 *              pale amber that glass shows as on the page.
 *   selected – the current tab or choice in a row of glass buttons.
 *   danger   – deleting, removing access, signing out: the same shape in red,
 *              so the one button that cannot be undone never looks like the
 *              others.
 *
 * Sizes: `sm` for an action inside a card or a line of text, `md` for most
 * buttons, `lg` for the main action of a page or form. `block` makes the
 * button as wide as its container, as the sidebar's are.
 *
 * Margins and placement (`my-2`, `mx-auto`, `mt-4`...) are not set here: add
 * them beside the call. Do not add colour, border, radius, padding or font
 * classes beside it: two classes for the same thing fight, and which one wins
 * depends on the order of the stylesheet, not on the order they are written.
 */
export type ButtonTone = "glass" | "solid" | "selected" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const SHAPE =
  "inline-flex items-center justify-center gap-2 rounded-3xl border font-nunito font-bold text-center shadow-sm transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const TONE: Record<ButtonTone, string> = {
  glass: "bg-white/30 backdrop-blur-md border-white/50 text-amber-950 hover:bg-white/45 hover:border-white/70",
  solid: "bg-amber-100 border-amber-300 text-amber-950 hover:bg-amber-200 hover:border-amber-400",
  selected: "bg-white/60 backdrop-blur-md border-white/90 text-amber-950",
  danger: "bg-red-600/90 backdrop-blur-md border-red-300/60 text-white hover:bg-red-500/90 hover:border-red-200/70",
};

const TEXT: Record<ButtonSize, string> = {
  sm: "py-1.5 text-sm",
  md: "py-2 text-base",
  lg: "py-2 text-lg",
};

const SIDES: Record<ButtonSize, string> = {
  sm: "px-3",
  md: "px-4",
  lg: "px-5",
};

export function buttonClass({
  tone = "glass",
  size = "md",
  block = false,
}: { tone?: ButtonTone; size?: ButtonSize; block?: boolean } = {}): string {
  // A full-width button needs no more than a little room at its sides: its
  // label is centred, and a long one should not wrap sooner than it must.
  return `${SHAPE} ${TONE[tone]} ${TEXT[size]} ${block ? "w-full px-2" : SIDES[size]}`;
}

/** The default button. */
export const BUTTON = buttonClass();
/** For an action inside a card or beside a line of text. */
export const BUTTON_SM = buttonClass({ size: "sm" });
/** For the main action of a page. */
export const BUTTON_LG = buttonClass({ size: "lg" });
/** As wide as its container: the sidebar's links, a form's submit button. */
export const BUTTON_BLOCK = buttonClass({ size: "lg", block: true });

/** Deleting, removing access, signing out. */
export const BUTTON_DANGER = buttonClass({ tone: "danger" });
export const BUTTON_DANGER_SM = buttonClass({ tone: "danger", size: "sm" });

/** The same buttons for a white surface, such as a pop-up form. */
export const BUTTON_SOLID = buttonClass({ tone: "solid" });
export const BUTTON_SOLID_SM = buttonClass({ tone: "solid", size: "sm" });
export const BUTTON_SOLID_BLOCK = buttonClass({ tone: "solid", size: "lg", block: true });
