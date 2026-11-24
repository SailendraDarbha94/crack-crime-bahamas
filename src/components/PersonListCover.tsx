import { BUTTON } from "@/components/ui/buttonStyles";

/**
 * What Manage Missings and Manage Wanteds show until the list is opened.
 *
 * Each page starts with its list closed, which used to leave nothing under
 * the two buttons. This fills that space with the picture the dashboard uses
 * for the same section, how many people are listed (the page has already
 * loaded the list by then), and a line saying what the buttons do. It goes
 * away as soon as the list is shown.
 */
export default function PersonListCover({
  image,
  kind,
  count,
  loading,
  error,
  onRetry,
  showLabel,
  addLabel,
}: {
  /** The dashboard's picture for this section, under /thumbnails. */
  image: string;
  kind: "missing" | "wanted";
  /** How many people are listed. Only meaningful when not loading and no error. */
  count: number;
  loading: boolean;
  /** Why the list could not be loaded, or null. */
  error: string | null;
  onRetry: () => void;
  /** The names on the page's two buttons, so the hint matches them word for word. */
  showLabel: string;
  addLabel: string;
}) {
  const people = count === 1 ? `${kind} person` : `${kind} persons`;

  return (
    <section className="max-w-xl mx-auto bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 text-center text-amber-950 shadow-[0_4px_16px_rgba(120,72,10,0.12)]">
      {/* Decorative: the words below say everything the picture does. */}
      <img
        src={image}
        alt=""
        width={800}
        height={600}
        className="w-full max-w-sm h-auto mx-auto rounded-3xl"
      />

      {loading ? (
        <p className="mt-4 text-xl font-bold text-amber-900/80">Loading the list…</p>
      ) : error ? (
        <>
          <p className="mt-4 text-xl font-bold">The list could not be loaded</p>
          <p className="text-sm text-amber-900/80 mb-3">
            That does not mean nobody is listed. Check your connection and try again.
          </p>
          <button type="button" onClick={onRetry} className={BUTTON}>
            Try again
          </button>
        </>
      ) : (
        <p className="mt-4 text-xl font-bold">
          {count === 0 ? `No ${people} listed` : `${count} ${people} listed`}
        </p>
      )}

      <p className="mt-2 text-sm text-amber-900/80">
        Use <span className="font-bold">{showLabel}</span> to see the list and edit, archive or
        delete someone, or <span className="font-bold">{addLabel}</span> to list someone new.
      </p>
    </section>
  );
}
