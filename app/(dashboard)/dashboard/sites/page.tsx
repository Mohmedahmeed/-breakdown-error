import { createClient } from "../../../../lib/supabase/server";
import { SitesTable } from "../../../../components/sites/sites-table";
import { AddSiteDialog } from "../../../../components/sites/add-site-dialog";
import { Button } from "../../../../components/ui/button";
import { Plus, Antenna, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";

export default async function SitesPage() {
  const supabase = await createClient();

  const { data: sites, error } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sites:", error);
  }

  // Quick stats
  const totalSites = sites?.length || 0;
  const activeSites = sites?.filter(s => s.status === 'active').length || 0;
  const maintenanceSites = sites?.filter(s => s.status === 'maintenance').length || 0;
  const inactiveSites = sites?.filter(s => s.status === 'inactive' || s.status === 'fault').length || 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
            <Antenna className="h-8 w-8 text-blue-500" />
            <span>Network Sites</span>
          </h2>
          <p className="text-slate-600 mt-1">
            Manage cell tower sites and base stations across the network
          </p>
        </div>
        <AddSiteDialog>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </AddSiteDialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Sites</p>
                <p className="text-2xl font-bold text-slate-900">{totalSites}</p>
              </div>
              <Antenna className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeSites}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{maintenanceSites}</p>
              </div>
              <Settings className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Inactive/Fault</p>
                <p className="text-2xl font-bold text-red-600">{inactiveSites}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <SitesTable sites={sites || []} />
    </div>
  );
}