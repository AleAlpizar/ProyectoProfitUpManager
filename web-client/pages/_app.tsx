import type { AppProps } from "next/app";
import React from "react";

import "../styles/globals.css";
import { Layout } from "../components/layout/layout";
import { useSession } from "../components/hooks/useSession";
import { ConfirmProvider } from "../components/modals/ConfirmProvider";

function SessionGate({ children }: { children: React.ReactNode }) {
  const { ready } = useSession();
  if (!ready) return <div style={{ minHeight: "100vh", background: "#0B0F0E" }} />;
  return <>{children}</>;
}

type WithNoChrome = AppProps["Component"] & { noChrome?: boolean };

export default function App({ Component, pageProps }: AppProps) {
  const noChrome = (Component as WithNoChrome).noChrome === true;

  return (
    <SessionGate>
      <ConfirmProvider>
        <Layout noChrome={noChrome}>
          <Component {...pageProps} />
        </Layout>
      </ConfirmProvider>
    </SessionGate>
  );
}
