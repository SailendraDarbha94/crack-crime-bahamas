import { TIP_FORM_PATH } from "@/lib/analyticsPolicy";
import type { ReactNode } from "react";

/**
 * Link to the public tip form. Deliberately a plain <a>, not next/link: the
 * tip form must open with a full page load so that Google Analytics is never
 * started on it (see analyticsPolicy.ts). Use this for every link to the form.
 */
export default function TipFormLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={TIP_FORM_PATH} className={className}>
      {children}
    </a>
  );
}
