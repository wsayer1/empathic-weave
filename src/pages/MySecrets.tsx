import { useState, useEffect } from "react";
import { User } from '@supabase/supabase-js';
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Lock } from "lucide-react";

interface OutletContext {
  user?: User | null;
}

interface Secret {
  id: string;
  secret_text: string;
  created_at: string;
}

const MySecrets = () => {
  const { user } = useOutletContext<OutletContext>();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMySecrets();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMySecrets = async () => {
    try {
      const { data, error } = await supabase
        .from('secrets')
        .select('id, secret_text, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching secrets:', error);
        toast({
          title: "Error loading secrets",
          description: "Failed to load your secrets. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setSecrets(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h1>
          <p className="text-muted-foreground">
            Please sign in to view your secrets.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-pulse-subtle text-muted-foreground">Loading your secrets...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Secrets</h1>
          <p className="text-muted-foreground">
            Your shared thoughts and experiences, kept private and secure.
          </p>
        </div>

        {secrets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No secrets yet</h2>
            <p className="text-muted-foreground mb-4">
              You haven't shared any secrets yet. Share your first secret to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {secrets.map((secret) => (
              <Card key={secret.id} className="glass shadow-soft border-0">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(secret.created_at)}
                    </div>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {secret.secret_text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MySecrets;