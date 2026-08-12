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

  await prisma.resume.create({
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
}
