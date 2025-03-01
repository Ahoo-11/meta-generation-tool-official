import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  Image,
  LogOut,
  MessageSquare,
  User,
  Plus,
} from "lucide-react"
import { addCredits } from "@/services/uploadService"
import { useProfileStore } from "@/stores/profileStore"

export function AppSidebar() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { profile, refreshProfile } = useProfileStore()

  useEffect(() => {
    refreshProfile()

    // Subscribe to realtime profile changes for the current user
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

  return (
    <div className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r bg-background z-10">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold">Pixel Keywording</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid gap-1 px-2">
          <Button variant="ghost" className="justify-start" asChild>
            <a href="/">
              <Image className="mr-2 h-4 w-4" />
              Library
            </a>
          </Button>
          <Button variant="ghost" className="justify-start">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button variant="ghost" className="justify-start">
            <CreditCard className="mr-2 h-4 w-4" />
            Credits: {profile?.credits ?? 0}
          </Button>
          <Button 
            variant="ghost" 
            className="justify-start text-green-500 hover:text-green-600"
            onClick={handleAddCredits}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Credits (Dev)
          </Button>
          <Button variant="ghost" className="justify-start">
            <MessageSquare className="mr-2 h-4 w-4" />
            Feedback
          </Button>
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-full bg-primary/10 p-1">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="rounded-full h-8 w-8"
              />
            ) : (
              <User className="h-6 w-6" />
            )}
          </div>
          <div>
            <p className="font-medium">{profile?.username || 'User'}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
