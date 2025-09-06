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

  const handleNewSecret = () => {
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
    <main className="container mx-auto px-4 py-8">
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
        )
      ) : (
        <div className="space-y-8">
          <div className="text-center max-w-3xl mx-auto fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Share Your{" "}
              <span className="bg-gradient-trust bg-clip-text text-transparent">
                Secrets
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A safe space to express your innermost thoughts anonymously and connect with others who truly understand your experiences.
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