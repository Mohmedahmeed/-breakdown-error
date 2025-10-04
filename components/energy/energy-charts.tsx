"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

interface EnergyRecord {
  id: string;
  site_id: string;
  consumption_kwh: number;
  cost_amount?: number;
  recorded_at: string;
  period_start: string;
  period_end: string;
  sites?: {
    name: string;
    code: string;
  };
}

interface EnergyChartsProps {
  energyData: EnergyRecord[];
}

export function EnergyCharts({ energyData }: EnergyChartsProps) {
  // Prepare data for consumption trends over time
  const getTrendData = () => {
    // Group by month
    const monthlyData: { [key: string]: { consumption: number; cost: number; count: number } } = {};

    energyData.forEach(record => {
      const date = new Date(record.recorded_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { consumption: 0, cost: 0, count: 0 };
      }

      monthlyData[monthKey].consumption += parseFloat(record.consumption_kwh.toString());
      monthlyData[monthKey].cost += parseFloat(record.cost_amount?.toString() || '0');
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        consumption: parseFloat(data.consumption.toFixed(2)),
        cost: parseFloat(data.cost.toFixed(2)),
        avgConsumption: parseFloat((data.consumption / data.count).toFixed(2))
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  // Prepare data for consumption by site
  const getSiteComparisonData = () => {
    const siteData: { [key: string]: { consumption: number; cost: number; siteName: string } } = {};

    energyData.forEach(record => {
      if (!record.sites) return;

      const siteKey = record.site_id;

      if (!siteData[siteKey]) {
        siteData[siteKey] = {
          consumption: 0,
          cost: 0,
          siteName: record.sites.name
        };
      }

      siteData[siteKey].consumption += parseFloat(record.consumption_kwh.toString());
      siteData[siteKey].cost += parseFloat(record.cost_amount?.toString() || '0');
    });

    return Object.values(siteData)
      .map(data => ({
        site: data.siteName,
        consumption: parseFloat(data.consumption.toFixed(2)),
        cost: parseFloat(data.cost.toFixed(2))
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10); // Top 10 sites
  };

  const trendData = getTrendData();
  const siteComparisonData = getSiteComparisonData();

  if (energyData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span>Consumption Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500">
              No data available for charts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <span>Consumption by Site</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500">
              No data available for charts
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Consumption Trends Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span>Consumption Trends (Last 6 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Total Consumption (kWh)"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="avgConsumption"
                stroke="#10b981"
                strokeWidth={2}
                name="Avg Consumption (kWh)"
                dot={{ fill: '#10b981', r: 4 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Consumption by Site */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-500" />
            <span>Consumption by Site (Top 10)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={siteComparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="site"
                stroke="#64748b"
                fontSize={11}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar
                dataKey="consumption"
                fill="#10b981"
                name="Consumption (kWh)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
