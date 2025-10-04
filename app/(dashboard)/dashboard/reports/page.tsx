import { createClient } from "../../../../lib/supabase/server";
import { ReportsOverview } from "../../../../components/reports/reports-overview";
import { BreakdownsReport } from "../../../../components/reports/breakdowns-report";
import { SiteStatusChart } from "../../../../components/reports/site-status-chart";
import { EquipmentStatusChart } from "../../../../components/reports/equipment-status-chart";
import { MaintenanceChart } from "../../../../components/reports/maintenance-chart";
import { AlertsChart } from "../../../../components/reports/alerts-chart";
import { EnergyChart } from "../../../../components/reports/energy-chart";
import { ExportButtons } from "../../../../components/reports/export-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { FileBarChart, TrendingUp, Activity, Calendar, AlertTriangle, Zap } from "lucide-react";

export default async function ReportsPage() {
  const supabase = await createClient();

  // Fetch data for reports - FIXED QUERIES
  const [
    { data: sites },
    { data: equipment },
    { data: interventions },
    { data: alerts },
    { data: breakdowns },
    { data: energyData }
  ] = await Promise.all([
    supabase.from("sites").select("id, name, status, type, created_at"),
    supabase.from("equipment").select("id, name, status, type, site_id, created_at"),
    supabase.from("interventions").select(`
      id, title, status, type, priority, scheduled_date, completed_date, created_at,
      sites(name), equipment(name)
    `),
    supabase.from("alerts").select("id, severity, status, type, created_at"),
    // FIXED BREAKDOWNS QUERY - Use proper join syntax
    supabase.from("breakdowns")
      .select(`
        id,
        title,
        type,
        severity,
        status,
        priority,
        impact_users,
        downtime_start,
        resolved_at,
        closed_at,
        created_at,
        sites!inner(name, code)
      `)
      .order("created_at", { ascending: false }),
    supabase.from("energy_consumption").select("id, consumption_kwh, cost_amount, recorded_at, created_at")
  ]);

  // Calculate statistics
  const totalEnergyConsumption = energyData?.reduce((sum, e) => sum + parseFloat(e.consumption_kwh || 0), 0) || 0;
  const totalEnergyCost = energyData?.reduce((sum, e) => sum + parseFloat(e.cost_amount || 0), 0) || 0;

  const stats = {
    totalSites: sites?.length || 0,
    activeSites: sites?.filter(s => s.status === 'active').length || 0,
    totalEquipment: equipment?.length || 0,
    operationalEquipment: equipment?.filter(e => e.status === 'operational').length || 0,
    totalInterventions: interventions?.length || 0,
    completedInterventions: interventions?.filter(i => i.status === 'completed').length || 0,
    totalAlerts: alerts?.length || 0,
    activeAlerts: alerts?.filter(a => a.status === 'active').length || 0,
    totalBreakdowns: breakdowns?.length || 0,
    activeBreakdowns: breakdowns?.filter(b => b.status === 'open' || b.status === 'investigating' || b.status === 'in_progress').length || 0,
    totalEnergyConsumption: totalEnergyConsumption,
    totalEnergyCost: totalEnergyCost
  };

  // Prepare chart data
  const siteStatusData = [
    { name: 'Active', value: stats.activeSites, color: '#22c55e' },
    { name: 'Maintenance', value: sites?.filter(s => s.status === 'maintenance').length || 0, color: '#eab308' },
    { name: 'Inactive', value: sites?.filter(s => s.status === 'inactive').length || 0, color: '#6b7280' },
    { name: 'Fault', value: sites?.filter(s => s.status === 'fault').length || 0, color: '#ef4444' }
  ];

  const equipmentStatusData = [
    { name: 'Operational', value: stats.operationalEquipment, color: '#22c55e' },
    { name: 'Maintenance', value: equipment?.filter(e => e.status === 'maintenance').length || 0, color: '#eab308' },
    { name: 'Faulty', value: equipment?.filter(e => e.status === 'faulty').length || 0, color: '#ef4444' },
    { name: 'Offline', value: equipment?.filter(e => e.status === 'offline').length || 0, color: '#6b7280' }
  ];

  const alertsSeverityData = [
    { name: 'Info', value: alerts?.filter(a => a.severity === 'info').length || 0, color: '#3b82f6' },
    { name: 'Warning', value: alerts?.filter(a => a.severity === 'warning').length || 0, color: '#f59e0b' },
    { name: 'Critical', value: alerts?.filter(a => a.severity === 'critical').length || 0, color: '#ef4444' }
  ];

  // Monthly maintenance data
  const monthlyMaintenanceData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthInterventions = interventions?.filter(int => {
      const intDate = new Date(int.created_at);
      return intDate >= monthStart && intDate <= monthEnd;
    }) || [];

    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      scheduled: monthInterventions.filter(i => i.status === 'scheduled').length,
      completed: monthInterventions.filter(i => i.status === 'completed').length,
      total: monthInterventions.length
    };
  });

  // Monthly energy data
  const monthlyEnergyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthEnergy = energyData?.filter(energy => {
      const energyDate = new Date(energy.recorded_at);
      return energyDate >= monthStart && energyDate <= monthEnd;
    }) || [];

    const totalConsumption = monthEnergy.reduce((sum, e) => sum + parseFloat(e.consumption_kwh || 0), 0);
    const totalCost = monthEnergy.reduce((sum, e) => sum + parseFloat(e.cost_amount || 0), 0);

    return {
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      consumption: parseFloat(totalConsumption.toFixed(2)),
      cost: parseFloat(totalCost.toFixed(2))
    };
  });

  // FIXED: Prepare breakdowns data - handle array properly
  const formattedBreakdowns = breakdowns?.map(breakdown => {
    // Handle the sites array - take first element if it exists
    const site = Array.isArray(breakdown.sites) && breakdown.sites.length > 0 
      ? breakdown.sites[0] 
      : breakdown.sites;

    return {
      id: breakdown.id,
      title: breakdown.title,
      type: breakdown.type,
      severity: breakdown.severity,
      status: breakdown.status,
      site_name: site?.name || 'Unknown Site',
      site_code: site?.code || 'N/A',
      impact_users: breakdown.impact_users || 0,
      downtime_start: breakdown.downtime_start,
      resolved_at: breakdown.resolved_at
    };
  }) || [];

  // FIXED: Prepare export data with proper formatting
  const exportData = {
    sites: sites || [],
    equipment: equipment || [],
    interventions: interventions || [],
    alerts: alerts || [],
    breakdowns: breakdowns ? breakdowns.map(b => ({
      ...b,
      site_name: Array.isArray(b.sites) && b.sites.length > 0 ? b.sites[0]?.name : b.sites?.name,
      site_code: Array.isArray(b.sites) && b.sites.length > 0 ? b.sites[0]?.code : b.sites?.code
    })) : [],
    energy: energyData || []
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
            <FileBarChart className="h-8 w-8 text-purple-500" />
            <span>Network Analytics & Reports</span>
          </h2>
          <p className="text-slate-600 mt-1">
            Comprehensive insights and analytics for your telecom network
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Generated: {new Date().toLocaleDateString()}
          </div>
          <ExportButtons data={exportData} />
        </div>
      </div>

      {/* Overview Stats */}
      <ReportsOverview stats={stats} />

      {/* Quick Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-slate-600">Network Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {((stats.activeSites / (stats.totalSites || 1)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">Sites operational</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-slate-600">Equipment Health</p>
                <p className="text-2xl font-bold text-blue-600">
                  {((stats.operationalEquipment / (stats.totalEquipment || 1)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">Equipment operational</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-slate-600">Maintenance Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {((stats.completedInterventions / (stats.totalInterventions || 1)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500">Tasks completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-slate-600">Breakdown Resolution</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.totalBreakdowns > 0
                    ? ((1 - stats.activeBreakdowns / stats.totalBreakdowns) * 100).toFixed(1)
                    : '100'
                  }%
                </p>
                <p className="text-xs text-slate-500">{stats.activeBreakdowns} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-slate-600">Energy Consumption</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.totalEnergyConsumption.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-slate-500">kWh total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SiteStatusChart data={siteStatusData} />
        <EquipmentStatusChart data={equipmentStatusData} />
        <AlertsChart data={alertsSeverityData} />
        <MaintenanceChart data={monthlyMaintenanceData} />
        <EnergyChart data={monthlyEnergyData} />
      </div>

      {/* Breakdowns Report Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span>Breakdowns Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BreakdownsReport 
            breakdowns={formattedBreakdowns} 
            timeRange="all" 
          />
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Network Summary Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalSites}</div>
              <div className="text-sm text-slate-600">Total Sites</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.totalEquipment}</div>
              <div className="text-sm text-slate-600">Equipment Units</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalInterventions}</div>
              <div className="text-sm text-slate-600">Maintenance Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.totalAlerts}</div>
              <div className="text-sm text-slate-600">System Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.totalBreakdowns}</div>
              <div className="text-sm text-slate-600">Network Breakdowns</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {stats.totalEnergyConsumption.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-slate-600">Energy (kWh)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}