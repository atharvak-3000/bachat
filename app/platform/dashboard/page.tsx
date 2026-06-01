import { createAdminClient } from "@/lib/supabase/admin"

export default async function PlatformDashboardPage() {
  const adminClient = createAdminClient()

  const [
    { data: orgs },
    { count: totalMembers }
  ] = await Promise.all([
    adminClient.from("organizations").select("*"),
    adminClient.from("members").select("*", { count: 'exact', head: true })
  ])

  const totalGats = orgs?.length || 0
  const pendingGats = orgs?.filter(o => !o.is_approved).length || 0
  const activeSubs = orgs?.filter(o => o.subscription_status === 'ACTIVE').length || 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Total Gats</p>
          <p className="text-3xl font-bold">{totalGats}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Pending Approval</p>
          <p className="text-3xl font-bold text-orange-600">{pendingGats}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Active Subscriptions</p>
          <p className="text-3xl font-bold text-green-600">{activeSubs}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Total Members</p>
          <p className="text-3xl font-bold text-blue-600">{totalMembers || 0}</p>
        </div>
      </div>
    </div>
  )
}
