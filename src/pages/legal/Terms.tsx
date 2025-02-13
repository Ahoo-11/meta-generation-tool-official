
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using Pixel Keywording ("the Service"), you agree to be bound by these Terms of Service ("Terms"), all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p>Upon purchasing credits or using our service, we grant you a limited, non-exclusive, non-transferable license to use our AI-powered image keywording service for your personal or business needs.</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Each credit allows for one image processing</li>
              <li>Credits are non-transferable and non-refundable except as specified in our Refund Policy</li>
              <li>You maintain all rights to your uploaded images</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Service Usage</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Upload any content that infringes on intellectual property rights</li>
              <li>Attempt to reverse engineer or extract the source code of our service</li>
              <li>Transfer or sell your account or credits to others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p>All payments are processed securely through Paddle. Credit purchases are final and non-refundable except as specified in our Refund Policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Privacy</h2>
            <p>Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Service Modifications</h2>
            <p>We reserve the right to modify or discontinue the Service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.</p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Terms
