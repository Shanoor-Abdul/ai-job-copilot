"use server"

import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfile(userId: string, data: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return { error: "Unauthorized" }
  }

  try {
    await prisma.profile.upsert({
      where: { userId },
      update: {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        currentTitle: data.currentTitle || null,
        yearsOfExperience: data.yearsOfExperience || null,
        summary: data.summary || null,
        country: data.country || null,
        city: data.city || null,
        linkedinUrl: data.linkedinUrl || null,
        githubUrl: data.githubUrl || null,
        portfolioUrl: data.portfolioUrl || null,
      },
      create: {
        userId,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        phone: data.phone || null,
        currentTitle: data.currentTitle || null,
        yearsOfExperience: data.yearsOfExperience || null,
        summary: data.summary || null,
        country: data.country || null,
        city: data.city || null,
        linkedinUrl: data.linkedinUrl || null,
        githubUrl: data.githubUrl || null,
        portfolioUrl: data.portfolioUrl || null,
      }
    })

    // Update onboarding status
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStatus: 'PROFILE' }
    })

    revalidatePath("/profile")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Profile update error:", error)
    return { error: "Failed to save profile information" }
  }
}
