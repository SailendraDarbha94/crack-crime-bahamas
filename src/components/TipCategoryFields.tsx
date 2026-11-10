"use client";
import {
  MAX_CATEGORY_OTHER_LENGTH,
  OTHER_CATEGORY_ID,
  TIP_CATEGORIES,
} from "@/lib/tipCategories";

type Props = {
  /** Keeps ids unique when more than one of these is on a page. */
  idPrefix: string;
  category: string;
  other: string;
  onCategory: (id: string) => void;
  onOther: (text: string) => void;
  /** Which of the two fields the form was submitted without, if either. */
  missing?: "category" | "other" | null;
  disabled?: boolean;
  /** Smaller type and spacing, for the admin pages. */
  compact?: boolean;
};

/**
 * The type-of-crime combo box, and the description that goes with "Other".
 * Shared by the public tip form and the admin call-in form so both offer the
 * same list and the same rules.
 *
 * The fields are compulsory, but that is enforced by the form (see
 * missingCategoryField) and reported through `missing`, not by the browser's
 * own `required` bubbles: put `noValidate` on the surrounding <form>.
 */
const TipCategoryFields = ({
  idPrefix,
  category,
  other,
  onCategory,
  onOther,
  missing = null,
  disabled = false,
  compact = false,
}: Props) => {
  const selectId = `${idPrefix}-category`;
  const otherId = `${idPrefix}-category-other`;
  const errorId = `${idPrefix}-category-error`;

  const labelClass = compact ? "text-sm font-bold text-amber-950" : "font-semibold text-amber-950";
  const fieldBase = compact
    ? "w-full rounded-lg bg-white/50 border px-3 py-2 text-sm placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:opacity-60"
    : "w-full rounded-xl bg-white/40 backdrop-blur-md border px-4 py-3 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:opacity-60";
  const border = (bad: boolean) => (bad ? "border-red-600" : "border-white/60");

  return (
    <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
      <label htmlFor={selectId} className={labelClass}>
        Type of crime
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={category}
          onChange={(e) => onCategory(e.target.value)}
          disabled={disabled}
          aria-required="true"
          aria-invalid={missing === "category"}
          aria-describedby={missing ? errorId : undefined}
          className={`${fieldBase} ${border(missing === "category")} ${category ? "text-amber-950" : "text-amber-900/60"} appearance-none pr-10 cursor-pointer`}
        >
          <option value="" disabled>
            Choose the type of crime
          </option>
          {TIP_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id} className="text-amber-950">
              {c.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-900"
        >
          <path d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" />
        </svg>
      </div>

      {category === OTHER_CATEGORY_ID ? (
        <>
          <label htmlFor={otherId} className={labelClass}>
            Please describe the type of crime
          </label>
          <input
            id={otherId}
            type="text"
            value={other}
            onChange={(e) => onOther(e.target.value)}
            disabled={disabled}
            aria-required="true"
            maxLength={MAX_CATEGORY_OTHER_LENGTH}
            autoComplete="off"
            placeholder="For example: arson"
            aria-invalid={missing === "other"}
            aria-describedby={missing ? errorId : undefined}
            className={`${fieldBase} ${border(missing === "other")} text-amber-950`}
          />
        </>
      ) : null}

      {missing ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-red-800">
          {missing === "category"
            ? "Please choose the type of crime."
            : "Please describe the type of crime."}
        </p>
      ) : null}
    </div>
  );
};

export default TipCategoryFields;
