import { useEffect, type ComponentType } from "react"
import { useNavigate, NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme/theme-provider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  LogOut,
  User,
  Plus,
  Home,
  History,
  BarChart2,
  Settings,
  Sun,
  Moon,
  CreditCardIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { addCredits } from "@/services/uploadService"
import { useProfileStore } from "@/stores/profileStore"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { Profile } from '@/stores/profileStore'

interface NavItemProps {
  to: string;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const CreditDisplay = ({ profile }: { profile: Profile | null }) => {
  const baseCredits = 150; // Base credits for free account
  const totalCredits = Math.max(baseCredits, profile?.credits || 0); // Use higher of base or actual credits
  const usedCredits = Math.max(0, totalCredits - (profile?.credits || 0));
  const remainingPercentage = ((profile?.credits || 0) / totalCredits) * 100;

  return (
    <div className="mx-3 my-4 px-4 py-4 rounded-lg border border-border/40 bg-card/50 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Credits Available</span>
        <span className="text-sm font-semibold text-primary">{profile?.credits || 0}</span>
      </div>
      <div className="space-y-2.5">
        <Progress value={remainingPercentage} className="h-2.5 bg-secondary/80" />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary/60 inline-block"></span>
            {usedCredits} used
          </span>
          <span>{totalCredits} total</span>
        </div>
      </div>
    </div>
  );
};

export function AppSidebar() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile, refreshProfile } = useProfileStore()
  const { setTheme } = useTheme()

  useEffect(() => {
    refreshProfile()
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const channel = supabase
        .channel('profile_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          async () => {
            await refreshProfile()
          }
        )
        .subscribe()
      return () => {
        supabase.removeChannel(channel)
      }
    }
    setupRealtimeSubscription()
  }, [refreshProfile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  const handleAddCredits = async () => {
    try {
      const success = await addCredits(10);
      if (success) {
        await refreshProfile();
        toast({
          title: "Credits Added",
          description: "10 credits have been added to your account",
        })
      } else {
        throw new Error("Failed to add credits");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add credits",
        variant: "destructive",
      })
    }
  }

  const NavItem = ({ to, icon: Icon, children }: NavItemProps) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        cn(
          "flex items-center px-3 py-2 rounded-lg transition-all duration-200 group",
          isActive 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-accent/50 hover:text-accent-foreground text-muted-foreground"
        )
      }
    >
      <Icon className="mr-3 h-4 w-4" />
      <span className="font-medium">{children}</span>
    </NavLink>
  )

  return (
    <div className="w-72 shrink-0 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col h-screen fixed z-40 shadow-md dark:shadow-lg dark:shadow-black/20">
      <div className="flex h-16 items-center border-b border-border/40 px-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
          Pixel Keywording
        </h2>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 py-4 space-y-1">
          <NavLink 
            to="/app" 
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 mx-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "text-white bg-primary shadow-sm shadow-primary/25" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:hover:bg-secondary/80"
              )
            }
          >
            <Home className="h-4 w-4" />
            Home
          </NavLink>
          <NavLink 
            to="/app/history" 
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 mx-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "text-white bg-primary shadow-sm shadow-primary/25" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:hover:bg-secondary/80"
              )
            }
          >
            <History className="h-4 w-4" />
            History
          </NavLink>
          <NavLink 
            to="/app/stats" 
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 mx-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "text-white bg-primary shadow-sm shadow-primary/25" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80 dark:hover:bg-secondary/80"
              )
            }
          >
            <BarChart2 className="h-4 w-4" />
            Analytics
          </NavLink>
        </div>

        <CreditDisplay profile={profile} />

        <div className="mx-3 mb-4 space-y-2">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 border-primary/30 hover:bg-primary/10"
            onClick={() => navigate('/app/purchase-credits')}
          >
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Purchase Credits</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 border-primary/30 hover:bg-primary/10"
            onClick={() => navigate('/app/payment-test')}
          >
            <CreditCardIcon className="h-4 w-4 text-primary" />
            <span>Payment Test</span>
          </Button>
        </div>

        <div className="border-t border-border/40">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.username || profile?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/app/settings')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    Light Theme
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark Theme
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <span className="h-4 w-4 mr-2 flex items-center justify-center">💻</span>
                    System Theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
