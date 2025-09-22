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
import { Edit, Trash2, MapPin, User, Calendar, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { EditBreakdownDialog } from "./edit-breakdown-dialog";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Breakdown {
  id: string;
  title: string;
  description?: string;
  type: 'power_outage' | 'equipment_failure' | 'network_issue' | 'connectivity_loss' | 'software_malfunction' | 'hardware_defect';
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'investigating' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reported_at: string;
  downtime_start?: string;
  downtime_end?: string;
  impact_users?: number;
  estimated_fix_time?: string;
  actual_fix_time?: string;
  site_id: string;
  equipment_id?: string;
  sites: {
    name: string;
    code: string;
  };
  equipment?: {
    name: string;
  };
  reported_by_profile?: {
    full_name: string;
  };
  assigned_to_profile?: {
    full_name: string;
  };
}

interface BreakdownsTableProps {
  breakdowns: Breakdown[];
  sites: any[];
  equipment: any[];
  users: any[];
}

const statusColors = {
  open: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  investigating: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

const severityColors = {
  minor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  major: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const typeColors = {
  power_outage: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  equipment_failure: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  network_issue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  connectivity_loss: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  software_malfunction: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  hardware_defect: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

export function BreakdownsTable({ breakdowns, sites, equipment, users }: BreakdownsTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const updateStatus = async (breakdownId: string, newStatus: string) => {
    setIsUpdating(breakdownId);
    try {
      const updateData: any = { status: newStatus };
      
      // Auto-set timestamps based on status
      if (newStatus === 'investigating') {
        updateData.acknowledged_at = new Date().toISOString();
      } else if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.downtime_end = new Date().toISOString();
      } else if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('breakdowns')
        .update(updateData)
        .eq('id', breakdownId);
        
      if (error) throw error;
      
      router.refresh();
    } catch (error) {
      console.error('Error updating breakdown status:', error);
      alert('Error updating breakdown status. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteBreakdown = async (breakdownId: string) => {
    if (!confirm('Are you sure you want to delete this breakdown record?')) return;
    
    setIsDeleting(breakdownId);
    try {
      const { error } = await supabase
        .from('breakdowns')
        .delete()
        .eq('id', breakdownId);
        
      if (error) throw error;
      
      router.refresh();
    } catch (error) {
      console.error('Error deleting breakdown:', error);
      alert('Error deleting breakdown. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDuration = (duration: string) => {
    if (!duration) return 'N/A';
    // Parse ISO duration format (PT2H30M -> 2h 30m)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return duration;
    const hours = match[1] ? `${match[1]}h` : '';
    const minutes = match[2] ? `${match[2]}m` : '';
    return `${hours} ${minutes}`.trim() || '0m';
  };

  const calculateDowntime = (start: string, end: string | undefined) => {
    if (!start) return 'N/A';
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Network Breakdowns & Outages ({breakdowns.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdowns.map((breakdown) => (
                <TableRow key={breakdown.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{breakdown.title}</div>
                      {breakdown.description && (
                        <div className="text-sm text-slate-500 max-w-xs truncate">
                          {breakdown.description}
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(breakdown.reported_at).toLocaleDateString()}</span>
                        <span>{new Date(breakdown.reported_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={typeColors[breakdown.type]}>
                      {breakdown.type.replace('_', ' ')}
                    </Badge>
                    <div className="text-xs text-slate-500 mt-1">
                      <Badge variant="outline" className={priorityColors[breakdown.priority]}>
                        {breakdown.priority}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={severityColors[breakdown.severity]}>
                      {breakdown.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[breakdown.status]}>
                      {breakdown.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">
                        {breakdown.sites.name} ({breakdown.sites.code})
                      </span>
                    </div>
                    {breakdown.equipment && (
                      <div className="text-xs text-slate-500 mt-1">
                        Equipment: {breakdown.equipment.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-red-600">
                        {breakdown.impact_users?.toLocaleString() || 0} users
                      </div>
                      {breakdown.estimated_fix_time && (
                        <div className="text-xs text-slate-500">
                          Est: {formatDuration(breakdown.estimated_fix_time)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>
                        {calculateDowntime(breakdown.downtime_start || breakdown.reported_at, breakdown.downtime_end)}
                      </span>
                    </div>
                    {breakdown.actual_fix_time && (
                      <div className="text-xs text-green-600">
                        Fixed: {formatDuration(breakdown.actual_fix_time)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">
                        {breakdown.assigned_to_profile?.full_name || 'Unassigned'}
                      </span>
                    </div>
                    {breakdown.reported_by_profile && (
                      <div className="text-xs text-slate-500">
                        Reported by: {breakdown.reported_by_profile.full_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {/* Quick status update buttons */}
                      {breakdown.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(breakdown.id, 'investigating')}
                          disabled={isUpdating === breakdown.id}
                          className="hover:bg-yellow-50 text-xs"
                        >
                          Investigate
                        </Button>
                      )}
                      {breakdown.status === 'investigating' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(breakdown.id, 'in_progress')}
                          disabled={isUpdating === breakdown.id}
                          className="hover:bg-blue-50 text-xs"
                        >
                          Start Fix
                        </Button>
                      )}
                      {(breakdown.status === 'in_progress' || breakdown.status === 'investigating') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(breakdown.id, 'resolved')}
                          disabled={isUpdating === breakdown.id}
                          className="hover:bg-green-50 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                      
                      <EditBreakdownDialog 
                        breakdown={breakdown} 
                        sites={sites}
                        equipment={equipment}
                        users={users}
                      >
                        <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </EditBreakdownDialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBreakdown(breakdown.id)}
                        disabled={isDeleting === breakdown.id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {breakdowns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    No breakdowns reported. Your network is running smoothly! 🎉
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}