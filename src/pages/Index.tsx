import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
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

  const handleNewSecret = () => {
    // Handle any global new secret logic if needed
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

  // If user is authenticated, show full app with sidebar
  if (user) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full bg-gradient-gentle flex">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col">
            <Header 
              user={user} 
              onSignOut={() => {
                setUser(null);
                setSession(null);
                handleNewSecret();
              }}
              onAuthClick={() => setShowAuth(true)}
            />
            
            <Outlet context={{ user }} />
          </div>
        </div>
        
        {showAuth && <AuthForm onAuthSuccess={() => setShowAuth(false)} />}
      </SidebarProvider>
    );
  }

  // If user is not authenticated, show clean layout without sidebar
  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <Header 
        user={user} 
        onSignOut={() => {
          setUser(null);
          setSession(null);
          handleNewSecret();
        }}
        onAuthClick={() => setShowAuth(true)}
      />
      
      <Outlet context={{ user }} />
      
      {showAuth && <AuthForm onAuthSuccess={() => setShowAuth(false)} />}
    </div>
  );
};

export default Index;
