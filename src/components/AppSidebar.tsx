import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Plus, FileText, MessageSquare, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  { title: "NEW HOT TAKE", url: "/", icon: Plus },
  { title: "MY TAKES", url: "/my-secrets", icon: FileText },
  { title: "MESSAGES", url: "/messages", icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { toast } = useToast();

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-gray-700 font-lacquer tracking-wider" : "hover:bg-gray-800/50 font-lacquer tracking-wider";
  
  const isCollapsed = state === "collapsed";

  const handleLogOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className={`${isCollapsed ? "w-14" : "w-60"} bg-black border-gray-800`} collapsible="icon">
      <SidebarContent className="bg-black">
        {/* Header */}
        {!isCollapsed && (
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-lacquer tracking-wider" style={{ color: 'hsl(var(--hot-red))' }}>
              HOT TAKES
            </h1>
          </div>
        )}
        
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 p-4">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4 text-white" />
                      {!isCollapsed && <span className="text-white">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* Footer with Log Out */}
      <SidebarFooter className="bg-black border-t border-gray-800 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogOut} className="hover:bg-gray-800/50 font-lacquer tracking-wider">
              <LogOut className="h-4 w-4 text-white" />
              {!isCollapsed && <span className="text-white">LOG OUT</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}