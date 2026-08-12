import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/db/prisma"
import { ResumeUpload } from "./resume-upload"

export default async function ResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-slate-900">
        <Link className="flex items-center justify-center font-bold text-xl" href="/dashboard">
          AI Job Copilot
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
            Dashboard
          </Link>
          <Link href="/profile" className="text-sm font-medium hover:underline underline-offset-4">
            Profile
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Resume</h1>
          <p className="text-muted-foreground mt-2">Upload your resume to generate your AI profile. (AI generation coming in Phase 2)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
          <ResumeUpload userId={user.id} />
          
          {resumes.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold mb-4">Uploaded Resumes</h2>
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-4 border rounded-md">
                    <div>
                      <p className="font-medium">{resume.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {(resume.fileSize / 1024 / 1024).toFixed(2)} MB • Status: {resume.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
