import type { AppProps } from "next/app";
import React from "react";
import { useRouter } from "next/router";

import "../styles/globals.css";
import { Layout } from "../components/layout/layout";
import { useSession, SessionProvider } from "../components/hooks/useSession";
import { ConfirmProvider } from "../components/modals/ConfirmProvider";

function SessionGate({ children }: { children: React.ReactNode }) {
  const { ready, isAuthenticated } = useSession();
  const router = useRouter();

  const isAuthRoute =
    router.pathname === "/login" || router.pathname === "/forgot-password";

  React.useEffect(() => {
    if (!ready) return;

    const currentPath = router.pathname;

    if (!isAuthenticated && !isAuthRoute && currentPath !== "/login") {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && isAuthRoute && currentPath !== "/") {
      router.replace("/");
      return;
    }
  }, [ready, isAuthenticated, isAuthRoute, router]);

  if (!ready) {
    return <div style={{ minHeight: "100vh", background: "#0B0F0E" }} />;
  }

  if (!isAuthenticated && !isAuthRoute) {
    return <div style={{ minHeight: "100vh", background: "#0B0F0E" }} />;
  }

  if (isAuthenticated && isAuthRoute) {
    return <div style={{ minHeight: "100vh", background: "#0B0F0E" }} />;
  }

  return <>{children}</>;
}

type WithNoChrome = AppProps["Component"] & { noChrome?: boolean };

export default function App({ Component, pageProps }: AppProps) {
  const noChrome = (Component as WithNoChrome).noChrome === true;

  return (
    <SessionProvider>
      <SessionGate>
        <ConfirmProvider>
          <Layout noChrome={noChrome}>
            <Component {...pageProps} />
          </Layout>
        </ConfirmProvider>
      </SessionGate>
    </SessionProvider>
  );
}
