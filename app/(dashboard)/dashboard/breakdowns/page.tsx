// app/(dashboard)/dashboard/breakdowns/page.tsx
import { createClient } from "../../../../lib/supabase/server";
import { BreakdownsTable } from "../../../../components/breakdowns/breakdowns-table";
import { AddBreakdownDialog } from "../../../../components/breakdowns/add-breakdown-dialog";
import { Button } from "../../../../components/ui/button";
import { Plus, AlertTriangle, Activity, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";

export default async function BreakdownsPage() {
  const supabase = await createClient();
  
  // Fetch breakdowns with related data
  const { data: breakdowns, error } = await supabase
    .from("breakdowns")
    .select(`
      *,
      sites(name, code),
      equipment(name),
      profiles!breakdowns_reported_by_fkey(full_name),
      assigned_profile:profiles!breakdowns_assigned_to_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching breakdowns:", error);
  }

  // Fetch sites for the add breakdown dialog
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, code")
    .eq("status", "active")
    .order("name");

  // Fetch equipment for the add breakdown dialog
  const { data: equipment } = await supabase
    .from("equipment")
    .select("id, name, site_id")
    .order("name");

  // Fetch users with appropriate roles
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["technician", "engineer", "admin", "manager"])
    .order("full_name");

  // Quick stats
  const total = breakdowns?.length || 0;
  const open = breakdowns?.filter(b => b.status === 'open').length || 0;
  const critical = breakdowns?.filter(b => b.severity === 'critical').length || 0;
  const inProgress = breakdowns?.filter(b => b.status === 'in_progress').length || 0;
  const totalImpactedUsers = breakdowns?.reduce((sum, b) => sum + (b.impact_users || 0), 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <span>System Breakdowns</span>
          </h2>
          <p className="text-slate-600 mt-1">
            Track and manage system breakdowns and failures
          </p>
        </div>
        <AddBreakdownDialog 
          sites={sites || []} 
          equipment={equipment || []}
          users={users || []}
        >
          <Button className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Report Breakdown
          </Button>
        </AddBreakdownDialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Open Issues</p>
                <p className="text-2xl font-bold text-red-600">{open}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical</p>
                <p className="text-2xl font-bold text-orange-600">{critical}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Breakdowns</p>
                <p className="text-2xl font-bold text-purple-600">{total}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">Σ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Impacted Users</p>
                <p className="text-2xl font-bold text-yellow-600">{totalImpactedUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <BreakdownsTable 
        breakdowns={breakdowns || []} 
        sites={sites || []} 
        equipment={equipment || []}
        users={users || []}
      />
    </div>
  );
}