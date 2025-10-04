/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { LogOut, Search, Wifi, Activity } from "lucide-react";
import { NotificationDropdown } from "./header/notification-dropdown";
import { useState, useEffect } from 'react';

interface HeaderProps {
  user: any;
  profile: any;
}

export function Header({ user, profile }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [alerts, setAlerts] = useState([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch active alerts
  useEffect(() => {
    const fetchAlerts = async () => {
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
        .limit(10);

      if (data) setAlerts(data);
    };

    fetchAlerts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Activity className="h-6 w-6 text-blue-500" />
            <span>Network Operations Center</span>
          </h1>
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Wifi className="h-3 w-3 text-green-500" />
              <span>Network Status: Operational</span>
            </div>
            <div className="text-xs text-slate-400">
              Last Updated: {currentTime || 'Loading...'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search sites, equipment..."
            className="pl-10 pr-4 py-2 w-64 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
          />
        </div>
        
        {/* Notifications */}
        <NotificationDropdown initialAlerts={alerts} />
        
        {/* User info */}
        {profile && (
          <div className="text-sm text-slate-700 hidden md:block">
            {profile.full_name || profile.email}
          </div>
        )}
        
        {/* Logout */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </header>
  );
}