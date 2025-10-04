"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Edit, Trash2, MapPin, Calendar, Zap, DollarSign } from "lucide-react";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { EditEnergyDialog } from "./edit-energy-dialog";

interface EnergyRecord {
  id: string;
  site_id: string;
  equipment_id?: string;
  consumption_kwh: number;
  cost_amount?: number;
  recorded_at: string;
  period_start: string;
  period_end: string;
  sites?: {
    id: string;
    name: string;
    code: string;
  };
  equipment?: {
    id: string;
    name: string;
  };
}

interface EnergyTableProps {
  energyData: EnergyRecord[];
  sites: any[];
  equipment: any[];
}

// Color-coded badges based on consumption levels
const getConsumptionBadge = (kwh: number) => {
  if (kwh > 1000) {
    return <Badge className="bg-red-100 text-red-800">High ({kwh.toLocaleString()} kWh)</Badge>;
  } else if (kwh >= 500) {
    return <Badge className="bg-orange-100 text-orange-800">Medium ({kwh.toLocaleString()} kWh)</Badge>;
  } else {
    return <Badge className="bg-green-100 text-green-800">Normal ({kwh.toLocaleString()} kWh)</Badge>;
  }
};

// Highlight high cost records
const getCostBadge = (cost?: number) => {
  if (!cost) return <span className="text-sm text-slate-500">N/A</span>;

  const costClass = cost > 500 ? "text-red-600 font-bold" : "text-green-600";
  return (
    <span className={`text-sm ${costClass}`}>
      {cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND
    </span>
  );
};

// Calculate duration and consumption per day
const calculateDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export function EnergyTable({ energyData, sites, equipment }: EnergyTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<EnergyRecord | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const deleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this energy record?")) {
      return;
    }

    setIsDeleting(recordId);
    try {
      const { error } = await supabase
        .from('energy_consumption')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error('Error deleting energy record:', error);
      alert('Error deleting energy record. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Energy Consumption Records ({energyData.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>kWh/Day</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {energyData.map((record) => {
                  const duration = calculateDuration(record.period_start, record.period_end);
                  const kwhPerDay = duration > 0 ? (record.consumption_kwh / duration).toFixed(2) : "0";

                  return (
                    <TableRow key={record.id} className="hover:bg-slate-50">
                      <TableCell>
                        {record.sites && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <div>
                              <div className="font-medium">{record.sites.name}</div>
                              <div className="text-xs text-slate-500">{record.sites.code}</div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.equipment ? (
                          <span className="text-sm">{record.equipment.name}</span>
                        ) : (
                          <span className="text-sm text-slate-400 italic">All equipment</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getConsumptionBadge(record.consumption_kwh)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          {getCostBadge(record.cost_amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(record.period_start).toLocaleDateString()}</div>
                          <div className="text-slate-500">to</div>
                          <div>{new Date(record.period_end).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {duration} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-blue-600">
                          {kwhPerDay} kWh
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(record.recorded_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRecord(record)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRecord(record.id)}
                            disabled={isDeleting === record.id}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {energyData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No energy data recorded yet. Click "Record Energy" to add your first entry! ⚡
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingRecord && (
        <EditEnergyDialog
          record={editingRecord}
          sites={sites}
          equipment={equipment}
          open={!!editingRecord}
          onOpenChange={(open) => !open && setEditingRecord(null)}
        />
      )}
    </>
  );
}
