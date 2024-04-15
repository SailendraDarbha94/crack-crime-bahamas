"use client";
import { NextUIProvider } from "@nextui-org/react";

export default function Client({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <div>{children}</div>
    </NextUIProvider>
  );
}
