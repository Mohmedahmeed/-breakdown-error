// components/users/users-table.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Edit, Trash2, Mail, MapPin, Calendar, Shield } from "lucide-react";
import { useState } from "react";
import { EditUserDialog } from "./edit-user-dialog";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'engineer' | 'technician';
  region?: string;
  phone?: string;
  department?: string;
  created_at: string;
  updated_at?: string;
}

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  isAdmin: boolean;
}

const roleColors = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  engineer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  technician: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
};

const roleIcons = {
  admin: Shield,
  manager: Shield,
  engineer: Shield,
  technician: Shield
};

export function UsersTable({ users, currentUserId, isAdmin }: UsersTableProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const router = useRouter();
  const supabase = createClient();

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.region?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const deleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account");
      return;
    }

    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      router.refresh();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Team Members ({filteredUsers.length})</span>
          </CardTitle>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="engineer">Engineer</option>
              <option value="technician">Technician</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role];
                const isCurrentUser = user.id === currentUserId;
                
                return (
                  <TableRow key={user.id} className={`hover:bg-slate-50 ${isCurrentUser ? 'bg-blue-50/50' : ''}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow">
                          <span className="text-white font-bold text-sm">
                            {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            <span>{user.full_name || 'No Name'}</span>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.region ? (
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span>{user.region}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.department || <span className="text-slate-400">-</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <span className="text-sm">{user.phone}</span>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex items-center space-x-2">
                          <EditUserDialog user={user}>
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </EditUserDialog>
                          {!isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUser(user.id)}
                              disabled={isDeleting === user.id}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">View Only</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}