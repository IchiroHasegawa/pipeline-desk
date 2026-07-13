"use client";

import type { ReactNode } from "react";

type AuthGateProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

// AuthGate is preserved for structure.
// Authentication routing and protection are now handled by Next.js middleware
// and the dedicated /login and /signup routes.
export default function AuthGate({ children }: AuthGateProps) {
  return <>{children}</>;
}
