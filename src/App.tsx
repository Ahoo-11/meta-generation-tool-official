import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import AuthPage from "./pages/Auth"
import AuthCallback from "./pages/AuthCallback"
import LandingPage from "./pages/landing"
import Terms from "./pages/legal/Terms"
import Privacy from "./pages/legal/Privacy"
import Refund from "./pages/legal/Refund"
import PurchaseCredits from "./pages/PurchaseCredits"
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSidebar } from "@/components/layout/AppSidebar"
import { HistoryTab } from "@/components/history/HistoryTab"
import { StatsTab } from "@/components/stats/StatsTab"

// Simple Settings placeholder component
const SettingsPlaceholder = () => (
  <div className="container mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">Settings</h1>
    <div className="p-6 bg-card rounded-lg border shadow-sm">
      <p className="text-center text-muted-foreground">Settings page coming soon!</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth session error:', error)
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
        
        if (session) {
          // Verify the user exists and is valid
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.error('User validation error:', userError)
            // Invalid session, sign out
            await supabase.auth.signOut()
            setIsAuthenticated(false)
          } else {
            console.log('Valid user session found:', user.email)
            setIsAuthenticated(true)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Verify the user exists and is valid
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('User validation error on auth state change:', userError)
          setIsAuthenticated(false)
        } else {
          console.log('Auth state changed, valid user:', user.email)
          setIsAuthenticated(true)
        }
      } else {
        setIsAuthenticated(false)
      }
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
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page with light theme */}
        <Route path="/" element={
          <ThemeProvider defaultTheme="light" storageKey="pixel-keywording-theme-landing">
            <TooltipProvider>
              <LandingPage />
            </TooltipProvider>
          </ThemeProvider>
        } />
        
        {/* App routes with dark theme */}
        <Route path="/app/*" element={
          <ThemeProvider defaultTheme="dark" storageKey="pixel-keywording-theme-app">
            <TooltipProvider>
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="history" element={<HistoryTab />} />
                  <Route path="stats" element={<StatsTab />} />
                  <Route path="settings" element={<SettingsPlaceholder />} />
                  <Route path="purchase-credits" element={<PurchaseCredits />} />
                </Routes>
              </ProtectedRoute>
            </TooltipProvider>
          </ThemeProvider>
        } />
        
        {/* Auth and legal pages with system theme */}
        <Route path="/auth" element={
          <ThemeProvider defaultTheme="system" storageKey="pixel-keywording-theme-auth">
            <TooltipProvider>
              <AuthPage />
            </TooltipProvider>
          </ThemeProvider>
        } />
        <Route path="/auth/callback" element={
          <ThemeProvider defaultTheme="system" storageKey="pixel-keywording-theme-auth">
            <TooltipProvider>
              <AuthCallback />
            </TooltipProvider>
          </ThemeProvider>
        } />
        <Route path="/legal/terms" element={
          <ThemeProvider defaultTheme="system" storageKey="pixel-keywording-theme-legal">
            <TooltipProvider>
              <Terms />
            </TooltipProvider>
          </ThemeProvider>
        } />
        <Route path="/legal/privacy" element={
          <ThemeProvider defaultTheme="system" storageKey="pixel-keywording-theme-legal">
            <TooltipProvider>
              <Privacy />
            </TooltipProvider>
          </ThemeProvider>
        } />
        <Route path="/legal/refund" element={
          <ThemeProvider defaultTheme="system" storageKey="pixel-keywording-theme-legal">
            <TooltipProvider>
              <Refund />
            </TooltipProvider>
          </ThemeProvider>
        } />
      </Routes>
      <Toaster />
      <Sonner />
    </BrowserRouter>
  )
}

export default App
