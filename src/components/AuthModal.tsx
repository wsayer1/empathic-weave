import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ open, onOpenChange, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
          });
          onOpenChange(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back",
            description: "You've successfully signed in.",
          });
          onAuthSuccess();
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black border-gray-800">
        <DialogHeader className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-700 rounded-xl mb-4 mx-auto">
            <Heart className="w-6 h-6" style={{ color: 'hsl(var(--hot-red))' }} />
          </div>
          <DialogTitle className="text-xl font-lacquer text-white tracking-wider" style={{ color: 'hsl(var(--hot-red))' }}>
            {isSignUp ? "CREATE ACCOUNT" : "WELCOME BACK"}
          </DialogTitle>
          <DialogDescription className="text-yellow-400 font-lacquer uppercase tracking-wide">
            {isSignUp 
              ? "JOIN THE COMMUNITY OF HOT TAKES" 
              : "SIGN IN TO SHARE YOUR THOUGHTS"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-email" className="text-white font-lacquer uppercase tracking-wide">Email</Label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="bg-gray-700 border-0 text-white placeholder:text-gray-400 focus:ring-0 focus:outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="modal-password" className="text-white font-lacquer uppercase tracking-wide">Password</Label>
            <Input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-gray-700 border-0 text-white placeholder:text-gray-400 focus:ring-0 focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 border-0 text-white hover:text-yellow-400 font-lacquer uppercase tracking-wide transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-400 hover:text-yellow-400 transition-colors font-lacquer"
          >
            {isSignUp 
              ? "Already have an account? Sign in" 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}