
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <Button 
            variant="outline"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            Back to Home
          </Button>
        </div>
        <p className="text-muted-foreground">Last Updated: February 14, 2025</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Introduction</h2>
          <p>
            This Privacy Policy explains how Pixel Keywording ("we," "us," or "our") collects, uses, and protects your information when you use our service at pixelkeywording.com. We are committed to protecting your privacy and handling your data in a transparent manner.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email address (through Google Authentication)</li>
              <li>Basic profile information from Google Authentication</li>
              <li>Account preferences and settings</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Website Analytics</h3>
            <p>We use Google Analytics to collect anonymous data about website usage, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Page visit statistics</li>
              <li>Visitor geographic locations</li>
              <li>User retention metrics</li>
              <li>Website performance data</li>
            </ul>
            <p>This data helps us improve our website experience and does not include personal information.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Service Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Credit balance and usage history</li>
              <li>Service interaction logs</li>
              <li>Technical performance metrics</li>
              <li>Error logs for service improvement</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Payment Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processing is handled entirely by Paddle.com</li>
              <li>We do not store your payment information</li>
              <li>Please refer to Paddle's privacy policy for payment data handling</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How We Process Your Data</h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Cloud Processing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Content is processed using secure cloud AI infrastructure</li>
              <li>All data transmission uses enterprise-grade encryption</li>
              <li>Processing results are temporary and cleared after completion</li>
              <li>We do not retain or use your content for AI training</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Data Storage</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information is stored in secure cloud databases</li>
              <li>Credit system data is maintained for account management</li>
              <li>Service logs are retained for technical support</li>
              <li>All stored data is encrypted at rest</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Request corrections to your data</li>
            <li>Request deletion of your data</li>
            <li>Restrict the processing of your data</li>
            <li>Receive a copy of your data</li>
          </ul>
          <p>To exercise these rights, contact us at support@pixelkeywording.com</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account data is retained until account deletion</li>
            <li>Usage statistics are maintained while the account is active</li>
            <li>Processed content is not retained after processing is complete</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy occasionally. We will notify you of any material changes by posting the new Privacy Policy on this page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at: support@pixelkeywording.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
