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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AddEnergyDialogProps {
  children: React.ReactNode;
  sites: any[];
  equipment: any[];
}

export function AddEnergyDialog({ children, sites, equipment }: AddEnergyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    site_id: "",
    equipment_id: "none",
    consumption_kwh: "",
    cost_amount: "",
    period_start: "",
    period_end: ""
  });

  const router = useRouter();
  const supabase = createClient();

  // Filter equipment by selected site
  const filteredEquipment = equipment.filter(eq =>
    formData.site_id ? eq.site_id === formData.site_id : false
  );

  // Auto-calculate cost based on consumption (0.15 TND/kWh)
  const calculateCost = (kwh: string) => {
    const consumption = parseFloat(kwh);
    if (!isNaN(consumption) && consumption > 0) {
      return (consumption * 0.15).toFixed(2);
    }
    return "";
  };

  const handleConsumptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      consumption_kwh: value,
      // Auto-calculate cost if not manually set
      cost_amount: prev.cost_amount === "" ? calculateCost(value) : prev.cost_amount
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      const consumption = parseFloat(formData.consumption_kwh);
      if (isNaN(consumption) || consumption <= 0) {
        alert("Consumption must be a positive number");
        setIsLoading(false);
        return;
      }

      const periodStart = new Date(formData.period_start);
      const periodEnd = new Date(formData.period_end);

      if (periodEnd <= periodStart) {
        alert("Period end date must be after period start date");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('energy_consumption')
        .insert([{
          site_id: formData.site_id,
          equipment_id: formData.equipment_id === "none" ? null : formData.equipment_id,
          consumption_kwh: consumption,
          cost_amount: formData.cost_amount ? parseFloat(formData.cost_amount) : null,
          period_start: formData.period_start,
          period_end: formData.period_end,
          recorded_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setOpen(false);
      setFormData({
        site_id: "",
        equipment_id: "none",
        consumption_kwh: "",
        cost_amount: "",
        period_start: "",
        period_end: ""
      });
      router.refresh();
    } catch (error) {
      console.error('Error recording energy consumption:', error);
      alert('Error recording energy consumption. Please check all fields and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Energy Consumption</DialogTitle>
          <DialogDescription>
            Record new energy consumption data for a site. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_id">Site *</Label>
            <Select
              value={formData.site_id}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                site_id: value,
                equipment_id: "none" // Reset equipment when site changes
              }))}
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

          {formData.site_id && (
            <div className="space-y-2">
              <Label htmlFor="equipment_id">Equipment (Optional)</Label>
              <Select
                value={formData.equipment_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment (optional)" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consumption_kwh">Consumption (kWh) *</Label>
              <Input
                id="consumption_kwh"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.consumption_kwh}
                onChange={(e) => handleConsumptionChange(e.target.value)}
                placeholder="850.5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_amount">Cost (TND)</Label>
              <Input
                id="cost_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_amount: e.target.value }))}
                placeholder="Auto-calculated"
              />
              <p className="text-xs text-slate-500">
                Default: 0.15 TND/kWh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">Period Start *</Label>
              <Input
                id="period_start"
                type="datetime-local"
                value={formData.period_start}
                onChange={(e) => setFormData(prev => ({ ...prev, period_start: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Period End *</Label>
              <Input
                id="period_end"
                type="datetime-local"
                value={formData.period_end}
                onChange={(e) => setFormData(prev => ({ ...prev, period_end: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {isLoading ? "Recording..." : "Record Energy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
