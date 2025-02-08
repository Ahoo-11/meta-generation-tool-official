
import { ImageUploader } from '@/components/ImageUploader'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { useSession } from '@supabase/auth-helpers-react'
import { useToast } from '@/hooks/use-toast'

const Index = () => {
  const session = useSession()
  const { toast } = useToast()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Image Meta-Generation
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
        <ImageUploader />
      </div>
    </div>
  )
}

export default Index
