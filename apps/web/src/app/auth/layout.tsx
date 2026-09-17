import type { ReactNode } from "react";
import { AuthProvider } from "../../components/auth-context";
import { AuthShell } from "../../components/auth-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthShell>{children}</AuthShell>
    </AuthProvider>
  );
}
