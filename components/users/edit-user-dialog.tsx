// components/users/edit-user-dialog.tsx
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
import { Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  region?: string;
  phone?: string;
  department?: string;
}

interface EditUserDialogProps {
  user: User;
  children: React.ReactNode;
}

export function EditUserDialog({ user, children }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    role: user.role,
    region: user.region || "",
    phone: user.phone || "",
    department: user.department || ""
  });
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          region: formData.region,
          phone: formData.phone,
          department: formData.department
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
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
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span>Edit User</span>
          </DialogTitle>
          <DialogDescription>
            Update user information and permissions
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-slate-50"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunis">Tunis</SelectItem>
                  <SelectItem value="Ariana">Ariana</SelectItem>
                  <SelectItem value="Ben Arous">Ben Arous</SelectItem>
                  <SelectItem value="Manouba">Manouba</SelectItem>
                  <SelectItem value="Nabeul">Nabeul</SelectItem>
                  <SelectItem value="Zaghouan">Zaghouan</SelectItem>
                  <SelectItem value="Bizerte">Bizerte</SelectItem>
                  <SelectItem value="Béja">Béja</SelectItem>
                  <SelectItem value="Jendouba">Jendouba</SelectItem>
                  <SelectItem value="Kef">Kef</SelectItem>
                  <SelectItem value="Siliana">Siliana</SelectItem>
                  <SelectItem value="Sousse">Sousse</SelectItem>
                  <SelectItem value="Monastir">Monastir</SelectItem>
                  <SelectItem value="Mahdia">Mahdia</SelectItem>
                  <SelectItem value="Sfax">Sfax</SelectItem>
                  <SelectItem value="Kairouan">Kairouan</SelectItem>
                  <SelectItem value="Kasserine">Kasserine</SelectItem>
                  <SelectItem value="Sidi Bouzid">Sidi Bouzid</SelectItem>
                  <SelectItem value="Gabès">Gabès</SelectItem>
                  <SelectItem value="Medenine">Medenine</SelectItem>
                  <SelectItem value="Tataouine">Tataouine</SelectItem>
                  <SelectItem value="Gafsa">Gafsa</SelectItem>
                  <SelectItem value="Tozeur">Tozeur</SelectItem>
                  <SelectItem value="Kebili">Kebili</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+216 XX XXX XXX"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Network Operations">Network Operations</SelectItem>
                  <SelectItem value="Field Services">Field Services</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Technical Support">Technical Support</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Role Change Warning */}
          {formData.role !== user.role && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Changing the user's role will affect their access permissions.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}