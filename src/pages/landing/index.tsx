import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, Download, Star, Check, Menu, X } from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold">
                Pixel Keywording
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>

            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Pricing</a>
              <a href="#testimonials" className="block text-muted-foreground hover:text-foreground">Testimonials</a>
              <a href="#faq" className="block text-muted-foreground hover:text-foreground">FAQ</a>
              <Link to="/auth">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

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

      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compare Plans</h2>
            <p className="text-muted-foreground">Find the perfect plan for your needs</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Features</th>
                  <th className="p-4 text-center">Starter</th>
                  <th className="p-4 text-center">Pro</th>
                  <th className="p-4 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Monthly Credits", starter: "100", pro: "500", enterprise: "Unlimited" },
                  { feature: "Keyword Suggestions", starter: "Basic", pro: "Advanced", enterprise: "Custom" },
                  { feature: "Bulk Processing", starter: "❌", pro: "✅", enterprise: "✅" },
                  { feature: "API Access", starter: "❌", pro: "❌", enterprise: "✅" },
                  { feature: "Custom Model Training", starter: "❌", pro: "❌", enterprise: "✅" },
                  { feature: "Support", starter: "Email", pro: "Priority", enterprise: "24/7 Dedicated" }
                ].map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4">{row.feature}</td>
                    <td className="p-4 text-center">{row.starter}</td>
                    <td className="p-4 text-center">{row.pro}</td>
                    <td className="p-4 text-center">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 px-4" id="testimonials">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground">Join thousands of satisfied customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Professional Photographer",
                content: "Pixel Keywording has revolutionized how I tag my photos. The AI suggestions are incredibly accurate!",
                rating: 5
              },
              {
                name: "Mike Chen",
                role: "Marketing Director",
                content: "We've seen a 40% increase in image discoverability since using this tool. The bulk processing feature is a game-changer.",
                rating: 5
              },
              {
                name: "Emma Davis",
                role: "Content Creator",
                content: "The time I save on keywording allows me to focus more on creating content. Absolutely worth the investment!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 bg-card rounded-lg border">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="mb-4">{testimonial.content}</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/50" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Got questions? We've got answers</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How accurate are the AI-generated keywords?",
                a: "Our AI model achieves over 95% accuracy in keyword suggestions, trained on millions of professionally tagged images."
              },
              {
                q: "Can I use the service for commercial purposes?",
                a: "Yes! All our plans support commercial use. The Enterprise plan includes additional features for large-scale operations."
              },
              {
                q: "What happens to my unused credits?",
                a: "Credits never expire and roll over to the next month. You can use them whenever you need them."
              },
              {
                q: "How secure are my uploaded images?",
                a: "We use enterprise-grade encryption and secure cloud storage. Your images are automatically deleted after processing unless you choose to save them."
              }
            ].map((faq, index) => (
              <div key={index} className="p-6 bg-card rounded-lg border">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            {[
              "256-bit Encryption",
              "GDPR Compliant",
              "SOC 2 Certified",
              "99.9% Uptime"
            ].map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-sm font-medium">
                <Check className="h-4 w-4 text-primary" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

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
