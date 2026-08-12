import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <Link className="flex items-center justify-center font-bold text-xl tracking-tighter" href="/">
          AI Job Copilot
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Your AI-Powered Job Search Copilot
                </h1>
                <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl dark:text-slate-400">
                  Find better jobs. Match smarter. Apply faster. <br/>
                  Let our AI assistant manage your applications and surface the perfect opportunities.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="h-11 px-8">Get Started</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-11 px-8">Sign In</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
