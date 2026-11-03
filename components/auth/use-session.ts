"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/types";

interface SessionResponse {
  user: AuthUser | null;
}

/**
 * Reads the current session for client-side chrome (header, guards). The server
 * always re-checks authorization, so this is display state only.
 */
export function useSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<SessionResponse>) : null))
      .then((payload) => {
        if (active && payload) setUser(payload.user);
      })
      .catch(() => {
        // The header simply stays signed-out if the session cannot be read.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
