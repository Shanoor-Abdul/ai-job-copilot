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
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        currentTitle: data.currentTitle,
        yearsOfExperience: data.yearsOfExperience,
        summary: data.summary,
        country: data.country,
        city: data.city,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
        skills: data.skills || [],
      },
      create: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        currentTitle: data.currentTitle,
        yearsOfExperience: data.yearsOfExperience,
        summary: data.summary,
        country: data.country,
        city: data.city,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        portfolioUrl: data.portfolioUrl,
        skills: data.skills || [],
      }
    })

    // Re-create projects
    if (data.projects && Array.isArray(data.projects)) {
      await prisma.project.deleteMany({
        where: { profileId: profile.id }
      })
      
      if (data.projects.length > 0) {
        await prisma.project.createMany({
          data: data.projects.map((p: any) => ({
            profileId: profile.id,
            name: p.name,
            description: p.description,
            startDate: p.startDate,
            endDate: p.endDate,
            url: p.url,
            technologies: p.technologies || []
          }))
        })
      }
    }

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
