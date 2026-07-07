"use client";

import { useState } from "react";

export function ConfirmButton({ children, confirmLabel, className }: { children: React.ReactNode; confirmLabel?: string; className: string }) {
  const [armed, setArmed] = useState(false);

  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!armed) {
          event.preventDefault();
          setArmed(true);
          window.setTimeout(() => setArmed(false), 3500);
        }
      }}
      className={className}
    >
      {armed ? confirmLabel ?? "Confirm" : children}
    </button>
  );
}
