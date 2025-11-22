import { useEffect, useState } from "react";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function getTokenNow(): string | null {
  if (typeof window === "undefined") return null;

  const keys = ["auth_token", "token", "jwt", "access_token"];

  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  for (const k of keys) {
    const v = sessionStorage.getItem(k);
    if (v) return v;
  }
  for (const k of keys) {
    const v = readCookie(k);
    if (v) return v;
  }
  const envToken = process.env.NEXT_PUBLIC_DEV_JWT || "";
  if (envToken) return envToken;

  return null;
}

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(getTokenNow());
  const [ready, setReady] = useState<boolean>(true);

  useEffect(() => {
    const keys = ["auth_token", "token", "jwt", "access_token"];
    const onStorage = (e: StorageEvent) => {
      if (e.key && keys.includes(e.key)) {
        setToken(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { token, ready };
}
