import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Coffee, Loader2 } from "lucide-react";

export default function Admin() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
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
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  useEffect(() => {
    // Fetch users who don't have a role yet
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*');
      setProfiles(data || []);
    };
    fetchProfiles();
  }, []);

  const promoteToCashier = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'cashier' });

    if (error) alert("Error: " + error.message);
    else alert("Staff member approved as Cashier!");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Staff Management (Admin Only)</h1>
      {profiles.map((profile) => (
        <div key={profile.id} className="flex items-center justify-between p-4 border mb-2">
          <span>{profile.full_name || "New User"}</span>
          <Button onClick={() => promoteToCashier(profile.user_id)}>
            Approve as Cashier
          </Button>
        </div>
      ))}
    </div>
  );
}