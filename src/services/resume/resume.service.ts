import prisma from "@/lib/db/prisma"
import { downloadResumeBuffer } from "../storage/storage.service"
import { parseResumeBuffer } from "./resume-parser.service"
import { extractResumeData } from "../ai/ai.service"

export async function processResume(resumeId: string, userId: string) {
  try {
    // 1. Verify user & Load Resume
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId }
    })

    if (!resume || resume.userId !== userId) {
      throw new Error("Resume not found or unauthorized")
    }

    // Mark as PROCESSING
    await prisma.resume.update({
      where: { id: resumeId },
      data: { status: "PROCESSING" }
    })

    const startTime = Date.now()

    // 2. Download private file
    const buffer = await downloadResumeBuffer(resume.storagePath)

    // 3. Extract & Normalize text
    const text = await parseResumeBuffer(buffer, resume.fileType, resume.fileName)

    // 4. Call AI & Validate output
    const extractedData = await extractResumeData(text)

    // 5. Save parsed data
    await prisma.parsedResumeData.create({
      data: {
        resumeId,
        extractedData: extractedData as any,
        processingTimeMs: Date.now() - startTime,
      }
    })

    // 6. Update Resume status
    await prisma.resume.update({
      where: { id: resumeId },
      data: { status: "REVIEW_REQUIRED" }
    })

    return { success: true }
  } catch (error: any) {
    console.error("Resume processing failed:", error)
    
    // Update Resume status to FAILED
    await prisma.resume.update({
      where: { id: resumeId },
      data: { status: "FAILED" }
    })

    return { success: false, error: error.message || "Unknown error during processing" }
  }
}
