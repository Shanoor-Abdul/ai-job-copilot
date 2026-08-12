"use server"

import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"

export async function confirmResumeReview(resumeId: string, confirmedData: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // Verify the resume belongs to the user
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId, userId: user.id }
  })

  if (!resume) throw new Error("Resume not found")

  // Update Profile with confirmed data
  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      firstName: confirmedData.firstName || undefined,
      lastName: confirmedData.lastName || undefined,
      phone: confirmedData.phone || undefined,
      currentTitle: confirmedData.currentTitle || undefined,
      yearsOfExperience: confirmedData.yearsOfExperience || undefined,
      summary: confirmedData.summary || undefined,
      country: confirmedData.country || undefined,
      city: confirmedData.city || undefined,
      linkedinUrl: confirmedData.linkedinUrl || undefined,
      githubUrl: confirmedData.githubUrl || undefined,
      portfolioUrl: confirmedData.portfolioUrl || undefined,
      skills: confirmedData.skills || [],
      achievements: confirmedData.achievements || [],
    },
    create: {
      userId: user.id,
      firstName: confirmedData.firstName,
      lastName: confirmedData.lastName,
      phone: confirmedData.phone,
      currentTitle: confirmedData.currentTitle,
      yearsOfExperience: confirmedData.yearsOfExperience,
      summary: confirmedData.summary,
      country: confirmedData.country,
      city: confirmedData.city,
      linkedinUrl: confirmedData.linkedinUrl,
      githubUrl: confirmedData.githubUrl,
      portfolioUrl: confirmedData.portfolioUrl,
      skills: confirmedData.skills || [],
      achievements: confirmedData.achievements || [],
    }
  })

  // Re-create projects
  if (confirmedData.projects && Array.isArray(confirmedData.projects)) {
    await prisma.project.deleteMany({
      where: { profileId: profile.id }
    })
    
    if (confirmedData.projects.length > 0) {
      await prisma.project.createMany({
        data: confirmedData.projects.map((p: any) => ({
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

  // Re-create experiences
  if (confirmedData.experiences && Array.isArray(confirmedData.experiences)) {
    await prisma.experience.deleteMany({
      where: { profileId: profile.id }
    })
    
    if (confirmedData.experiences.length > 0) {
      await prisma.experience.createMany({
        data: confirmedData.experiences.map((e: any) => ({
          profileId: profile.id,
          company: e.company,
          title: e.title,
          startDate: e.startDate,
          endDate: e.endDate,
          description: e.description,
          technologies: e.technologies || []
        }))
      })
    }
  }

  // Re-create educations
  if (confirmedData.educations && Array.isArray(confirmedData.educations)) {
    await prisma.education.deleteMany({
      where: { profileId: profile.id }
    })
    
    if (confirmedData.educations.length > 0) {
      await prisma.education.createMany({
        data: confirmedData.educations.map((e: any) => ({
          profileId: profile.id,
          institution: e.institution,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          startDate: e.startDate,
          endDate: e.endDate,
        }))
      })
    }
  }

  // Mark Resume as COMPLETED
  await prisma.resume.update({
    where: { id: resumeId },
    data: { status: "COMPLETED" }
  })

  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { success: true }
}
