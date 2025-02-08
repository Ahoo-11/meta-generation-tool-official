
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

const AuthPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/')
      }
      
      // Handle auth errors
      if (event === 'USER_DELETED' || event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully"
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, toast])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome</h1>
          <p className="text-muted-foreground mt-2">Sign in to get started</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="default"
          providers={[]}
          redirectTo={window.location.origin}
          onError={(error) => {
            toast({
              title: "Authentication Error",
              description: error.message,
              variant: "destructive"
            })
          }}
          magicLink={false}
          showLinks={false}
          view="sign_in"
        />
      </div>
    </div>
  )
}

export default AuthPage
