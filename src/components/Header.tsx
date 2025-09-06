import { Button } from "@/components/ui/button";
import { Heart, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  user?: any;
  onSignOut?: () => void;
  onAuthClick?: () => void;
}

export default function Header({ user, onSignOut, onAuthClick }: HeaderProps) {
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      onSignOut?.();
    }
  };

  return (
    <header className="w-full bg-transparent border-none sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-lacquer text-white tracking-wider">HOT TAKES</h1>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <User className="w-4 h-4" />
                <span>Anonymous User</span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="bg-muted/20 border-muted text-white hover:bg-muted/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              onClick={onAuthClick}
              variant="outline"
              size="lg"
              className="bg-muted/20 border-muted text-white hover:bg-muted/30 px-8 py-3 text-lg font-medium rounded-lg"
            >
              LOG IN
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}