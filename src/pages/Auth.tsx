import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

const isDevelopment = import.meta.env.DEV;
const SITE_URL = isDevelopment 
  ? 'http://localhost:5173'
  : 'https://pixelkeywording.com';

// Function to get the correct redirect URL, always using the main domain in production
const getRedirectUrl = () => {
  if (isDevelopment) return `${window.location.origin}/auth/callback`;
  return `${SITE_URL}/auth/callback`;
};

// Function to get the current origin, handling both development and production
const getCurrentOrigin = () => {
  if (typeof window === 'undefined') return SITE_URL;
  return window.location.origin;
};

const AuthPage = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          throw error
        }
        
        if (session) {
          // Verify the session is valid by getting the user
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.error('User validation error:', userError)
            // Clear any invalid session
            await supabase.auth.signOut()
            setIsLoading(false)
            return
          }
          
          console.log('Valid session found, user:', user.email)
          navigate('/app')
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Session check error:', error)
        toast({
          title: "Error",
          description: "Failed to check session. Please try again.",
          variant: "destructive"
        })
        setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      
      if (event === 'SIGNED_IN' && session) {
        // Verify the user exists
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('User validation error after sign in:', userError)
          toast({
            title: "Error",
            description: "Authentication failed. Please try again.",
            variant: "destructive"
          })
          await supabase.auth.signOut()
          return
        }
        
        toast({
          title: "Success",
          description: "Successfully signed in!"
        })
        navigate('/app')
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome</h1>
          <p className="text-muted-foreground mt-2">Sign in to get started</p>
          {isDevelopment && (
            <p className="text-sm text-muted-foreground mt-1">Development Mode: {getCurrentOrigin()}</p>
          )}
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            style: {
              button: { background: 'white', color: 'black' },
              anchor: { color: 'gray' },
              divider: { background: 'gray' },
              message: { color: 'white' },
              input: { 
                backgroundColor: 'rgb(30, 30, 30)',
                borderColor: 'rgb(64, 64, 64)',
                color: 'white'
              },
              label: { color: 'white' }
            },
            variables: {
              default: {
                colors: {
                  brand: 'white',
                  brandAccent: 'rgb(64, 64, 64)',
                  inputBackground: 'rgb(30, 30, 30)',
                  inputBorder: 'rgb(64, 64, 64)',
                  inputText: 'white',
                  inputPlaceholder: 'rgb(156, 163, 175)'
                }
              }
            }
          }}
          theme="dark"
          providers={['google']}
          redirectTo={getRedirectUrl()}
          socialLayout="horizontal"
          magicLink={false}
          view="sign_in"
          showLinks={true}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign in',
                link_text: 'Already have an account? Sign in',
                password_input_placeholder: 'Your password',
                email_input_placeholder: 'Your email address'
              },
              forgotten_password: {
                email_label: 'Email address',
                button_label: 'Send reset instructions',
                link_text: 'Forgot your password?',
                confirmation_text: 'Check your email for the password reset link'
              }
            }
          }}
        />
      </div>
    </div>
  )
}

export default AuthPage
