// components/alerts/alerts-table-live.tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "../../lib/supabase/client"
import { AlertsTable } from "./alerts-table"

export function AlertsTableLive({ initialAlerts, sites, equipment }) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const supabase = createClient()

  useEffect(() => {
    // Simple polling every 10 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("alerts")
        .select(`*, sites(name, code), equipment(name)`)
        .order("created_at", { ascending: false })
      
      if (data) setAlerts(data)
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [supabase])

  return <AlertsTable alerts={alerts} sites={sites} equipment={equipment} />
}