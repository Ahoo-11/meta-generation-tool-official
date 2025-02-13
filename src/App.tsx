
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import AuthPage from "./pages/Auth"
import LandingPage from "./pages/landing"
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { AppSidebar } from "@/components/layout/AppSidebar"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
      setIsLoading(false)
    })

    checkAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="flex">
      <AppSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
