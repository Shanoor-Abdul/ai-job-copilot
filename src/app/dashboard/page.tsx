import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Phase 1 static completion for now, real calculation belongs in Profile Service
  const profileCompletion = 75

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-slate-900">
        <Link className="flex items-center justify-center font-bold text-xl" href="/dashboard">
          AI Job Copilot
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/profile" className="text-sm font-medium hover:underline underline-offset-4">
            Profile
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
      
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {user.user_metadata?.full_name || 'User'}</h1>
          <p className="text-muted-foreground mt-2">Your profile is almost ready.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profile Completion</CardTitle>
              <CardDescription>{profileCompletion}% complete</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={profileCompletion} className="h-2 mb-4" />
              <Link href="/profile">
                <Button className="w-full" variant="outline">Complete Profile</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resume</CardTitle>
              <CardDescription>Not uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/profile/resume">
                <Button className="w-full" variant="outline">Upload Resume</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Applications</CardTitle>
              <CardDescription>0 active applications</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary" disabled>View Applications</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Job Matches</CardTitle>
            <CardDescription>Coming in Phase 4</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-12 text-slate-500">
            AI Job Matching will appear here once your profile is complete.
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
