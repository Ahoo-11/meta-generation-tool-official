
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Index from "./pages/Index"
import AuthPage from "./pages/Auth"
import { useSession } from '@supabase/auth-helpers-react'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = useSession()
  
  if (!session) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
)

export default App
