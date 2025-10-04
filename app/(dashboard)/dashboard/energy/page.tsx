import { createClient } from "../../../../lib/supabase/server";
import { AddEnergyDialog } from "../../../../components/energy/add-energy-dialog";
import { EnergyTable } from "../../../../components/energy/energy-table";
import { EnergyCharts } from "../../../../components/energy/energy-charts";
import { Button } from "../../../../components/ui/button";
import { Plus, Zap, TrendingUp, DollarSign, Activity } from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";

export default async function EnergyPage() {
  const supabase = await createClient();

  // Fetch energy consumption data with related site and equipment info
  const { data: energyData, error } = await supabase
    .from("energy_consumption")
    .select(`
      *,
      sites(id, name, code),
      equipment(id, name)
    `)
    .order("recorded_at", { ascending: false });

  if (error) {
    console.error("Error fetching energy data:", error);
  }

  // Fetch sites for the add dialog
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, code")
    .eq("status", "active")
    .order("name");

  // Fetch equipment for the add dialog
  const { data: equipment } = await supabase
    .from("equipment")
    .select("id, name, site_id")
    .order("name");

  // Calculate quick stats
  const totalConsumption = energyData?.reduce((sum, e) => sum + parseFloat(e.consumption_kwh || 0), 0) || 0;
  const totalCost = energyData?.reduce((sum, e) => sum + parseFloat(e.cost_amount || 0), 0) || 0;

  // Get unique sites count for average calculation
  const uniqueSites = new Set(energyData?.map(e => e.site_id).filter(Boolean));
  const avgPerSite = uniqueSites.size > 0 ? totalConsumption / uniqueSites.size : 0;

  // Calculate this month's consumption
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthData = energyData?.filter(e =>
    new Date(e.recorded_at) >= firstDayOfMonth
  ) || [];
  const thisMonthConsumption = thisMonthData.reduce((sum, e) => sum + parseFloat(e.consumption_kwh || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            <span>Energy Consumption</span>
          </h2>
          <p className="text-slate-600 mt-1">
            Monitor and track energy consumption across the network
          </p>
        </div>
        <AddEnergyDialog
          sites={sites || []}
          equipment={equipment || []}
        >
          <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Record Energy
          </Button>
        </AddEnergyDialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Consumption</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {totalConsumption.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Average per Site</p>
                <p className="text-2xl font-bold text-blue-600">
                  {avgPerSite.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {thisMonthConsumption.toLocaleString('en-US', { maximumFractionDigits: 2 })} kWh
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <EnergyCharts energyData={energyData || []} />

      <EnergyTable
        energyData={energyData || []}
        sites={sites || []}
        equipment={equipment || []}
      />
    </div>
  );
}
