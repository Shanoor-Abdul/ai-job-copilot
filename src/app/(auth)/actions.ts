"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }
  
  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      // Assuming we are testing locally and want to auto-confirm or redirect
      // to the callback which handles the code
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  })

  if (error) {
    return { error: error.message }
  }

  // For phase 1, if email confirmation is off in Supabase, we just redirect.
  // If it's on, we should tell them to check email.
  // Let's assume we redirect and let middleware protect if not fully logged in.
  // Or return a success message.
  return { success: "Account created! Check your email to verify if required, or simply log in." }
}
