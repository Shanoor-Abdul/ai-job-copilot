import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create account | Saudi Job Copilot",
  description: "Create a private Saudi Job Copilot workspace.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
