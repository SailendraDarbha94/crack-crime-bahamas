"use client";

import { useToast } from "@/lib/toastContext";
import { useState } from "react";

const SubmitTipPage = () => {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const { toast } = useToast();

  const submitTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tip.trim()) {
      toast({ message: "Please enter your tip first", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      // The server encrypts the tip before storing it — the key never
      // touches the browser.
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tip.trim() }),
      });
      const { data } = await res.json();
      if (data && data !== "request failure") {
        setTip("");
        setSubmitted(true);
      } else {
        toast({ message: "Could not submit your tip. Please try again.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({ message: "Could not submit your tip. Please try again.", type: "error" });
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
          Your tip is encrypted before it is stored and we never ask for your
          identity. If you prefer to call, dial{" "}
          <a href="tel:+12423288477" className="font-bold text-amber-950 underline">
            328-TIPS (8477)
          </a>
          .
        </p>

        <div className="bg-white/25 backdrop-blur-xl border border-white/50 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(120,72,10,0.12)]">
          {submitted ? (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-amber-950 mb-2">Thank you.</h2>
              <p className="text-amber-900/80 mb-6">
                Your tip has been received anonymously and securely. You are
                helping keep the community safe.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95"
              >
                Submit another tip
              </button>
            </div>
          ) : (
            <form onSubmit={submitTip} className="flex flex-col gap-4">
              <label htmlFor="tip" className="font-semibold text-amber-950">
                What would you like to report?
              </label>
              <textarea
                id="tip"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                rows={8}
                maxLength={10000}
                placeholder="Describe what you saw or know. Include locations, descriptions, dates or times if you can."
                className="w-full rounded-xl bg-white/40 backdrop-blur-md border border-white/60 px-4 py-3 text-amber-950 placeholder-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-400/60 resize-y"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-white/40 backdrop-blur-md border border-white/60 text-amber-950 hover:bg-white/55 font-bold px-5 py-3 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting…" : "Submit Anonymously"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default SubmitTipPage;
