import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in | Saudi Job Copilot",
  description: "Sign in to manage your Saudi Job Copilot workspace.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
