import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, MessageCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Secret {
  id: string;
  secret_text: string;
  created_at: string;
  user_id?: string;
  similarity?: number;
}

interface SimilarSecretsProps {
  userSecret: Secret;
  similarSecrets: Secret[];
  user?: any;
  onConnect?: (secretId: string) => void;
  onNewSecret?: () => void;
  setUserSecret?: (secret: Secret | null) => void;
}

export default function SimilarSecrets({ userSecret, similarSecrets, user, onConnect, onNewSecret, setUserSecret }: SimilarSecretsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedSecretForMessage, setSelectedSecretForMessage] = useState<string | null>(null);
  
  const getSimilarityBadge = (similarity: number) => {
    if (similarity > 0.8) return { label: "Very Similar", color: "bg-gradient-trust text-white" };
    if (similarity > 0.6) return { label: "Similar", color: "bg-gradient-warm text-secondary-foreground" };
    return { label: "Somewhat Similar", color: "bg-muted text-muted-foreground" };
  };

  const handleMessageClick = (secretId: string) => {
    if (!user) {
      setSelectedSecretForMessage(secretId);
      setAuthModalOpen(true);
    } else if (onConnect) {
      onConnect(secretId);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 fade-in">
      {/* Similar secrets */}
      {similarSecrets.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-lacquer text-gray-400 tracking-wider mb-4">
              THESE PEOPLE GET YOU
            </h2>
          </div>

          <div className="space-y-6">
            {similarSecrets.map((secret, index) => {
              const badge = getSimilarityBadge(secret.similarity || 0);
              const similarityPercentage = Math.round((secret.similarity || 0) * 100);
              
              return (
                <Card key={secret.id} className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left content - secret text and metadata */}
                      <div className="flex-1">
                        {/* Main secret text */}
                        <p className="text-white leading-relaxed font-lacquer tracking-wide mb-4">
                          {secret.secret_text}
                        </p>
                        
                        {/* Metadata row */}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="bg-green-600 text-white px-2 py-1 rounded font-medium">
                            {similarityPercentage}% match
                          </span>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {formatDistanceToNow(new Date(secret.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - message button */}
                      <div className="ml-6">
                        <Button
                          onClick={() => handleMessageClick(secret.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-black font-medium px-6 py-2 rounded-full font-lacquer tracking-wide shrink-0"
                        >
                          MESSAGE ANONYMOUSLY
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bottom actions section */}
          <div className="text-center space-y-4 mt-12">
            <div className="text-gray-400 text-sm">
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="underline hover:text-gray-300 transition-colors"
              >
                Create an Account
              </button>
              {" "}to see more matches & save your secret anonymously,
              <br />
              so others can message you if your secrets match.
            </div>
            
            <div className="text-gray-400 text-sm">
              or
            </div>
            
            <div className="text-gray-400 text-sm">
              <button 
                onClick={onNewSecret}
                className="underline hover:text-gray-300 transition-colors"
              >
                Remove Secret and Share Another
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="secret-card text-center">
          <CardContent className="pt-8 pb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-xl mb-4">
              <Heart className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">You're the First</h3>
            <p className="text-muted-foreground">
              No similar secrets found yet, but your courage to share might inspire others to open up too.
            </p>
          </CardContent>
        </Card>
      )}

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={(open) => {
          setAuthModalOpen(open);
          if (!open) setSelectedSecretForMessage(null);
        }}
        defaultToSignUp={true}
        matchedSecretId={selectedSecretForMessage}
        onAuthSuccess={async () => {
          console.log('🔥 Auth success callback triggered');
          
          try {
            // Get the current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
              console.error('❌ Failed to get authenticated user:', userError);
              toast({
                title: "Authentication Error",
                description: "Failed to verify your account. Please try again.",
                variant: "destructive",
              });
              return;
            }
            
            console.log('✅ Current user ID:', user.id);
            
            // First, associate the anonymous secret with the new user if needed
            if (userSecret && !userSecret.user_id) {
              console.log('🔗 Associating anonymous secret with user:', userSecret.id);
              
              const { error: updateError } = await supabase
                .from('secrets')
                .update({ user_id: user.id })
                .eq('id', userSecret.id);
              
              if (updateError) {
                console.error('❌ Error updating secret user_id:', updateError);
                toast({
                  title: "Error",
                  description: "Failed to associate your secret with your account.",
                  variant: "destructive",
                });
                return;
              }
              
              console.log('✅ Successfully associated secret with user');
              
              // Update the local state to reflect the change
              if (setUserSecret) {
                setUserSecret({ ...userSecret, user_id: user.id });
              }
            }
            
            // Now create the match connection after successful account creation
            if (selectedSecretForMessage && userSecret) {
              console.log('💬 Creating match between secrets:', userSecret.id, 'and', selectedSecretForMessage);
              
              const { data, error } = await supabase.functions.invoke('create-match', {
                body: {
                  userSecretId: userSecret.id,
                  targetSecretId: selectedSecretForMessage,
                },
              });

              if (error) {
                console.error('❌ Error creating match:', error);
                toast({
                  title: "Connection Error", 
                  description: "Failed to create connection. Please try again.",
                  variant: "destructive",
                });
                // Don't return here, still navigate to messages
              } else {
                console.log('✅ Match created successfully:', data);
                toast({
                  title: "Success!",
                  description: "Connected! You can now start messaging.",
                });
              }
            }
            
            // Always navigate to Messages page after auth success
            console.log('🧭 Navigating to messages page');
            setAuthModalOpen(false);
            navigate('/messages');
            
          } catch (error) {
            console.error('💥 Error in auth success flow:', error);
            toast({
              title: "Unexpected Error",
              description: "Something went wrong. Please try again.",
              variant: "destructive",
            });
            // Still navigate to allow user to try again
            setAuthModalOpen(false);
            navigate('/messages');
          }
        }}
      />
    </div>
  );
}

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);