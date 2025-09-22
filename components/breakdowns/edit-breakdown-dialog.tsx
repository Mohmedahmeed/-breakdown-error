"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

interface EditBreakdownDialogProps {
  breakdown: any;
  sites: any[];
  equipment: any[];
  users: any[];
  children: React.ReactNode;
}

export function EditBreakdownDialog({ breakdown, sites, equipment, users, children }: EditBreakdownDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSite, setSelectedSite] = useState(breakdown.site_id);
  const [formData, setFormData] = useState({
    title: breakdown.title,
    description: breakdown.description || "",
    type: breakdown.type,
    severity: breakdown.severity,
    priority: breakdown.priority,
    status: breakdown.status,
    site_id: breakdown.site_id,
    equipment_id: breakdown.equipment_id || "",
    assigned_to: breakdown.assigned_to || "",
    impact_users: breakdown.impact_users?.toString() || "",
    downtime_start: breakdown.downtime_start ? 
      new Date(breakdown.downtime_start).toISOString().slice(0, 16) : "",
    downtime_end: breakdown.downtime_end ? 
      new Date(breakdown.downtime_end).toISOString().slice(0, 16) : "",
    estimated_fix_time: breakdown.estimated_fix_time ? 
      parseInt(breakdown.estimated_fix_time.replace('PT', '').replace('H', '')) : "",
    root_cause: breakdown.root_cause || "",
    resolution_notes: breakdown.resolution_notes || ""
  });
  
  const router = useRouter();
  const supabase = createClient();

  const filteredEquipment = equipment.filter(eq => eq.site_id === selectedSite);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        severity: formData.severity,
        priority: formData.priority,
        status: formData.status,
        site_id: formData.site_id,
        equipment_id: formData.equipment_id || null,
        assigned_to: formData.assigned_to || null,
        impact_users: formData.impact_users ? parseInt(formData.impact_users) : 0,
        downtime_start: formData.downtime_start || null,
        downtime_end: formData.downtime_end || null,
        estimated_fix_time: formData.estimated_fix_time ? 
          `PT${formData.estimated_fix_time}H` : null,
        root_cause: formData.root_cause || null,
        resolution_notes: formData.resolution_notes || null
      };

      // Auto-set timestamps based on status changes
      if (formData.status === 'investigating' && breakdown.status !== 'investigating') {
        updateData.acknowledged_at = new Date().toISOString();
      } else if (formData.status === 'resolved' && breakdown.status !== 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        if (!formData.downtime_end) {
          updateData.downtime_end = new Date().toISOString();
        }
      } else if (formData.status === 'closed' && breakdown.status !== 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('breakdowns')
        .update(updateData)
        .eq('id', breakdown.id);
        
      if (error) throw error;
      
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating breakdown:', error);
      alert('Error updating breakdown. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Breakdown Details</DialogTitle>
          <DialogDescription>
            Update breakdown information and track resolution progress. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Incident Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_id">Affected Site *</Label>
            <Select
              value={formData.site_id}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, site_id: value, equipment_id: "" }));
                setSelectedSite(value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
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
              <Label htmlFor="equipment_id">Affected Equipment</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No specific equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific equipment</SelectItem>
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
            <Label htmlFor="assigned_to">Assigned To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="impact_users">Affected Users</Label>
              <Input
                id="impact_users"
                type="number"
                min="0"
                value={formData.impact_users}
                onChange={(e) => setFormData(prev => ({ ...prev, impact_users: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="downtime_start">Downtime Started</Label>
              <Input
                id="downtime_start"
                type="datetime-local"
                value={formData.downtime_start}
                onChange={(e) => setFormData(prev => ({ ...prev, downtime_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="downtime_end">Downtime Ended</Label>
              <Input
                id="downtime_end"
                type="datetime-local"
                value={formData.downtime_end}
                onChange={(e) => setFormData(prev => ({ ...prev, downtime_end: e.target.value }))}
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
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="root_cause">Root Cause Analysis</Label>
            <Textarea
              id="root_cause"
              value={formData.root_cause}
              onChange={(e) => setFormData(prev => ({ ...prev, root_cause: e.target.value }))}
              placeholder="Detailed analysis of what caused this breakdown..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution_notes">Resolution Notes</Label>
            <Textarea
              id="resolution_notes"
              value={formData.resolution_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, resolution_notes: e.target.value }))}
              placeholder="Steps taken to resolve the issue, parts replaced, etc..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Breakdown"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}