import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useProfileStore } from "@/stores/profileStore"
import { CreditCard, Zap, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { addCredits } from "@/services/uploadService"

const PurchaseCredits = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { profile, refreshProfile } = useProfileStore()

  const handlePurchase = async (amount: number, packageName: string) => {
    setIsProcessing(true)
    
    try {
      // In a real implementation, this would redirect to a payment gateway
      // For demo purposes, we'll just call the addCredits function directly
      const success = await addCredits(amount, packageName);
      
      if (success) {
        toast({
          title: "Credits Added Successfully",
          description: `${amount} credits have been added to your account.`,
        });
        await refreshProfile();
      } else {
        throw new Error("Failed to add credits");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pl-72">
      <div className="max-w-[1200px] mx-auto p-8 relative">
        {/* Header Section */}
        <div className="mb-10 pb-6 border-b border-border/30">
          <div className="flex items-center mb-4">
            <Link to="/app">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
            Purchase Additional Credits
          </h1>
          <p className="text-foreground/90 mt-2 text-lg">
            Add permanent credits to your account that never expire
          </p>
        </div>

        {/* Current Credits */}
        <div className="mb-8 p-6 bg-card/50 rounded-lg border border-border/40 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Current Balance</h2>
              <p className="text-muted-foreground">Your available credits</p>
            </div>
            <div className="text-3xl font-bold text-primary flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              {profile?.credits || 0}
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center p-12 bg-card rounded-lg border border-border/40 shadow-md">
          <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
          <p className="text-xl text-muted-foreground mb-6">
            Additional credit purchases will be available shortly. Stay tuned!
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/app">
              <Button size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
            <Link to="/app/payment-test">
              <Button size="lg" variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Test Payment Integration
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 p-6 bg-card/50 rounded-lg border border-border/40 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">Do these credits expire?</h3>
              <p className="text-muted-foreground">No, additional purchased credits never expire as long as your account remains active.</p>
            </div>
            <div>
              <h3 className="font-medium text-lg">How are credits used?</h3>
              <p className="text-muted-foreground">Your monthly subscription credits are used first, followed by any additional purchased credits.</p>
            </div>
            <div>
              <h3 className="font-medium text-lg">Can I get a refund?</h3>
              <p className="text-muted-foreground">All credit purchases are final and non-refundable. Please refer to our <Link to="/legal/refund" className="text-primary hover:underline">Refund Policy</Link> for more details.</p>
            </div>
          </div>
        </div>

        {/* Payment Security Notice */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center text-muted-foreground">
            <CreditCard className="h-4 w-4 mr-2" />
            <span>Secure payment processing via Paddle</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseCredits
