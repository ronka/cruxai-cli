import { useEffect } from "react";

/**
 * Shows a browser "Leave site?" dialog when the user tries to close/navigate
 * away while the chat session is active (i.e. `isActive` is true).
 */
export function usePageCloseWarning(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for legacy browser support
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isActive]);
}
