import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user || user.email !== process.env.PLATFORM_OWNER_EMAIL) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/platform/dashboard" className="text-xl font-bold text-orange-600">BachatGatOnline Platform</Link>
          <nav className="flex gap-4">
            <Link href="/platform/dashboard" className="text-sm text-gray-600 hover:text-orange-600 font-medium">Dashboard</Link>
            <Link href="/platform/gats" className="text-sm text-gray-600 hover:text-orange-600 font-medium">Gats</Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm font-medium text-gray-600 hover:text-gray-900 border px-3 py-1.5 rounded-lg">Sign Out</button>
        </form>
      </header>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
