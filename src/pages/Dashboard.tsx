import { ImageUploader } from '@/components/ImageUploader'
import { supabase } from '@/integrations/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useToast } from '@/hooks/use-toast'
import { useProfileStore } from '@/stores/profileStore'
import { Button } from '@/components/ui/button'
import { Upload, Zap, User } from 'lucide-react'
import { useEffect } from 'react'

const Dashboard = () => {
  const session = useSession()
  const { toast } = useToast()
  const { profile, refreshProfile, isLoading } = useProfileStore()

  useEffect(() => {
    // Ensure profile is loaded
    if (!profile) {
      refreshProfile();
    }
  }, [profile, refreshProfile]);

  return (
    <div className="min-h-screen bg-background pl-72">
      <div className="max-w-[1500px] mx-auto p-8 relative">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-border/30">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
              Image Meta-Generation
            </h1>
            <p className="text-foreground/90 mt-2 text-lg">
              Transform your images with AI-powered metadata generation
            </p>
            {profile && (
              <div className="mt-2 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Logged in as: <span className="font-medium text-foreground">{profile.username || profile.email}</span>
                </span>
                <span className="text-sm text-muted-foreground ml-4">
                  Credits: <span className="font-medium text-foreground">{profile.credits}</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="gap-2 border-border/60 hover:bg-secondary/80">
              <Zap className="h-4 w-4 text-primary" />
              <span>Quick Start Guide</span>
            </Button>
            <Button variant="stockfillPrimary" className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
              <Upload className="h-4 w-4" />
              <span>Upload Images</span>
            </Button>
          </div>
        </div>

        {/* Main Upload Area */}
        <div className="bg-gradient-to-b from-background to-muted/20 border border-border/40 rounded-xl shadow-md overflow-hidden dark:bg-gradient-to-b dark:from-card/80 dark:to-background/80 dark:backdrop-blur-sm">
          <div className="p-1.5">
            <div className="bg-card/95 rounded-lg shadow-inner">
              <ImageUploader />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
