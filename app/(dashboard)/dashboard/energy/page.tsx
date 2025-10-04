// app/(dashboard)/dashboard/energy/page.tsx
import { createClient } from "../../../../lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Zap, TrendingUp, DollarSign } from "lucide-react"

export default async function EnergyPage() {
  const supabase = await createClient()
  
  // Get energy data (you can add mock data for testing)
  const { data: energyData } = await supabase
    .from("energy_consumption")
    .select(`*, sites(name, code)`)
    .order("recorded_at", { ascending: false })
    .limit(100)

  // Calculate stats
  const totalConsumption = energyData?.reduce((sum, e) => sum + parseFloat(e.consumption_kwh), 0) || 0
  const totalCost = energyData?.reduce((sum, e) => sum + parseFloat(e.cost_amount || 0), 0) || 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold flex items-center space-x-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          <span>Energy Monitoring</span>
        </h2>
        <p className="text-slate-600 mt-1">Track power consumption across network sites</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Consumption</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {totalConsumption.toFixed(2)} kWh
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg per Site</p>
                <p className="text-2xl font-bold text-blue-600">
                  {energyData?.length ? (totalConsumption / energyData.length).toFixed(2) : 0} kWh
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Table - Simplified for now */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Energy Readings</CardTitle>
        </CardHeader>
        <CardContent>
          {energyData?.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              No energy data yet. Add your first reading to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {energyData?.slice(0, 10).map((record) => (
                <div key={record.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium">{record.sites?.name}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-yellow-600">{record.consumption_kwh} kWh</p>
                    {record.cost_amount && (
                      <p className="text-sm text-slate-500">${record.cost_amount}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}