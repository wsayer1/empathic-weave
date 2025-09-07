import { useState, useEffect } from "react";
import { User } from '@supabase/supabase-js';
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Lock, Send } from "lucide-react";

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

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  match_id: string;
}

interface Secret {
  id: string;
  secret_text: string;
}

const Messages = () => {
  const { user } = useOutletContext<OutletContext>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [matchSecrets, setMatchSecrets] = useState<Record<string, Secret>>({});
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
      
      // Fetch secrets for each match to display the user's hot take
      if (data && data.length > 0) {
        const secretIds = data.map(match => 
          match.user1_id === user?.id ? match.secret1_id : match.secret2_id
        );
        
        const { data: secrets, error: secretsError } = await supabase
          .from('secrets')
          .select('id, secret_text')
          .in('id', secretIds);

        if (!secretsError && secrets) {
          const secretsMap = secrets.reduce((acc, secret) => {
            acc[secret.id] = secret;
            return acc;
          }, {} as Record<string, Secret>);
          setMatchSecrets(secretsMap);
        }
      }
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

  const fetchMessages = async (matchId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    fetchMessages(match.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedMatch || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          match_id: selectedMatch.id
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage("");
      fetchMessages(selectedMatch.id);
    } catch (error) {
      console.error('Error:', error);
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

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
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
    <main className="min-h-screen bg-black flex">
      <div className="max-w-7xl mx-auto w-full flex">
        {/* Split Layout */}
        <div className="flex w-full pt-8">
          {/* Left Panel - Connections List */}
          <div className="w-1/3 border-r border-gray-800 p-6">
            <h2 className="text-xl font-lacquer text-white mb-4 tracking-wider">CONNECTIONS</h2>
            
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-lacquer text-white mb-2 tracking-wider">NO CONVERSATIONS YET</h3>
                <p className="text-yellow-400 font-lacquer text-sm tracking-wide uppercase">
                  Share a hot take to start conversations.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => (
                  <Card 
                    key={match.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedMatch?.id === match.id 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-gray-900/50 border-gray-800 hover:bg-gray-900/70'
                    }`}
                    onClick={() => handleSelectMatch(match)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          {(() => {
                            const secretId = match.user1_id === user?.id ? match.secret1_id : match.secret2_id;
                            const secret = matchSecrets[secretId];
                            return (
                              <>
                                <h3 className="font-lacquer text-white text-sm tracking-wide line-clamp-2">
                                  {secret?.secret_text || "LOADING..."}
                                </h3>
                                <p className="text-xs text-gray-400 font-lacquer tracking-wide">
                                  {formatDate(match.created_at).toUpperCase()}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Messages */}
          <div className="flex-1 flex flex-col">
            {selectedMatch ? (
              <>
                {/* Messages Header */}
                <div className="p-6 border-b border-gray-800">
                  <h3 className="font-lacquer text-white tracking-wide">ANONYMOUS CONNECTION</h3>
                  <p className="text-sm text-gray-400 font-lacquer tracking-wide">
                    STATUS: {selectedMatch.status.toUpperCase()}
                  </p>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto max-h-96">
                  {messagesLoading ? (
                    <div className="text-center text-gray-400 font-lacquer">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-yellow-400 font-lacquer tracking-wide uppercase">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-red-900/30 text-white'
                                : 'bg-gray-800 text-white'
                            }`}
                          >
                            <p className="font-lacquer tracking-wide text-sm">{message.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-gray-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white font-lacquer tracking-wide placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-red-900/30 hover:bg-red-900/50 border-0 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-yellow-400 font-lacquer tracking-wide uppercase">
                    Select a connection to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Messages;