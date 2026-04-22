import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Loader2, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { AppRole } from "@/types/database";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  role: AppRole;
  created_at: string;
}

export default function Admin() {
  const { isAdmin, isLoading: authLoading, isRolesLoading, user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch users who don't have a role yet
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (!profilesError && allProfiles) {
      // Get all user roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (!rolesError) {
        const usersWithRoles = new Set(allRoles?.map(r => r.user_id) || []);
        
        const pending = allProfiles.filter(profile => !usersWithRoles.has(profile.user_id));
        setPendingUsers(pending);
        
        const staff = allProfiles
          .filter(profile => usersWithRoles.has(profile.user_id))
          .map(profile => {
            const userRole = allRoles?.find(r => r.user_id === profile.user_id);
            return {
              ...profile,
              role: userRole?.role || 'unknown'
            };
          });
        setStaffMembers(staffMembers);
      }
    }
    
    setIsLoading(false);
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (user && isRolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin
  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access the Admin panel.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const assignRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role });

    if (error) {
      toast.error("Error assigning role: " + error.message);
    } else {
      toast.success(`User assigned as ${role}!`);
      fetchData(); // Refresh the data
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      toast.error("Error removing role: " + error.message);
    } else {
      toast.success("Role removed!");
      fetchData(); // Refresh the data
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Pending Approvals ({pendingUsers.length})
            </CardTitle>
            <CardDescription>
              New users who have signed up but haven't been assigned roles yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending approvals</p>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{profile.full_name || "New User"}</p>
                      <p className="text-sm text-muted-foreground">
                        Signed up {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => assignRole(profile.user_id, 'cashier')}
                        size="sm"
                      >
                        Approve as Cashier
                      </Button>
                      <Button 
                        onClick={() => assignRole(profile.user_id, 'admin')}
                        variant="outline"
                        size="sm"
                      >
                        Approve as Admin
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Staff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Current Staff ({staffMembers.length})
            </CardTitle>
            <CardDescription>
              Users with assigned roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {staffMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No staff members</p>
            ) : (
              <div className="space-y-3">
                {staffMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.full_name || "Unknown User"}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <Button 
                        onClick={() => removeRole(member.user_id, member.role)}
                        variant="destructive"
                        size="sm"
                      >
                        <UserX className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
