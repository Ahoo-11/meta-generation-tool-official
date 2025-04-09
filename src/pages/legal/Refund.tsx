import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
const Refund = () => {
  return <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Payment & Refund Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Subscription Plans</h2>
            
            <h3 className="text-xl font-semibold mt-4">Free Plan</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>150 credits per month</li>
              <li>Credits refresh monthly</li>
              <li>No rollover to next month</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Basic Plan ($20/month)</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>5,000 credits per month</li>
              <li>Full feature access including video processing</li>
              <li>Credits refresh monthly</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Unlimited Plan (subject to fair usage) ($30/month)</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Unlimited monthly processing (10,000 processes per day limit)</li>
              <li>Fair usage policy applies to prevent abuse of the service</li>
              <li>All features included</li>
              <li>Automated rate limiting applies when limits are exceeded</li>
              <li>Account suspension may occur for consistent policy violations</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Additional Credits</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>$5 for 1,000 credits</li>
              <li>Available to all users (Free, Basic, and Unlimited plans)</li>
              <li>No expiration</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Credit System</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>1 credit = 1 image or video process</li>
              <li>Credits refresh at the start of each billing cycle  </li>
              <li>Supports common image formats (JPEG, PNG) and video (MP4)</li>
              <li>No rollover of unused credits</li>
              <li>Anonymous, aggregated keyword statistics may be collected to provide trending features</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4">When Credits Are Depleted</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Users are notified when their credits are running low or have been depleted</li>
              <li>All users (Free, Basic, and Unlimited plans) can purchase additional permanent credits at $5 per 1,000 credits</li>
              <li>Additional purchased credits never expire as long as the account remains active</li>
              <li>Users can wait for their monthly credit refresh at the start of their next billing cycle</li>
              <li>Users can upgrade to a higher-tier plan for more monthly credits</li>
              <li>Processing is paused until more credits are available</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All payments are processed securely through Paddle.com</li>
              <li>Prices are in USD</li>
              <li>No additional fees beyond subscription costs</li>
              <li>Payment confirmation emails are sent automatically</li>
              <li>Subscription payments are due at the start of each billing cycle</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Service Availability</h2>
            <p>Service unavailability is defined as:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Inability to access the metadata generation tool</li>
              <li>Inability to process images or videos</li>
              <li>Refunds considered for disruptions exceeding 24 consecutive hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Refund Eligibility</h2>
            <p>We offer refunds under the following conditions:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Service unavailability exceeding 24 consecutive hours</li>
              <li>Refund requests must be submitted within 48 hours of the incident</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-4">Non-Eligible Conditions</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Accidental purchases</li>
              <li>Dissatisfaction with service results</li>
              <li>Unused credits or services</li>
              <li>Cancelled subscriptions</li>
              <li>Technical issues lasting less than 24 hours</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Subscription Management</h2>
            <h3 className="text-xl font-semibold mt-4">Cancellation</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Users can cancel subscriptions through the app dashboard</li>
              <li>No notice period required</li>
              <li>Service remains active until end of current billing cycle</li>
              <li>No refunds for remaining subscription period</li>
              <li>Unused credits expire upon subscription end</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">Plan Changes</h3>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Users can upgrade or downgrade at any time</li>
              <li>New plan requires full payment</li>
              <li>No prorating between plans</li>
              <li>Previous plan remains active until billing cycle ends</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Contact Information</h2>
            <p>For any payment or refund related queries:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Email: support@pixelkeywording.com</li>
              <li>Include your account email and transaction details in correspondence</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Policy Changes</h2>
            <p>
              We reserve the right to modify this policy at any time. Users will be notified of significant changes via email.
            </p>
          </section>
        </div>
      </div>
    </div>;
};
export default Refund;