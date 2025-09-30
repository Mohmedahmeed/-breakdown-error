// app/(dashboard)/dashboard/users/page.tsx
import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersTable } from "../../../../components/users/users-table";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Users, UserPlus, Shield, Activity } from "lucide-react";

export default async function UsersPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get current user's profile to check role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Check if user is admin or manager (managers can view, only admins can edit)
  if (currentProfile?.role !== 'admin' && currentProfile?.role !== 'manager') {
    redirect("/dashboard");
  }

  const isAdmin = currentProfile?.role === 'admin';

  // Fetch all users
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
  }

  // Calculate stats
  const stats = {
    total: users?.length || 0,
    admin: users?.filter(u => u.role === 'admin').length || 0,
    managers: users?.filter(u => u.role === 'manager').length || 0,
    engineers: users?.filter(u => u.role === 'engineer').length || 0,
    technicians: users?.filter(u => u.role === 'technician').length || 0,
    activeToday: users?.filter(u => {
      const lastActive = new Date(u.updated_at || u.created_at);
      const today = new Date();
      return lastActive.toDateString() === today.toDateString();
    }).length || 0
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-500" />
            <span>Team Management</span>
          </h2>
          <p className="text-slate-600 mt-1">
            {isAdmin 
              ? "Manage user accounts and permissions" 
              : "View team members and their information"}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">View Only Access</span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admin}</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Managers</p>
                <p className="text-2xl font-bold text-green-600">{stats.managers}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Engineers</p>
                <p className="text-2xl font-bold text-orange-600">{stats.engineers}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Technicians</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.technicians}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Today</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.activeToday}</p>
              </div>
              <Activity className="h-8 w-8 text-cyan-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <UsersTable users={users || []} currentUserId={user.id} isAdmin={isAdmin} />
    </div>
  );
}