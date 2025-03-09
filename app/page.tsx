import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, Users, PiggyBank, TrendingUp, DollarSign } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chama System</h1>
          <div className="space-x-2">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/90 to-primary/70 text-primary-foreground">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Modern Chama Management</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Streamline your community savings group with our powerful digital platform
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Users className="h-10 w-10" />}
                title="Member Management"
                description="Easily manage members, roles, and permissions within your chama group."
              />
              <FeatureCard
                icon={<PiggyBank className="h-10 w-10" />}
                title="Contribution Tracking"
                description="Track all member contributions with detailed transaction history."
              />
              <FeatureCard
                icon={<TrendingUp className="h-10 w-10" />}
                title="Investment Management"
                description="Monitor investments and analyze performance with powerful tools."
              />
              <FeatureCard
                icon={<DollarSign className="h-10 w-10" />}
                title="Loan Management"
                description="Streamline loan applications, approvals, and repayment tracking."
              />
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to transform your chama?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of chama groups already using our platform to manage their finances.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground">
                Sign Up Now
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-secondary py-8">
        <div className="container text-center text-secondary-foreground">
          <p>© {new Date().getFullYear()} Chama Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border flex flex-col items-center text-center">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

