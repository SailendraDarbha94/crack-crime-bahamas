"use client";
/**
 * Which of a tip's later messages a card is drawing, and a way to bring in
 * more of them.
 *
 * A card starts with the newest follow-ups only (tipView.ts): a tip stuffed
 * with tens of thousands of them must not freeze the page that lists it. But
 * "newest" is decided by times the sender chose, and anyone who knows a tip's
 * PIN can add to it, so a genuine message can be pushed out of the newest few
 * by a hundred junk ones. Nothing stored may be out of an admin's reach for
 * that reason: every earlier message can be brought in here, a batch at a
 * time, and only what has been asked for is ever decrypted or drawn.
 */
import { createContext, useContext, useMemo, useState } from "react";
import { MAX_FOLLOW_UPS_SHOWN } from "./safeRecord";

/**
 * The most a single click brings in. Each click brings in as many as are
 * already on the card (100, then 200, 400...), so a long thread is a handful
 * of clicks instead of one per hundred messages, up to this many at once: a
 * card is still never asked to draw tens of thousands in one go.
 */
const LARGEST_BATCH = 3200;
import { followUpViews, type FollowUpView, type StoredFollowUp } from "./tipView";

/**
 * Where a page remembers how many earlier messages each card has brought in,
 * by tip id. The inbox takes its whole list down while it reloads (after a
 * message is shared with police, say), and a card put back with nothing
 * remembered would have hidden again what the admin had just asked to see.
 * Give the provider a Map that lives as long as the page does. Without one,
 * a card remembers only for as long as it stays on screen.
 */
const Memory = createContext<Map<string, number> | null>(null);
export const ShownFollowUpsMemory = Memory.Provider;

export type ShownFollowUps = {
  /** The follow-ups to draw, oldest first: the earlier ones asked for, then the newest. */
  followUps: FollowUpView[];
  /** How many earlier follow-ups are still not drawn. */
  hidden: number;
  /** How many of them the next `showEarlier` brings in. */
  nextBatch: number;
  showEarlier: () => void;
};

export function useShownFollowUps(view: {
  id: string;
  followUps: FollowUpView[];
  earlierFollowUps: StoredFollowUp[];
}): ShownFollowUps {
  const memory = useContext(Memory);
  // How many of the earlier follow-ups have been asked for. It is a count from
  // the newest end, so it still means the same thing after the page reloads
  // its data and hands this card a fresh view of the same tip.
  const [asked, setAsked] = useState<number>(() => memory?.get(view.id) ?? 0);
  const earlier = view.earlierFollowUps;
  const revealed = Math.min(asked, earlier.length);

  const broughtIn = useMemo(
    () => (revealed ? followUpViews(earlier.slice(earlier.length - revealed)) : []),
    [earlier, revealed]
  );
  const followUps = useMemo(
    () => (broughtIn.length ? broughtIn.concat(view.followUps) : view.followUps),
    [broughtIn, view.followUps]
  );

  const hidden = earlier.length - revealed;
  const nextBatch = Math.min(hidden, LARGEST_BATCH, Math.max(MAX_FOLLOW_UPS_SHOWN, revealed));
  return {
    followUps,
    hidden,
    nextBatch,
    showEarlier: () => {
      const next = revealed + nextBatch;
      memory?.set(view.id, next);
      setAsked(next);
    },
  };
}

/** "Show the 3 earlier messages" / "Show 100 earlier messages": the label for the button. */
export const showEarlierLabel = (hidden: number, nextBatch: number): string =>
  hidden <= nextBatch
    ? hidden === 1
      ? "Show the 1 earlier message"
      : `Show the ${hidden} earlier messages`
    : `Show ${nextBatch} earlier messages`;

/** "1 earlier message is not shown" / "250 earlier messages are not shown". */
export const hiddenText = (hidden: number): string =>
  hidden === 1 ? "1 earlier message is not shown" : `${hidden} earlier messages are not shown`;
