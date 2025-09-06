import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SecretFormProps {
  user?: any;
  onSecretSubmitted: (data: { secret: any; similar_secrets: any[] }) => void;
}

export default function SecretForm({ user, onSecretSubmitted }: SecretFormProps) {
  const [secretText, setSecretText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!secretText.trim()) {
      toast({
        title: "Empty secret",
        description: "Please write something before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (secretText.length > 1500) {
      toast({
        title: "Secret too long",
        description: "Please keep your secret under 1500 characters.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-secret', {
        body: {
          secret_text: secretText.trim(),
          user_id: user?.id || null
        }
      });

      if (error) {
        console.error('Function error:', error);
        toast({
          title: "Something went wrong",
          description: "Failed to process your secret. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Secret shared",
        description: "Your secret has been shared anonymously. Finding similar experiences...",
      });

      setSecretText("");
      onSecretSubmitted(data);

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const characterCount = secretText.length;
  const isNearLimit = characterCount > 1200;
  const isOverLimit = characterCount > 1500;

  return (
    <Card className="w-full max-w-2xl mx-auto glass shadow-medium border-0">
      <CardHeader className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-trust rounded-xl mb-3 mx-auto">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-2xl">Share Your Secret</CardTitle>
        <CardDescription className="text-base">
          Express yourself anonymously. Your secret will be matched with similar experiences to help you connect with others who understand.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Share what's on your mind... It could be a fear, a dream, a confession, or anything you've kept to yourself."
              className={`min-h-[150px] resize-none transition-gentle focus:ring-primary/20 ${
                isOverLimit ? 'border-destructive focus:ring-destructive/20' : ''
              }`}
              disabled={loading}
            />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {user ? 'Logged in' : 'Anonymous'} • Always private
              </span>
              <span className={`${
                isOverLimit ? 'text-destructive' : 
                isNearLimit ? 'text-orange-500' : 'text-muted-foreground'
              }`}>
                {characterCount}/1500
              </span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !secretText.trim() || isOverLimit}
            className="w-full btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Share Secret
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}