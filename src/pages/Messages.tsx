import { useState, useEffect } from "react";
import { User } from '@supabase/supabase-js';
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Lock } from "lucide-react";

interface OutletContext {
  user?: User | null;
}

interface Match {
  id: string;
  status: string;
  created_at: string;
  user1_id: string;
  user2_id: string;
  secret1_id: string;
  secret2_id: string;
}

const Messages = () => {
  const { user } = useOutletContext<OutletContext>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMatches();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        toast({
          title: "Error loading conversations",
          description: "Failed to load your conversations. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setMatches(data || []);
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
      <main className="container mx-auto px-8 py-8 min-h-screen bg-black">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-lacquer text-white mb-2 tracking-wider">SIGN IN REQUIRED</h1>
          <p className="text-yellow-400 font-lacquer tracking-wide uppercase">
            Please sign in to view your conversations.
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container mx-auto px-8 py-8 min-h-screen bg-black">
        <div className="text-center py-16">
          <div className="animate-pulse-subtle text-gray-400 font-lacquer">Loading your conversations...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-8 py-8 min-h-screen bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-lacquer mb-4 tracking-wider" style={{ color: 'hsl(var(--hot-red))' }}>
            MESSAGES
          </h1>
          <p className="text-lg text-yellow-400 font-lacquer leading-relaxed uppercase tracking-wide">
            Your conversations with others who share similar experiences.
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-lacquer text-white mb-2 tracking-wider">NO CONVERSATIONS YET</h2>
            <p className="text-yellow-400 font-lacquer mb-4 tracking-wide uppercase">
              Share a hot take and connect with others to start conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <Card key={match.id} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm hover:bg-gray-900/70 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-lacquer text-white tracking-wide">ANONYMOUS CONNECTION</h3>
                        <p className="text-sm text-gray-400 font-lacquer tracking-wide">
                          STARTED {formatDate(match.created_at).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 capitalize font-lacquer tracking-wide">
                      {match.status.toUpperCase()}
                    </div>
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

export default Messages;