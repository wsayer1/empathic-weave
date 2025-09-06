import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import SecretForm from "@/components/SecretForm";
import SimilarSecrets from "@/components/SimilarSecrets";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [submittedSecret, setSubmittedSecret] = useState<any>(null);
  const [similarSecrets, setSimilarSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          setShowAuth(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSecretSubmitted = (data: { secret: any; similar_secrets: any[] }) => {
    setSubmittedSecret(data.secret);
    setSimilarSecrets(data.similar_secrets);
  };

  const handleNewSecret = () => {
    setSubmittedSecret(null);
    setSimilarSecrets([]);
  };

  const handleConnect = async (secretId: string) => {
    // This would implement the matching/connection logic
    toast({
      title: "Connection request sent",
      description: "You'll be notified if they want to connect too.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-subtle text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (showAuth) {
    return <AuthForm onAuthSuccess={() => setShowAuth(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-gentle">
      <Header 
        user={user} 
        onSignOut={() => {
          setUser(null);
          setSession(null);
          handleNewSecret();
        }}
        onAuthClick={() => setShowAuth(true)}
      />
      
      <main className="container mx-auto px-4 py-8">
        {submittedSecret ? (
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
    </div>
  );
};

export default Index;
