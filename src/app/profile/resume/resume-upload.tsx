"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { saveResumeMetadata, processUploadedResume } from "./actions"
import { useRouter } from "next/navigation"

export function ResumeUpload({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      // Basic validation
      if (selected.size > 10 * 1024 * 1024) {
        setStatus("error")
        setErrorMessage("File exceeds 10MB limit")
        return
      }
      
      const ext = selected.name.toLowerCase()
      if (!ext.endsWith('.pdf') && !ext.endsWith('.docx') && !ext.endsWith('.doc')) {
        setStatus("error")
        setErrorMessage("Unsupported file type. Please upload: PDF or DOCX")
        return
      }

      setFile(selected)
      setStatus("idle")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setStatus("uploading")
      const supabase = createClient()
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `resumes/${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const resumeId = await saveResumeMetadata({
        userId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        storagePath: filePath,
      })

      setStatus("processing")
      const processResult = await processUploadedResume(resumeId)

      if (!processResult.success) {
        throw new Error(processResult.error || "Failed to analyze resume")
      }

      setStatus("success")
      setFile(null)
      
      // Navigate to review screen
      router.push(`/profile/resume/review?id=${resumeId}`)
      
    } catch (err: any) {
      console.error(err)
      setStatus("error")
      setErrorMessage(err.message || "An unexpected error occurred")
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center">
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Upload Resume</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Drag & Drop or Browse Files<br />
          Supported: PDF, DOCX (Max: 10MB)
        </p>
        
        <input 
          type="file" 
          id="resume-upload" 
          className="hidden" 
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
        />
        <label htmlFor="resume-upload" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer">
          <span>Browse Files</span>
        </label>
      </div>

      {file && status !== "success" && (
        <div className="flex items-center justify-between p-4 border rounded-md bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <File className="h-5 w-5 text-primary" />
            <div className="text-sm font-medium">{file.name}</div>
          </div>
          <Button onClick={handleUpload} disabled={status === "uploading" || status === "processing"}>
            {status === "uploading" && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>}
            {status === "processing" && <><FileText className="mr-2 h-4 w-4 animate-pulse" /> Analyzing...</>}
            {status === "idle" && "Upload & Analyze"}
            {status === "error" && "Try Again"}
          </Button>
        </div>
      )}

      {status === "error" && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {errorMessage}
        </div>
      )}
    </div>
  )
}
