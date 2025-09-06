import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SecretForm from "@/components/SecretForm";
import SimilarSecrets from "@/components/SimilarSecrets";
import MessageThread from "@/components/MessageThread";
import { useToast } from "@/hooks/use-toast";

interface OutletContext {
  user?: User | null;
}

const NewSecret = () => {
  const { user } = useOutletContext<OutletContext>();
  const [submittedSecret, setSubmittedSecret] = useState<any>(null);
  const [similarSecrets, setSimilarSecrets] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<{ userSecret: any; otherSecret: any } | null>(null);
  const { toast } = useToast();

  const handleSecretSubmitted = (data: { secret: any; similar_secrets: any[] }) => {
    setSubmittedSecret(data.secret);
    setSimilarSecrets(data.similar_secrets);
  };

  const handleNewSecret = async () => {
    if (submittedSecret?.id) {
      try {
        const { error } = await supabase
          .from('secrets')
          .delete()
          .eq('id', submittedSecret.id);
        
        if (error) {
          console.error('Error deleting secret:', error);
          toast({
            title: "Error",
            description: "Failed to delete the previous secret. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: "Secret removed",
          description: "Your previous secret has been deleted.",
        });
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error", 
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setSubmittedSecret(null);
    setSimilarSecrets([]);
    setActiveThread(null);
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

  return (
    <main className="container mx-auto px-8 py-8 min-h-screen bg-black">
      {submittedSecret ? (
        activeThread ? (
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
              onNewSecret={handleNewSecret}
            />
          </div>
        )
      ) : (
        <div className="space-y-12 py-16">
          <div className="text-center max-w-4xl mx-auto fade-in">
            <h1 className="text-4xl md:text-5xl font-lacquer mb-8 tracking-wider" style={{ color: 'hsl(var(--hot-red))' }}>
              SHARE YOUR HOT TAKE
            </h1>
            <p className="text-lg text-yellow-400 font-lacquer leading-relaxed uppercase tracking-wide">
              IF WE HAVE A SIMILAR HOT TAKE ON RECORD, WE'LL MATCH YOU IN AN ANONYMOUS CHAT
            </p>
          </div>
          
          <SecretForm 
            user={user} 
            onSecretSubmitted={handleSecretSubmitted} 
          />
          
          <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            <p>
              Your secrets are processed using AI to find similar experiences, but your identity remains completely anonymous. 
              {!user && " Create an account to connect with others who share your experiences."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default NewSecret;