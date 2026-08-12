"use server"

import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"

type ResumeMetadata = {
  userId: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
}

export async function saveResumeMetadata(data: ResumeMetadata) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== data.userId) {
    throw new Error("Unauthorized")
  }

  const resume = await prisma.resume.create({
    data: {
      userId: data.userId,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      storagePath: data.storagePath,
      status: "UPLOADED"
    }
  })

  revalidatePath("/profile/resume")
  return resume.id
}

import { processResume } from "@/services/resume/resume.service"

export async function processUploadedResume(resumeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const result = await processResume(resumeId, user.id)
  revalidatePath("/profile/resume")
  return result
}

export async function deleteResume(resumeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId, userId: user.id }
  })
  if (!resume) return

  // Delete from storage
  await supabase.storage.from("resumes").remove([resume.storagePath])

  // Delete from DB
  await prisma.resume.delete({
    where: { id: resumeId }
  })

  revalidatePath("/profile/resume")
}
