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
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (session) {
          toast({
            title: "Success",
            description: "Successfully authenticated!"
          })
          navigate('/app')
        } else {
          navigate('/auth')
        }
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
