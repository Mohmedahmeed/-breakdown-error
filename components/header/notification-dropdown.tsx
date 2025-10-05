"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, AlertTriangle, CheckCircle, Clock, X } from "lucide-react"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { createClient } from "../../lib/supabase/client"
import { playNotificationSound } from "../../lib/notification-sound"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Alert {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved'
  created_at: string
  sites?: { name: string }
}

export function NotificationDropdown({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [lastAlertCheck, setLastAlertCheck] = useState([])
  const router = useRouter()
  const supabase = createClient()

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
  }, [])

  const updateAlerts = useCallback(async (playSound: boolean = true) => {
    try {
      const { data } = await supabase
        .from("alerts")
        .select(`
          id,
          title,
          message,
          severity,
          status,
          created_at,
          sites(name)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10)

      if (data) {
        if (playSound) {
          const newCriticalAlerts = data.filter(
            alert => alert.severity === 'critical' && 
            !lastAlertCheck.includes(alert.id)
          )
          
          if (newCriticalAlerts.length > 0) {
            playNotificationSound()
            
            if ('Notification' in window && Notification.permission === 'granted') {
              newCriticalAlerts.forEach(alert => {
                new Notification(alert.title, {
                  body: alert.message,
                  icon: '/logo.png',
                  tag: alert.id,
                  requireInteraction: true
                })
              })
            }
          }
        }
        
        setAlerts(data)
        setLastAlertCheck(data.map(a => a.id))
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }, [supabase, lastAlertCheck])

  useEffect(() => {
    if (!isOpen) return
    updateAlerts(false)
    const interval = setInterval(() => updateAlerts(false), 10000)
    return () => clearInterval(interval)
  }, [isOpen, updateAlerts])

  useEffect(() => {
    const interval = setInterval(() => updateAlerts(true), 30000)
    return () => clearInterval(interval)
  }, [updateAlerts])

  useEffect(() => {
    setLastAlertCheck(initialAlerts.map(a => a.id))
  }, [initialAlerts])

  const activeCount = alerts.filter(a => a.status === 'active').length

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' }
      case 'warning':
        return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' }
      default:
        return { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50' }
    }
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleAlertClick = useCallback((alertId: string) => {
    closeDropdown()
    router.push('/dashboard/alerts')
  }, [closeDropdown, router])

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="relative hover:bg-slate-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {activeCount > 9 ? '9+' : activeCount}
          </span>
        )}
      </Button>

      {/* DROPDOWN WITH FACEBOOK-STYLE DESIGN */}
      {isOpen && (
        <>
          {/* BACKDROP */}
          <div
            className="fixed inset-0"
            style={{
              zIndex: 99998,
              backgroundColor: 'transparent'
            }}
            onClick={closeDropdown}
          />

          {/* DROPDOWN PANEL - FACEBOOK STYLE */}
          <div
            className="absolute right-0 mt-3 w-[360px] rounded-xl overflow-hidden flex flex-col"
            style={{
              zIndex: 99999,
              maxHeight: '600px',
              backgroundColor: '#ffffff',
              boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Header - Facebook Style */}
            <div className="px-4 py-3 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            </div>

            {/* Active Count Badge */}
            {activeCount > 0 && (
              <div className="px-4 pb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  {activeCount} active alert{activeCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Content - Scrollable */}
            <div
              className="overflow-y-auto flex-1"
              style={{
                backgroundColor: '#ffffff',
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f9fafb'
              }}
            >
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-semibold text-lg mb-1">All clear!</p>
                  <p className="text-sm text-gray-500">No active alerts at the moment</p>
                </div>
              ) : (
                <div>
                  {alerts.map((alert) => {
                    const config = getSeverityConfig(alert.severity)
                    const Icon = config.icon

                    return (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.id)}
                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                              alert.severity === 'critical' ? 'bg-red-100' :
                              alert.severity === 'warning' ? 'bg-orange-100' :
                              'bg-blue-100'
                            }`}
                          >
                            <Icon className={`h-6 w-6 ${
                              alert.severity === 'critical' ? 'text-red-600' :
                              alert.severity === 'warning' ? 'text-orange-600' :
                              'text-blue-600'
                            }`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-[15px] leading-tight">
                                {alert.title}
                              </h4>
                            </div>

                            <p className="text-[13px] text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                              {alert.message}
                            </p>

                            {/* Meta Info */}
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium ${
                                alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                alert.severity === 'warning' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {alert.severity.toUpperCase()}
                              </span>

                              <span className="text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo(alert.created_at)}
                              </span>

                              {alert.sites && (
                                <span className="text-gray-500 flex items-center gap-1">
                                  <span>📍</span>
                                  {alert.sites.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer - View All Link */}
            {alerts.length > 0 && (
              <div className="border-t border-gray-200">
                <Link
                  href="/dashboard/alerts"
                  onClick={closeDropdown}
                  className="block px-4 py-3 text-center text-sm font-semibold text-blue-600 hover:bg-gray-50 transition-colors"
                >
                  See all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}