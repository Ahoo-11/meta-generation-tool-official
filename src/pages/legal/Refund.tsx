
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const Refund = () => {
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
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Credit System</h2>
            <p>Our service operates on a credit-based system where:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>1 credit = 1 image processing</li>
              <li>Credits are purchased in bundles</li>
              <li>Credits do not expire</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Refund Eligibility</h2>
            <p>We offer refunds under the following conditions:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Unused credits within 14 days of purchase</li>
              <li>Service unavailability lasting more than 24 hours</li>
              <li>Technical issues preventing credit usage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Refund Process</h2>
            <p>To request a refund:</p>
            <ol className="list-decimal pl-6 mt-4 space-y-2">
              <li>Contact our support team at support@pixelkeywording.com</li>
              <li>Provide your order number and reason for refund</li>
              <li>We will review your request within 2 business days</li>
              <li>If approved, refund will be processed through original payment method</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Non-Refundable Cases</h2>
            <p>Refunds will not be issued for:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Used credits</li>
              <li>Requests after 14 days of purchase</li>
              <li>Violation of Terms of Service</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Refund
