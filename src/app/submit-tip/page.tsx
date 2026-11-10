"use client";

import TipCategoryFields from "@/components/TipCategoryFields";
import { fullLoadTarget, isSamePageLink } from "@/lib/analyticsPolicy";
import { missingCategoryField } from "@/lib/tipCategories";
import { useEffect, useRef, useState } from "react";

// The public tip form: the website's counterpart to "Text a Tip" in the app.
// It posts to the same intake route, which encrypts what was written, stores
// it with the type of crime and the date and time, and answers with the tip's
// PIN. The tip is marked as having come from the web.
//
// What the page tells the public must stay in step with the privacy policy:
// it promises who can read a tip, not the strength of the cipher (the type of
// crime is stored as a plain label, and the cipher's key ships with the site).
//
// This page never runs Google Analytics (see lib/analyticsPolicy.ts), and its
// layout asks browsers not to pass its address on as a referrer.

const MAX_TIP_LENGTH = 10000;
const FAILURE = "Your tip could not be sent. Please check your connection and try again.";

type Missing = "category" | "other" | "tip" | null;

const SubmitTipPage = () => {
  const [category, setCategory] = useState<string>("");
  const [other, setOther] = useState<string>("");
  const [tip, setTip] = useState<string>("");
  const [missing, setMissing] = useState<Missing>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{ pin: string; threaded: boolean } | null>(null);
  const tipRef = useRef<HTMLTextAreaElement>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);

  // Every same-site link on this page (menu, footer) leaves by a full page
  // load instead of a client-side navigation, so no other page ever shares
  // this page's document. See analyticsPolicy.ts for why that matters. The
  // listener sits on the document in the capture phase, ahead of the handlers
  // next/link attaches, and stops the click before they see it.
  useEffect(() => {
    const leaveByFullLoad = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const link = { href: anchor.href, target: anchor.target, download: anchor.hasAttribute("download") };
      const click = { button: e.button, modified: e.metaKey || e.ctrlKey || e.shiftKey || e.altKey };
      const here = { origin: window.location.origin, pathname: window.location.pathname };
      // "Submit a Tip" in the menu or footer, pressed while already here: a
      // plain link to this address would reload the page and throw away
      // whatever has been typed. Go to the top of the form instead.
      if (isSamePageLink(link, click, here)) {
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo({ top: 0 });
        return;
      }
      const target = fullLoadTarget(link, click, here);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.assign(target);
    };
    document.addEventListener("click", leaveByFullLoad, true);
    return () => document.removeEventListener("click", leaveByFullLoad, true);
  }, []);

  // The form is replaced by the result, which takes the focused button with
  // it. Move focus to the confirmation so keyboard and screen-reader users
  // are told the tip went through and hear the PIN.
  useEffect(() => {
    if (result) thanksRef.current?.focus();
  }, [result]);

  const submitTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // The type of crime comes first, then the tip itself.
    const missingField = missingCategoryField(category, other);
    if (missingField) {
      setMissing(missingField);
      document.getElementById(missingField === "category" ? "tip-category" : "tip-category-other")?.focus();
      return;
    }
    if (!tip.trim()) {
      setMissing("tip");
      tipRef.current?.focus();
      return;
    }
    setMissing(null);

    setLoading(true);
    try {
      // The server encrypts the tip before storing it.
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: tip.trim(),
          category,
          category_other: other.trim() || undefined,
          source: "web",
        }),
      });
      const body = await res.json().catch(() => null);
      const pin = body?.data;
      if (res.ok && typeof pin === "string" && pin && pin !== "request failure") {
        // Only now is it safe to clear what the tipster typed.
        setTip("");
        setCategory("");
        setOther("");
        setResult({ pin, threaded: body.threaded === true });
        window.scrollTo({ top: 0 });
      } else {
        setError(FAILURE);
      }
    } catch (err) {
      console.error(err);
      setError(FAILURE);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-20 font-nunito">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-center text-amber-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.55)] mb-3">
          Submit an Anonymous Tip
        </h1>
        <p className="text-center text-amber-900/80 mb-8">
          We never ask who you are. Your tip is sent over an encrypted
          connection and can be read only by Crime Stoppers and the police it
          is passed to. If you prefer to call, dial{" "}
          <a href="tel:+12423288477" className="font-bold text-amber-950 underline">
            328-TIPS (8477)
          </a>
          . In an emergency call 919 or 911.
        </p>

        <div className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
          {result ? (
            <div className="text-center py-8">
              <h2 ref={thanksRef} tabIndex={-1} className="text-2xl font-bold text-amber-950 mb-2 focus:outline-none">
                Thank you.
              </h2>
              <p className="text-amber-900/80 mb-6">
                {result.threaded
                  ? "Your message has been added to your earlier tip, anonymously and securely."
                  : "Your tip has been received anonymously and securely. You are helping keep the community safe."}
              </p>

              <div className="mx-auto max-w-sm bg-white/40 border border-white/60 rounded-2xl px-6 py-5 mb-6">
                <p className="font-semibold text-sm uppercase tracking-wide text-amber-900/70 mb-1">
                  Your tip PIN
                </p>
                <p className="font-mono font-extrabold text-3xl tracking-[0.3em] text-amber-950">
                  {result.pin}
                </p>
                <p className="text-sm text-amber-900/80 mt-3">
                  For all further communication on this tip please start your
                  message with the pin <span className="font-bold text-amber-950">{result.pin}</span>
                </p>
              </div>

              <p className="text-sm text-amber-900/80 mb-6">
                Write the PIN down and keep it private. We cannot give it to you again.
              </p>

              <button
                onClick={() => setResult(null)}
                className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
              >
                Submit another tip
              </button>
            </div>
          ) : (
            <form onSubmit={submitTip} noValidate className="flex flex-col gap-4">
              <TipCategoryFields
                idPrefix="tip"
                category={category}
                other={other}
                onCategory={(id) => {
                  setCategory(id);
                  if (missing === "category" || missing === "other") setMissing(null);
                }}
                onOther={(text) => {
                  setOther(text);
                  if (missing === "other") setMissing(null);
                }}
                missing={missing === "category" || missing === "other" ? missing : null}
                disabled={loading}
              />

              <label htmlFor="tip" className="font-semibold text-amber-950">
                What would you like to report?
              </label>
              <textarea
                id="tip"
                ref={tipRef}
                value={tip}
                onChange={(e) => {
                  setTip(e.target.value);
                  if (missing === "tip") setMissing(null);
                }}
                rows={8}
                maxLength={MAX_TIP_LENGTH}
                disabled={loading}
                aria-required="true"
                aria-invalid={missing === "tip"}
                aria-describedby="tip-help"
                placeholder="Describe what you saw or know. Include locations, descriptions, dates or times if you can."
                className={`w-full rounded-xl bg-white/40 backdrop-blur-md border ${missing === "tip" ? "border-red-600" : "border-white/60"} px-4 py-3 text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 resize-y disabled:opacity-60`}
              />
              {missing === "tip" ? (
                <p role="alert" className="text-sm font-semibold text-red-800 -mt-2">
                  Please write your tip.
                </p>
              ) : null}
              <p id="tip-help" className="text-sm text-amber-900/80 -mt-1">
                Adding to a tip you sent before? Start your message with its PIN.
              </p>

              {error ? (
                <p role="alert" className="rounded-xl bg-red-100/70 border border-red-300 px-4 py-3 text-sm font-semibold text-red-900">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting…" : "Submit Anonymously"}
              </button>

              <p className="text-xs text-center text-amber-900/70">
                Please don&apos;t include your own name. This page does not use Google Analytics.{" "}
                {/* A new tab, so what has been typed here is not lost. */}
                <a
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-950"
                >
                  Privacy Policy
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default SubmitTipPage;
