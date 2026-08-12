import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import prisma from "@/lib/db/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ReviewForm } from "./review-form"

export default async function ResumeReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const resolvedSearchParams = await searchParams
  const resumeId = resolvedSearchParams.id
  if (!resumeId) {
    redirect("/profile/resume")
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId, userId: user.id },
    include: { parsedData: true }
  })

  if (!resume || !resume.parsedData) {
    redirect("/profile/resume")
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  })

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-slate-900">
        <Link className="flex items-center justify-center font-bold text-xl" href="/dashboard">
          AI Job Copilot
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/profile/resume" className="text-sm font-medium hover:underline underline-offset-4">
            Back to Resumes
          </Link>
        </nav>
      </header>
      
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Extracted Information</h1>
          <p className="text-muted-foreground mt-2">
            We analyzed your resume. Please review the information before saving it to your profile.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
          <ReviewForm 
            resumeId={resumeId}
            parsedData={resume.parsedData.extractedData} 
            existingProfile={profile} 
          />
        </div>
      </main>
    </div>
  )
}
