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

      {/* DROPDOWN WITH PORTAL-LIKE BEHAVIOR */}
      {isOpen && (
        <>
          {/* SUPER HIGH Z-INDEX BACKDROP */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            style={{ 
              zIndex: 99998,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            onClick={closeDropdown}
          />

          {/* DROPDOWN PANEL WITH HIGHEST Z-INDEX */}
          <div 
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ 
              zIndex: 99999,
              maxHeight: '80vh',
              position: 'absolute',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Header */}
            <div 
              className="p-4 border-b border-slate-200 flex items-center justify-between"
              style={{ backgroundColor: '#f8fafc' }}
            >
              <div>
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                <p className="text-xs text-slate-500">
                  {activeCount} active alert{activeCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeDropdown}
                className="hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div 
              className="overflow-y-auto flex-1"
              style={{ backgroundColor: '#ffffff' }}
            >
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">All clear!</p>
                  <p className="text-sm text-slate-500 mt-1">No active alerts at the moment</p>
                </div>
              ) : (
                <div>
                  {alerts.map((alert, index) => {
                    const config = getSeverityConfig(alert.severity)
                    const Icon = config.icon

                    return (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.id)}
                        className={`p-4 cursor-pointer transition-colors border-l-4 ${
                          alert.severity === 'critical' ? 'border-l-red-500 hover:bg-red-50' :
                          alert.severity === 'warning' ? 'border-l-orange-500 hover:bg-orange-50' :
                          'border-l-blue-500 hover:bg-blue-50'
                        } ${index < alerts.length - 1 ? 'border-b border-slate-100' : ''}`}
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${config.bg}`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-slate-900 text-sm leading-tight">
                                {alert.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`shrink-0 text-xs ${
                                  alert.severity === 'critical' ? 'border-red-500 text-red-700 bg-red-50' :
                                  alert.severity === 'warning' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                                  'border-blue-500 text-blue-700 bg-blue-50'
                                }`}
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                              {alert.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              {alert.sites && (
                                <span className="text-xs text-slate-500 flex items-center">
                                  <span className="mr-1">📍</span>
                                  {alert.sites.name}
                                </span>
                              )}
                              <span className="text-xs text-slate-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {timeAgo(alert.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div 
                className="p-3 border-t border-slate-200"
                style={{ backgroundColor: '#f8fafc' }}
              >
                <Link href="/dashboard/alerts" onClick={closeDropdown}>
                  <Button variant="ghost" className="w-full text-sm hover:bg-slate-200">
                    View All Alerts →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}