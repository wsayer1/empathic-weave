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
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <Textarea
            value={secretText}
            onChange={(e) => setSecretText(e.target.value)}
            placeholder="The Dating scene in SF is fucked"
            className="min-h-[200px] bg-muted/40 border-0 text-white text-xl p-6 rounded-2xl placeholder:text-muted-foreground/60 resize-none focus:ring-0 focus:outline-none"
            disabled={loading}
          />
        </div>

        <div className="text-center">
          <Button
            type="submit"
            disabled={loading || !secretText.trim() || isOverLimit}
            className="px-12 py-4 text-xl font-semibold bg-orange-400 hover:bg-orange-500 text-black border-0 rounded-xl transition-gentle"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-3" />
                PROCESSING...
              </>
            ) : (
              "SUBMIT ANONYMOUSLY"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}