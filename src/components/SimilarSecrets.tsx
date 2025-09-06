import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, MessageCircle, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import AuthModal from "./AuthModal";

interface Secret {
  id: string;
  secret_text: string;
  created_at: string;
  similarity?: number;
}

interface SimilarSecretsProps {
  userSecret: Secret;
  similarSecrets: Secret[];
  user?: any;
  onConnect?: (secretId: string) => void;
}

export default function SimilarSecrets({ userSecret, similarSecrets, user, onConnect }: SimilarSecretsProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const getSimilarityBadge = (similarity: number) => {
    if (similarity > 0.8) return { label: "Very Similar", color: "bg-gradient-trust text-white" };
    if (similarity > 0.6) return { label: "Similar", color: "bg-gradient-warm text-secondary-foreground" };
    return { label: "Somewhat Similar", color: "bg-muted text-muted-foreground" };
  };

  const handleMessageClick = (secretId: string) => {
    if (!user) {
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
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-trust rounded-xl mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">People Who Understand</h2>
            <p className="text-muted-foreground">
              These anonymous shares resonate with your experience
            </p>
          </div>

          <div className="space-y-6">
            {similarSecrets.map((secret, index) => {
              const badge = getSimilarityBadge(secret.similarity || 0);
              const similarityPercentage = Math.round((secret.similarity || 0) * 100);
              
              return (
                <Card key={secret.id} className="secret-card group hover-scale">
                  <CardContent className="flex items-start gap-6 pt-6">
                    {/* Left content - secret text and metadata */}
                    <div className="flex-1 space-y-4">
                      {/* Main secret text */}
                      <p className="text-foreground leading-relaxed text-base font-medium">
                        {secret.secret_text}
                      </p>
                      
                      {/* Similarity score */}
                      <div className="flex items-center gap-3">
                        <Badge className={`${badge.color} text-sm font-medium px-3 py-1`}>
                          {similarityPercentage}% Match
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {badge.label}
                        </span>
                      </div>
                      
                      {/* Secondary information */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          <span>Anonymous</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(secret.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - prominent message button */}
                    <div className="flex-shrink-0">
                      <Button
                        onClick={() => handleMessageClick(secret.id)}
                        className="btn-primary px-6 py-3"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
        onOpenChange={setAuthModalOpen}
        onAuthSuccess={() => {
          // Refresh the page or trigger auth state update
          window.location.reload();
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