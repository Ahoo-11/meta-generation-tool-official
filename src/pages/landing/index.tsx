
import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, Download, Star } from "lucide-react"
import { Link } from "react-router-dom"

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              AI-Powered Image Keywording
              <br />
              <span className="text-gradient">Made Simple</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Generate accurate, SEO-friendly keywords for your images in seconds.
              Perfect for photographers, marketers, and content creators.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="group">
                  Try for Free
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                See Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
            <p className="text-muted-foreground">
              Powerful features to supercharge your workflow
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "Bulk Processing",
                description: "Upload hundreds of images at once and process them in minutes"
              },
              {
                icon: Star,
                title: "AI Accuracy",
                description: "State-of-the-art AI models for precise keyword generation"
              },
              {
                icon: Download,
                title: "Easy Export",
                description: "Export your keywords in CSV format with one click"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border transition-colors hover:border-primary/50"
              >
                <feature.icon className="w-12 h-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Simple steps to get your image keywords
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              "Upload your images",
              "AI analyzes each image",
              "Get optimized keywords",
              "Export and use anywhere"
            ].map((step, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">{index + 1}</span>
                </div>
                <p className="font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Try it free with 5 credits. No credit card required.
          </p>
          <Link to="/auth">
            <Button size="lg">
              Start Generating Keywords
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">Pixel Keywording</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered image keywording for professionals
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-foreground">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/legal/terms" className="text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/legal/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/legal/refund" className="text-muted-foreground hover:text-foreground">
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">
                  support@pixelkeywording.com
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Pixel Keywording. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
