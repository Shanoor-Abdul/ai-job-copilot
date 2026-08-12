import { createClient } from "@/lib/supabase/server"

export async function downloadResumeBuffer(storagePath: string): Promise<Buffer> {
  const supabase = await createClient()

  // Download the file from the 'resumes' bucket
  const { data, error } = await supabase.storage.from("resumes").download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download resume from storage: ${error?.message}`)
  }

  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
