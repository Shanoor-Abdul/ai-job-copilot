"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { saveResumeMetadata } from "./actions"

export function ResumeUpload({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      // Basic validation
      if (selected.size > 10 * 1024 * 1024) {
        setStatus("error")
        setErrorMessage("File exceeds 10MB limit")
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

      // Upload to Supabase Storage (assuming 'resumes' bucket exists, if not it will fail, 
      // but we handle error gracefully)
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Save metadata to database
      await saveResumeMetadata({
        userId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        storagePath: filePath,
      })

      setStatus("success")
      setFile(null)
    } catch (err: any) {
      console.error(err)
      setStatus("error")
      setErrorMessage(err.message || "Failed to upload resume. (Make sure 'resumes' bucket exists in Supabase)")
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center">
        <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Upload Resume</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Drag & Drop or Browse Files<br />
          Supported: PDF, DOC, DOCX (Max: 10MB)
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
          <Button onClick={handleUpload} disabled={status === "uploading"}>
            {status === "uploading" ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
            ) : "Upload"}
          </Button>
        </div>
      )}

      {status === "success" && (
        <div className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 p-4 rounded-md flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Resume uploaded successfully!
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
