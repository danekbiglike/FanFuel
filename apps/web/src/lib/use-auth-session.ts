"use client";

import { useEffect, useState } from "react";
import type { CurrentUser } from "@fanfuel/types";
import { ApiError, clearStoredToken, getMe, getStoredToken } from "./api";

type Session =
  | { status: "checking" | "guest" | "error" }
  | { status: "authenticated"; token: string; user: CurrentUser };

export function useAuthSession() {
  const [session, setSession] = useState<Session>({ status: "checking" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    async function check() {
      try {
        const token = getStoredToken();
        if (!token) {
          setSession({ status: "guest" });
          return;
        }
        const user = await getMe(token, controller.signal);
        if (active) setSession({ status: "authenticated", token, user });
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.code === "unauthorized") {
          clearStoredToken();
          setSession({ status: "guest" });
        } else {
          setSession({ status: "error" });
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void check();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [attempt]);

  function retry() {
    setSession({ status: "checking" });
    setAttempt((value) => value + 1);
  }

  function useAnotherAccount() {
    clearStoredToken();
    setSession({ status: "guest" });
  }

  return { ...session, retry, useAnotherAccount };
}
