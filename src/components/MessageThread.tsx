import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Secret {
  id: string;
  secret_text: string;
  created_at: string;
  user_id?: string;
  similarity?: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface MessageThreadProps {
  userSecret: Secret;
  otherSecret: Secret;
  onBack: () => void;
}

export default function MessageThread({ userSecret, otherSecret, onBack }: MessageThreadProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get current user and find/create match
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to send messages.",
            variant: "destructive",
          });
          return;
        }

        setCurrentUserId(user.id);

        // Find existing match between the two secrets
        const { data: existingMatch, error: matchError } = await supabase
          .from('matches')
          .select('id, user1_id, user2_id')
          .or(`and(secret1_id.eq.${userSecret.id},secret2_id.eq.${otherSecret.id}),and(secret1_id.eq.${otherSecret.id},secret2_id.eq.${userSecret.id})`)
          .single();

        if (matchError && matchError.code !== 'PGRST116') {
          console.error('Error finding match:', matchError);
          return;
        }

        if (existingMatch) {
          setMatchId(existingMatch.id);
        } else {
          // Create new match
          const otherUserId = otherSecret.user_id;
          console.log('Other user ID:', otherUserId);
          console.log('Current user ID:', user.id);
          console.log('User secret ID:', userSecret.id);
          console.log('Other secret ID:', otherSecret.id);
          
          if (!otherUserId) {
            console.log('Cannot create conversation - other secret is anonymous');
            toast({
              title: "Cannot create conversation",
              description: "The other user's secret is anonymous.",
              variant: "destructive",
            });
            return;
          }

          const { data: newMatch, error: createError } = await supabase
            .from('matches')
            .insert({
              user1_id: user.id,
              user2_id: otherUserId,
              secret1_id: userSecret.id,
              secret2_id: otherSecret.id,
              status: 'active'
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating match:', createError);
            console.error('Match data attempted:', {
              user1_id: user.id,
              user2_id: otherUserId,
              secret1_id: userSecret.id,
              secret2_id: otherSecret.id,
              status: 'active'
            });
            toast({
              title: "Error creating conversation",
              description: "Failed to start the conversation. Please try again.",
              variant: "destructive",
            });
            return;
          }

          setMatchId(newMatch.id);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Error",
          description: "Failed to initialize the chat.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [userSecret.id, otherSecret.id, toast]);

  // Load messages when match is found
  useEffect(() => {
    if (matchId) {
      loadMessages();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel(`messages-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `match_id=eq.${matchId}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [matchId]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !matchId || !currentUserId) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: currentUserId,
          content: message.trim()
        })
        .select('id, content, sender_id, created_at')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error sending message",
          description: "Failed to send your message. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setMessages(prev => [...prev, data]);
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const getSimilarityBadge = (similarity: number) => {
    if (similarity > 0.8) return { label: "Very Similar", color: "bg-gradient-trust text-white" };
    if (similarity > 0.6) return { label: "Similar", color: "bg-gradient-warm text-secondary-foreground" };
    return { label: "Somewhat Similar", color: "bg-muted text-muted-foreground" };
  };

  const badge = getSimilarityBadge(otherSecret.similarity || 0);
  const similarityPercentage = Math.round((otherSecret.similarity || 0) * 100);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-pulse-subtle text-muted-foreground">Loading conversation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 fade-in">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold">Message Thread</h2>
      </div>

      {/* Both secrets displayed at top */}
      <div className="space-y-4">
        {/* User's secret */}
        <Card className="secret-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full"></span>
              Your Secret
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed text-base">
              {userSecret.secret_text}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-3">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>You</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(userSecret.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other person's secret */}
        <Card className="secret-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-3 h-3 bg-secondary rounded-full"></span>
              Their Secret
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed text-base">
              {otherSecret.secret_text}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Badge className={`${badge.color} text-sm font-medium px-3 py-1`}>
                {similarityPercentage}% Match
              </Badge>
              <span className="text-xs text-muted-foreground">
                {badge.label}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-3">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>Anonymous</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(otherSecret.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message thread */}
      <Card className="secret-card">
        <CardHeader>
          <CardTitle className="text-lg">Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages display */}
          <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message input */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="btn-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
