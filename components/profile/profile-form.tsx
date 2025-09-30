// components/profile/profile-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
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
import { Save, Loader2 } from "lucide-react";

interface ProfileFormProps {
  profile: any;
  user: any;
}

export function ProfileForm({ profile, user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: user.email || "",
    role: profile?.role || "technician",
    region: profile?.region || "",
    phone: profile?.phone || "",
    department: profile?.department || ""
  });
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSaved(false);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          region: formData.region,
          phone: formData.phone,
          department: formData.department
        })
        .eq('id', user.id);
        
      if (profileError) throw profileError;

      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });
        
        if (emailError) throw emailError;
      }
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          placeholder="John Doe"
          required
          className="text-base"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="john.doe@example.com"
          required
          className="text-base"
        />
        <p className="text-xs text-slate-500">
          Changing your email will require verification
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role - Read Only */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            disabled
          >
            <SelectTrigger className="bg-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
            </SelectContent>
          </Select>
             <p className="text-xs text-slate-500">
                {formData.role === 'admin' 
                    ? 'You have full administrator access' 
                    : 'Contact your administrator to change your role'}
            </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+216 XX XXX XXX"
            className="text-base"
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

      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        {isSaved && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Profile updated successfully
          </span>
        )}
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}