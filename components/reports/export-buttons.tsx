"use client";

import { Button } from "../ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

// Define proper TypeScript interfaces
interface Site {
  id: string;
  name: string;
  status: string;
  type: string;
  created_at: string;
}

interface Equipment {
  id: string;
  name: string;
  status: string;
  type: string;
  site_id: string;
  created_at: string;
}

interface Intervention {
  id: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  scheduled_date: string;
  completed_date: string;
  created_at: string;
  sites: { name: string };
  equipment: { name: string };
}

interface Alert {
  id: string;
  severity: string;
  status: string;
  type: string;
  created_at: string;
}

interface Breakdown {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  priority: string;
  impact_users: number;
  downtime_start: string;
  resolved_at: string;
  sites: { name: string; code: string };
}

interface Energy {
  id: string;
  consumption_kwh: number;
  cost_amount: number;
  recorded_at: string;
  created_at: string;
}

interface ExportButtonsProps {
  data: {
    sites: Site[] | null;
    equipment: Equipment[] | null;
    interventions: Intervention[] | null;
    alerts: Alert[] | null;
    breakdowns?: Breakdown[] | null;
    energy?: Energy[] | null;
  };
}

export function ExportButtons({ data }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Safe CSV export function
  const exportToCSV = (dataArray: any[] | null, filename: string) => {
    if (!dataArray || dataArray.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      // Flatten nested objects for CSV
      const flattenedData = dataArray.map(item => {
        const flattened: any = {};
        Object.keys(item).forEach(key => {
          const value = item[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Flatten nested objects (like sites, equipment)
            Object.keys(value).forEach(nestedKey => {
              flattened[`${key}_${nestedKey}`] = value[nestedKey];
            });
          } else {
            flattened[key] = value;
          }
        });
        return flattened;
      });

      const headers = Object.keys(flattenedData[0]).join(",");
      const csvContent = [
        headers,
        ...flattenedData.map(row => 
          Object.values(row).map(value => {
            // Handle different value types for CSV
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Escape quotes and handle commas
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"` 
              : stringValue;
          }).join(",")
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed:", error);
      alert("Failed to export CSV. Please try again.");
    }
  };

  // Generate comprehensive JSON report
  const generateReport = async () => {
    setIsExporting(true);
    try {
      const totalEnergyConsumption = data.energy?.reduce((sum, e) => sum + parseFloat(String(e.consumption_kwh || 0)), 0) || 0;
      const totalEnergyCost = data.energy?.reduce((sum, e) => sum + parseFloat(String(e.cost_amount || 0)), 0) || 0;

      const reportData = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalSites: data.sites?.length || 0,
          activeSites: data.sites?.filter(s => s.status === 'active').length || 0,
          totalEquipment: data.equipment?.length || 0,
          operationalEquipment: data.equipment?.filter(e => e.status === 'operational').length || 0,
          totalInterventions: data.interventions?.length || 0,
          completedInterventions: data.interventions?.filter(i => i.status === 'completed').length || 0,
          totalAlerts: data.alerts?.length || 0,
          activeAlerts: data.alerts?.filter(a => a.status === 'active').length || 0,
          totalBreakdowns: data.breakdowns?.length || 0,
          activeBreakdowns: data.breakdowns?.filter(b =>
            b.status === 'open' || b.status === 'investigating' || b.status === 'in_progress'
          ).length || 0,
          totalEnergyConsumption: totalEnergyConsumption,
          totalEnergyCost: totalEnergyCost,
          totalEnergyRecords: data.energy?.length || 0,
        },
        sites: data.sites || [],
        equipment: data.equipment || [],
        interventions: data.interventions || [],
        alerts: data.alerts || [],
        breakdowns: data.breakdowns || [],
        energy: data.energy || []
      };

      const jsonContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `telecom-report-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToCSV(data.sites, "sites")}
        disabled={!data.sites?.length}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Sites CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToCSV(data.equipment, "equipment")}
        disabled={!data.equipment?.length}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Equipment CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToCSV(data.interventions, "interventions")}
        disabled={!data.interventions?.length}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Maintenance CSV
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportToCSV(data.alerts, "alerts")}
        disabled={!data.alerts?.length}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Alerts CSV
      </Button>

      {data.breakdowns && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(data.breakdowns, "breakdowns")}
          disabled={!data.breakdowns.length}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Breakdowns CSV
        </Button>
      )}

      {data.energy && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(data.energy, "energy")}
          disabled={!data.energy.length}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Energy CSV
        </Button>
      )}

      <Button
        onClick={generateReport}
        disabled={isExporting}
        className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? "Generating..." : "Full Report"}
      </Button>
    </div>
  );
}