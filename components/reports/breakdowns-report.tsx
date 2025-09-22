"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { MapPin, Clock, Users, AlertTriangle } from "lucide-react";

interface Breakdown {
  id: string;
  title: string;
  type: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'open' | 'investigating' | 'in_progress' | 'resolved' | 'closed';
  site_name: string;
  site_code: string;
  impact_users?: number;
  downtime_start?: string;
  resolved_at?: string;
}

interface BreakdownsReportProps {
  breakdowns: Breakdown[];
  timeRange: string; // "today", "week", "month", "year"
}

const severityColors = {
  minor: "bg-yellow-100 text-yellow-800",
  major: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

const statusColors = {
  open: "bg-red-100 text-red-800",
  investigating: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800"
};

export function BreakdownsReport({ breakdowns, timeRange }: BreakdownsReportProps) {
  const getTimeElapsed = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const hours = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const getResolutionTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Calculate statistics
  const stats = {
    total: breakdowns.length,
    open: breakdowns.filter(b => b.status === 'open').length,
    inProgress: breakdowns.filter(b => b.status === 'in_progress' || b.status === 'investigating').length,
    resolved: breakdowns.filter(b => b.status === 'resolved' || b.status === 'closed').length,
    critical: breakdowns.filter(b => b.severity === 'critical').length,
    averageResolutionTime: breakdowns.filter(b => b.resolved_at).length > 0 ? 
      breakdowns.filter(b => b.resolved_at)
        .reduce((acc, b) => {
          const start = new Date(b.downtime_start!);
          const end = new Date(b.resolved_at!);
          return acc + (end.getTime() - start.getTime());
        }, 0) / breakdowns.filter(b => b.resolved_at).length : 0
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Breakdowns</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            <div className="text-sm text-gray-500">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-500">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-gray-500">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.averageResolutionTime > 0 ? 
                `${Math.floor(stats.averageResolutionTime / (1000 * 60 * 60))}h` : 'N/A'
              }
            </div>
            <div className="text-sm text-gray-500">Avg. Resolution</div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Breakdowns Report ({timeRange})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Resolution Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdowns.map((breakdown) => (
                <TableRow key={breakdown.id}>
                  <TableCell className="font-medium">{breakdown.title}</TableCell>
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
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{breakdown.site_name} ({breakdown.site_code})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {breakdown.impact_users ? (
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span>{breakdown.impact_users.toLocaleString()} users</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {breakdown.downtime_start && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{getTimeElapsed(breakdown.downtime_start)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {breakdown.resolved_at && breakdown.downtime_start ? (
                      <span className="text-green-600 font-medium">
                        {getResolutionTime(breakdown.downtime_start, breakdown.resolved_at)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {breakdowns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No breakdowns reported in this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}