import { categoryLabel, OTHER_CATEGORY_ID, SOURCE_LABELS } from "@/lib/tipCategories";
import type { TipLabelData } from "@/lib/tipLabels";

const SOURCE_HINTS = {
  text: "Sent from the mobile app",
  web: "Sent from the tip form on the website",
  call: "Phoned in and typed up by Crime Stoppers staff",
} as const;

/**
 * The type of crime and the source of a tip, as two small chips. Shown the
 * same way in the inbox, the archive and the police portal.
 */
const TipLabels = ({ labels, className = "" }: { labels: TipLabelData; className?: string }) => {
  const { category, categoryOther, source } = labels;
  // max-w-full + anywhere-wrapping: a tipster's "Other" description can be one
  // long unbroken word, and it must wrap inside the card rather than widen it.
  const chip = "inline-flex items-baseline gap-1.5 max-w-full rounded-lg border px-2.5 py-1 text-xs font-nunito";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {category ? (
        <span className={`${chip} bg-white/50 border-white/70 text-amber-950`}>
          <span className="uppercase tracking-wide text-amber-900/70 shrink-0">Type</span>
          <span className="font-bold min-w-0 [overflow-wrap:anywhere]">
            {categoryLabel(category)}
            {category === OTHER_CATEGORY_ID && categoryOther ? `: ${categoryOther}` : ""}
          </span>
        </span>
      ) : (
        <span
          className={`${chip} bg-white/25 border-white/50 text-amber-900/70 italic`}
          title="Sent before the type of crime was asked for, or from an app version that does not ask"
        >
          Type not specified
        </span>
      )}
      {source ? (
        <span className={`${chip} bg-white/50 border-white/70 text-amber-950`} title={SOURCE_HINTS[source]}>
          <span className="uppercase tracking-wide text-amber-900/70">Source</span>
          <span className="font-bold">{SOURCE_LABELS[source]}</span>
        </span>
      ) : (
        <span
          className={`${chip} bg-white/25 border-white/50 text-amber-900/70 italic`}
          title="Stored before the source of a tip was recorded"
        >
          Source not recorded
        </span>
      )}
    </div>
  );
};

export default TipLabels;
