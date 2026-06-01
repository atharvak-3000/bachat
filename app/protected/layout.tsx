import { redirect } from "next/navigation"

// Template's protected route — redirect to our dashboard
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  redirect("/dashboard")
}
