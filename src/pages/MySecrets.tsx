import { useState, useEffect } from "react";
import { User } from '@supabase/supabase-js';
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Lock, Trash2 } from "lucide-react";

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

  const handleDeleteSecret = async (secretId: string) => {
    try {
      const { error } = await supabase
        .from('secrets')
        .delete()
        .eq('id', secretId);

      if (error) {
        console.error('Error deleting secret:', error);
        toast({
          title: "Error deleting hot take",
          description: "Failed to delete your hot take. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setSecrets(secrets.filter(secret => secret.id !== secretId));
      
      toast({
        title: "Hot take deleted",
        description: "Your hot take has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
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
      <main className="container mx-auto px-8 py-8 min-h-screen bg-black">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-lacquer text-white mb-2 tracking-wider">SIGN IN REQUIRED</h1>
          <p className="text-yellow-400 font-lacquer tracking-wide uppercase">
            Please sign in to view your hot takes.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto px-8 py-8 min-h-screen bg-black">
        <div className="text-center py-16">
          <div className="animate-pulse-subtle text-gray-400 font-lacquer">Loading your hot takes...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-8 py-8 min-h-screen bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-lacquer mb-4 tracking-wider" style={{ color: 'hsl(var(--hot-red))' }}>
            MY HOT TAKES
          </h1>
          <p className="text-lg text-yellow-400 font-lacquer leading-relaxed uppercase tracking-wide">
            Your shared thoughts and experiences, kept anonymous and secure.
          </p>
        </div>

        {secrets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-lacquer text-white mb-2 tracking-wider">NO HOT TAKES YET</h2>
            <p className="text-yellow-400 font-lacquer mb-4 tracking-wide uppercase">
              You haven't shared any hot takes yet. Share your first take to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {secrets.map((secret) => (
              <Card key={secret.id} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white leading-relaxed font-lacquer tracking-wide mb-4">
                        {secret.secret_text}
                      </p>
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="font-lacquer tracking-wide">{formatDate(secret.created_at)}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteSecret(secret.id)}
                      variant="outline"
                      size="sm"
                      className="bg-red-900/30 border-0 text-red-400 hover:bg-red-900/50 hover:text-red-300 shrink-0 min-w-[40px] h-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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