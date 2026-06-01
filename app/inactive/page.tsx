import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function InactivePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F1117] px-4 transition-colors duration-250">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1D27] p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto text-3xl">
          ⚠️
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">खाते निष्क्रिय केले आहे</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            तुमचे खाते सध्या निष्क्रिय (Deactivated) आहे. अधिक माहितीसाठी कृपया तुमच्या बचत गटाच्या ॲडमिनशी संपर्क साधा.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="w-full bg-gray-900 dark:bg-gray-850 hover:bg-gray-800 dark:hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition active:scale-95">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
