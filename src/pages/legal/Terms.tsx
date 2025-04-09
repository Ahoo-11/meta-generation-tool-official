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
            <p>By accessing and using Pixel Keywording ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use the Service.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p>Pixel Keywording is an AI-powered tool that generates metadata and keywords for images and videos. The Service is provided on an "as is" and "as available" basis.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <p>You must register using Google Authentication to access the Service. You are responsible for maintaining the confidentiality of your account and agree to notify us immediately of any unauthorized use.</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Account sharing or reselling is prohibited</li>
              <li>One account per user</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription Plans and Credits</h2>
            <p>Each credit can be used to process either one image or one video, generating complete metadata including keywords, titles, category and descriptions for the processed content.</p>
            
            <h3 className="text-xl font-semibold mt-4">Free Plan</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>150 credits per month</li>
              <li>Credits refresh monthly</li>
              <li>No credit rollover</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Basic Plan - $20/month</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>5,000 credits per month + 150 free credits</li>
              <li>Total of 5,150 credits per month</li>
              <li>Credits expire at billing cycle end</li>
              <li>Includes video processing</li>
              <li>Option to purchase additional permanent credits</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Unlimited Plan (subject to fair usage) - $30/month</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Unlimited monthly processing (10,000 processes per day limit)</li>
              <li>Fair usage policy applies to prevent abuse of the service</li>
              <li>Option to purchase additional permanent credits</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Additional Credits</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>$5 for 1,000 credits</li>
              <li>No expiration - permanent credits remain valid as long as your account is active</li>
              <li>Available for all users (Free, Basic, and Unlimited plans)</li>
              <li>Permanent credits are used only after monthly subscription credits are depleted</li>
              <li>Non-refundable once purchased</li>
            </ul>
            
            <p className="mt-4">Credit usage priority: Monthly subscription credits are used first, followed by permanent additional credits. Unused monthly credits do not roll over to the next billing cycle.</p>
            
            <h3 className="text-xl font-semibold mt-4">When Credits Are Depleted</h3>
            <p>When a user exhausts their available credits:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>The user will be notified within the application that they have no remaining credits</li>
              <li>Processing of new images or videos will be paused until more credits are available</li>
              <li>All users (Free, Basic, and Unlimited plans) can purchase additional permanent credits at any time</li>
              <li>Users can wait for their monthly credit refresh at the start of their next billing cycle</li>
              <li>Users can upgrade to a higher-tier plan to receive more monthly credits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
            <p>All payments are processed through Paddle.com in USD. Subscriptions automatically renew unless cancelled. Upon cancellation, service remains active until the end of the billing cycle.</p>
            
            <h3 className="text-xl font-semibold mt-4">Subscription Billing</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Subscription fees are billed in advance on a monthly basis</li>
              <li>Automatic renewal occurs unless cancelled prior to the next billing date</li>
              <li>No partial refunds for mid-cycle cancellations</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4">Additional Credit Purchases</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>One-time payments processed immediately</li>
              <li>Credits are added to your account instantly upon successful payment</li>
              <li>No automatic renewal for additional credit purchases</li>
              <li>All sales of additional credits are final and non-refundable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Service Availability</h2>
            <p>We strive to maintain consistent service availability and include automatic retry mechanisms for failed processing. While we aim for reliable service, we do not guarantee 100% accuracy of AI-generated results.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Acceptable Use</h2>
            <p>The following types of content are prohibited:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Adult or explicit content</li>
              <li>Violent or graphic content</li>
              <li>Hateful or discriminatory content</li>
              <li>Content promoting illegal activities</li>
              <li>Misleading or fraudulent content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data and Privacy</h2>
            <p>We store basic usage statistics visible in your account dashboard. Account deletion removes all associated data. We do not store complete processed image metadata or titles for individual images. However, we do collect anonymous, aggregated keyword statistics to provide features like popular keyword trends and improve our service. No personal or identifying information is linked to these aggregated statistics. Uploaded content remains your property.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
            <p>For any questions regarding these Terms, please contact us at support@pixelkeywording.com</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
