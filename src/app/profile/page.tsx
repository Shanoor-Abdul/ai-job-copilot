import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileForm } from "./profile-form"
import prisma from "@/lib/db/prisma"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch existing profile data from Prisma
  let profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: { projects: true, experiences: true, educations: true }
  })

  // Phase 1 Fix: Fallback to user.name if empty
  if (profile && !profile.firstName && !profile.lastName && user.user_metadata?.full_name) {
    const nameParts = user.user_metadata.full_name.split(" ")
    profile.firstName = nameParts[0] || ""
    profile.lastName = nameParts.slice(1).join(" ") || ""
  } else if (!profile && user.user_metadata?.full_name) {
    const nameParts = user.user_metadata.full_name.split(" ")
    profile = {
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
    } as any
  }

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
          <form action={async () => {
            "use server"
            const supabase = await createClient()
            await supabase.auth.signOut()
            redirect("/")
          }}>
            <Button variant="ghost" size="sm" type="submit">Sign out</Button>
          </form>
        </nav>
      </header>
      
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your personal and professional information.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6">
          <ProfileForm initialData={profile} userId={user.id} />
        </div>
      </main>
    </div>
  )
}
