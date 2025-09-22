/* eslint-disable @typescript-eslint/no-explicit-any */
// components/breakdowns/breakdowns-table.tsx
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
import { Edit, Trash2, MapPin, User, AlertCircle, Clock, Users } from "lucide-react";
import { useState } from "react";
import { EditBreakdownDialog } from "./edit-breakdown-dialog";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

interface Site {
  id: string;
  name: string;
  code: string;
}

interface Equipment {
  id: string;
  name: string;
  site_id: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface Breakdown {
  id: string;
  title: string;
  description?: string;
  type: string;
  severity: 'minor' | 'major' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'in_progress' | 'resolved' | 'closed';
  site_id: string;
  equipment_id?: string;
  assigned_to?: string;
  reported_by?: string;
  reported_at?: string;
  resolved_at?: string;
  closed_at?: string;
  acknowledged_at?: string;
  impact_users?: number;
  estimated_fix_time?: string;
  downtime_start?: string;
  downtime_end?: string;
  sites: {
    name: string;
    code: string;
  };
  equipment?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface BreakdownsTableProps {
  breakdowns: Breakdown[];
  sites: Site[];
  equipment: Equipment[];
  users: User[];
}

const statusColors = {
  open: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  investigating: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
};

const severityColors = {
  minor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  major: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
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
      const updates: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'investigating') {
        updates.acknowledged_at = new Date().toISOString();
      }
      
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.downtime_end = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updates.assigned_to = user?.id;
      }
      
      if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('breakdowns')
        .update(updates)
        .eq('id', breakdownId);
        
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      router.refresh();
    } catch (error: unknown) {
      const err = error as any;
      console.error('Error updating breakdown status:', err?.message || 'Unknown error', err);
      alert(`Error updating status: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsUpdating(null);
    }
  };

  const deleteBreakdown = async (breakdownId: string) => {
    setIsDeleting(breakdownId);
    try {
      const { error } = await supabase
        .from('breakdowns')
        .delete()
        .eq('id', breakdownId);
        
      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      router.refresh();
    } catch (error: unknown) {
      const err = error as any;
      console.error('Error deleting breakdown:', err?.message || 'Unknown error', err);
      alert(`Error deleting breakdown: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const getTimeElapsed = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const hours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Network Breakdowns ({breakdowns.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Duration</TableHead>
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
                      {breakdown.equipment && (
                        <div className="text-xs text-slate-400">
                          Equipment: {breakdown.equipment.name}
                        </div>
                      )}
                      {breakdown.assigned_to && (
                        <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                          <User className="h-3 w-3" />
                          <span>Assigned: {breakdown.profiles?.full_name || 'User'}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={severityColors[breakdown.severity]}>
                      {breakdown.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[breakdown.priority]}>
                      {breakdown.priority}
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
                  </TableCell>
                  <TableCell>
                    {breakdown.impact_users ? (
                      <div className="flex items-center space-x-1 text-sm">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-600">
                          {breakdown.impact_users.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {breakdown.downtime_start && (
                      <div className="flex items-center space-x-1 text-sm">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          {getTimeElapsed(breakdown.downtime_start)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
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
                      {breakdown.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(breakdown.id, 'investigating')}
                          disabled={isUpdating === breakdown.id}
                          className="hover:bg-yellow-50"
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
                          className="hover:bg-blue-50"
                        >
                          Start
                        </Button>
                      )}
                      {breakdown.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(breakdown.id, 'resolved')}
                          disabled={isUpdating === breakdown.id}
                          className="hover:bg-green-50"
                        >
                          Resolve
                        </Button>
                      )}
                      {breakdown.status === 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(breakdown.id, 'closed')}
                          disabled={isUpdating === breakdown.id}
                          className="hover:bg-gray-50"
                        >
                          Close
                        </Button>
                      )}
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
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    No breakdowns reported. Network is operating normally! 🎉
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