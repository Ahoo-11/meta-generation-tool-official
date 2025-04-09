import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and query parameters
        const hash = window.location.hash
        const query = window.location.search
        
        console.log('Auth callback URL:', window.location.href)
        console.log('Hash:', hash, 'Query:', query)
        
        // Process the callback explicitly
        if (hash || query) {
          // The session should be automatically detected by Supabase
          // Let's verify it worked by checking for a session
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Auth session error:', error)
            throw error
          }
          
          if (session) {
            // Verify the user exists
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            
            if (userError || !user) {
              console.error('User validation error:', userError)
              throw new Error('Failed to validate user')
            }
            
            console.log('Successfully authenticated user:', user.email)
            toast({
              title: "Success",
              description: "Successfully authenticated!"
            })
            navigate('/app')
            return
          }
        }
        
        // If we get here, either there was no hash/query or the session wasn't found
        console.warn('No session found in callback')
        navigate('/auth')
      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          title: "Error",
          description: "Authentication failed. Please try again.",
          variant: "destructive"
        })
        navigate('/auth')
      }
    }

    handleAuthCallback()
  }, [navigate, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}

export default AuthCallback
