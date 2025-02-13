
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { supabase } from "@/integrations/supabase/client"
import {
  CreditCard,
  Image,
  LogOut,
  MessageSquare,
  User,
} from "lucide-react"

interface Profile {
  username: string | null
  email: string
  credits: number
  avatar_url: string | null
}

export function AppSidebar() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, email, credits, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setProfile(data)
        }
      }
    }

    fetchProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-lg font-semibold">Pixel Keywording</h2>
      </div>
      
      <div className="flex-1 overflow-auto py-2">
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
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {profile?.username || profile?.email || 'User'}
            </span>
            {profile?.username && (
              <span className="text-xs text-muted-foreground">
                {profile.email}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            className="flex-1 justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
