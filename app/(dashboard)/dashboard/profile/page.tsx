// app/(dashboard)/dashboard/profile/page.tsx
import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "../../../../components/profile/profile-form";
import { ChangePasswordDialog } from "../../../../components/profile/change-password-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { User, Mail, Shield, MapPin, Calendar, Building } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Create profile if it doesn't exist
    const { error } = await supabase
      .from("profiles")
      .insert([{
        id: user.id,
        email: user.email,
        full_name: user.email?.split('@')[0] || '',
        role: 'technician'
      }]);
    
    if (error) {
      console.error("Error creating profile:", error);
    }
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center space-x-2">
            <User className="h-8 w-8 text-blue-500" />
            <span>Profile Settings</span>
          </h2>
          <p className="text-slate-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-4xl">
                      {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Shield className="h-5 w-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Role</p>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {profile?.role || 'technician'}
                    </p>
                  </div>
                </div>

                {profile?.region && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500">Region</p>
                      <p className="text-sm font-medium text-slate-900">
                        {profile.region}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Member Since</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Actions */}
              <div className="pt-4 border-t">
                <ChangePasswordDialog>
                  <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">Change Password</p>
                        <p className="text-xs text-slate-500 mt-1">Update your account password</p>
                      </div>
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                  </button>
                </ChangePasswordDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} user={user} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">1</p>
              </div>
              <Building className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Last Login</p>
                <p className="text-sm font-bold text-blue-600">
                  {new Date(user.last_sign_in_at || '').toLocaleDateString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Account Status</p>
                <p className="text-sm font-bold text-purple-600">Active</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Two-Factor Auth</p>
                <p className="text-sm font-bold text-orange-600">Not Enabled</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}