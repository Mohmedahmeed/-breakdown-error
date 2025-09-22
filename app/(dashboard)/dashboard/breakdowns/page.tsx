import { createClient } from "@/lib/supabase/server";
import { BreakdownsTable } from "@/components/breakdowns/breakdowns-table";
import { AddBreakdownDialog } from "@/components/breakdowns/add-breakdown-dialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Clock, CheckCircle, XCircle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BreakdownsPage() {
  const supabase = await createClient();
  
  // Fetch breakdowns with related data
  const { data: breakdowns, error } = await supabase
    .from("breakdowns")
    .select(`
      *,
      sites(name, code),
      equipment(name),
      reported_by_profile:profiles!breakdowns_reported_by_fkey(full_name),
      assigned_to_profile:profiles!breakdowns_assigned_to_fkey(full_name)
    `)
    .order("reported_at", { ascending: false });

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

  // Fetch users for assignment
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");

  // Quick stats
  const total = breakdowns?.length || 0;
  const open = breakdowns?.filter(b => b.status === 'open').length || 0;
  const investigating = breakdowns?.filter(b => b.status === 'investigating').length || 0;
  const inProgress = breakdowns?.filter(b => b.status === 'in_progress').length || 0;
  const critical = breakdowns?.filter(b => b.severity === 'critical').length || 0;

  // Calculate total affected users
  const totalAffectedUsers = breakdowns?.reduce((sum, b) => sum + (b.impact_users || 0), 0) || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <span>Breakdown & Outage Management</span>
          </h2>
          <p className="text-slate-600 mt-1">
            Track and manage network outages, equipment failures and incidents
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
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Investigating</p>
                <p className="text-2xl font-bold text-yellow-600">{investigating}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
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
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">⚡</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical</p>
                <p className="text-2xl font-bold text-purple-600">{critical}</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Affected Users</p>
                <p className="text-2xl font-bold text-orange-600">{totalAffectedUsers.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <span>Network Health Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {((total - open - investigating - inProgress) / (total || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600">Operational</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {((investigating + inProgress) / (total || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600">Under Repair</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {(open / (total || 1) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600">Down</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <span>Response Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Avg. Response</span>
                <span className="font-medium">&lt; 15 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Avg. Resolution</span>
                <span className="font-medium">2.5 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">SLA Compliance</span>
                <span className="font-medium text-green-600">94.2%</span>
              </div>
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