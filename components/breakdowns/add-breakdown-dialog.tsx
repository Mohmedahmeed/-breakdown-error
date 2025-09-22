/* eslint-disable @typescript-eslint/no-explicit-any */
// components/breakdowns/add-breakdown-dialog.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AddBreakdownDialogProps {
  children: React.ReactNode;
  sites: any[];
  equipment: any[];
  users: any[];
}

export function AddBreakdownDialog({ children, sites, equipment, users }: AddBreakdownDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    severity: "",
    priority: "medium",
    status: "open",
    site_id: "",
    equipment_id: "none", // Using "none" instead of empty string
    assigned_to: "none", // Using "none" instead of empty string
    impact_users: 0,
    estimated_fix_time: ""
  });
  
  const router = useRouter();
  const supabase = createClient();

  const filteredEquipment = equipment.filter(eq => 
    selectedSite ? eq.site_id === selectedSite : false
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('breakdowns')
        .insert([{
          title: formData.title,
          description: formData.description,
          type: formData.type,
          severity: formData.severity,
          priority: formData.priority,
          status: formData.status,
          site_id: formData.site_id,
          equipment_id: formData.equipment_id === "none" ? null : formData.equipment_id,
          assigned_to: formData.assigned_to === "none" ? null : formData.assigned_to,
          reported_by: user?.id,
          impact_users: formData.impact_users || 0,
          estimated_fix_time: formData.estimated_fix_time ? 
            `PT${formData.estimated_fix_time}H` : null,
          downtime_start: new Date().toISOString()
        }]);
        
      if (error) throw error;
      
      setOpen(false);
      setSelectedSite("");
      setFormData({
        title: "",
        description: "",
        type: "",
        severity: "",
        priority: "medium",
        status: "open",
        site_id: "",
        equipment_id: "none",
        assigned_to: "none",
        impact_users: 0,
        estimated_fix_time: ""
      });
      router.refresh();
    } catch (error) {
      console.error('Error creating breakdown:', error);
      alert('Error creating breakdown. Please check all fields and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report New Breakdown</DialogTitle>
          <DialogDescription>
            Report a network breakdown or failure. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Breakdown Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Power failure at main antenna"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the breakdown..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Breakdown Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="power_outage">Power Outage</SelectItem>
                  <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                  <SelectItem value="network_issue">Network Issue</SelectItem>
                  <SelectItem value="connectivity_loss">Connectivity Loss</SelectItem>
                  <SelectItem value="software_malfunction">Software Malfunction</SelectItem>
                  <SelectItem value="hardware_defect">Hardware Defect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_id">Affected Site *</Label>
            <Select
              value={formData.site_id}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, site_id: value, equipment_id: "none" }));
                setSelectedSite(value);
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name} ({site.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedSite && (
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Affected Equipment (Optional)</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific equipment</SelectItem>
                  {filteredEquipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To (Optional)</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="impact_users">Impacted Users</Label>
              <Input
                id="impact_users"
                type="number"
                min="0"
                value={formData.impact_users}
                onChange={(e) => setFormData(prev => ({ ...prev, impact_users: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated_fix_time">Est. Fix Time (hours)</Label>
              <Input
                id="estimated_fix_time"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.estimated_fix_time}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_fix_time: e.target.value }))}
                placeholder="2"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Reporting..." : "Report Breakdown"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}