
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

const AuthPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          navigate('/')
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Success",
          description: "Successfully signed in!"
        })
        navigate('/')
      }
      
      if (event === 'SIGNED_OUT') {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully"
        })
      }

      if (event === 'USER_UPDATED') {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully"
        })
      }

      if (event === 'PASSWORD_RECOVERY') {
        toast({
          title: "Password Recovery",
          description: "Password recovery email has been sent"
        })
      }
    })

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, toast])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome</h1>
          <p className="text-muted-foreground mt-2">Sign in to get started</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: { background: 'white', color: 'black' },
              anchor: { color: 'gray' },
              divider: { background: 'gray' },
              message: { color: 'gray' }
            }
          }}
          theme="default"
          providers={['google']}
          redirectTo={window.location.origin}
          magicLink={false}
          view="sign_in"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign in',
                loading_button_label: 'Signing in...',
              }
            }
          }}
        />
      </div>
    </div>
  )
}

export default AuthPage
