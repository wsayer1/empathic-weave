import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SecretForm from "@/components/SecretForm";
import SimilarSecrets from "@/components/SimilarSecrets";
import MessageThread from "@/components/MessageThread";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface OutletContext {
  user?: User | null;
}

const NewSecret = () => {
  const { user } = useOutletContext<OutletContext>();
  const [submittedSecret, setSubmittedSecret] = useState<any>(null);
  const [similarSecrets, setSimilarSecrets] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<{ userSecret: any; otherSecret: any } | null>(null);
  const [secretText, setSecretText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSecretSubmitted = (data: { secret: any; similar_secrets: any[] }) => {
    setSubmittedSecret(data.secret);
    setSimilarSecrets(data.similar_secrets);
  };

  const handleNewSecret = () => {
    setSubmittedSecret(null);
    setSimilarSecrets([]);
    setActiveThread(null);
    setSecretText("");
  };

  const handleConnect = async (secretId: string) => {
    const selectedSecret = similarSecrets.find(secret => secret.id === secretId);
    if (selectedSecret && submittedSecret) {
      setActiveThread({
        userSecret: submittedSecret,
        otherSecret: selectedSecret
      });
    }
  };

  const handleSubmitSecret = async () => {
    if (!secretText.trim()) {
      toast({
        title: "Please enter your secret",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-secret', {
        body: {
          content: secretText.trim(),
          user_id: user?.id || null,
          is_anonymous: !user
        }
      });

      if (error) throw error;

      handleSecretSubmitted(data);
      toast({
        title: "Secret shared successfully!",
        description: "Finding others with similar experiences...",
      });
    } catch (error) {
      console.error('Error submitting secret:', error);
      toast({
        title: "Error sharing secret",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {submittedSecret ? (
        <div className="container mx-auto px-4 py-8">
          {activeThread ? (
            <MessageThread
              userSecret={activeThread.userSecret}
              otherSecret={activeThread.otherSecret}
              onBack={() => setActiveThread(null)}
            />
          ) : (
            <div className="space-y-8">
              <SimilarSecrets
                userSecret={submittedSecret}
                similarSecrets={similarSecrets}
                user={user}
                onConnect={handleConnect}
              />
              
              <div className="text-center">
                <button
                  onClick={handleNewSecret}
                  className="text-primary hover:text-primary/80 transition-gentle font-medium"
                >
                  Share Another Secret
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-lacquer text-5xl md:text-7xl text-primary mb-4">
              SHARE A SECRET
            </h1>
            <h2 className="font-lekton text-2xl md:text-4xl text-green-400 font-bold">
              WE DARE YOU
            </h2>
          </div>
          
          <div className="w-full max-w-2xl space-y-6">
            <Textarea
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Type your secret here..."
              className="min-h-[200px] bg-muted/50 border-muted text-foreground placeholder:text-muted-foreground resize-none text-lg p-6"
            />
            
            <div className="flex justify-center">
              <Button
                onClick={handleSubmitSecret}
                disabled={isSubmitting || !secretText.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-medium rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Anonymously"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default NewSecret;