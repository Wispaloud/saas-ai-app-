import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Target, TrendingUp } from 'lucide-react'

export function Hero() {
  return (
    <section className="container space-y-8 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
        <div className="flex items-center space-x-2 rounded-full bg-primary/10 px-3 py-1 text-sm">
          <Zap className="h-4 w-4" />
          <span>Powered by AI</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
          Generate High-Converting Ads with AI
        </h1>
        <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
          Transform your marketing with AI-powered ad generation. Create compelling copy that converts in seconds, not hours.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
          <Target className="h-8 w-8 text-primary" />
          <h3 className="font-semibold">Targeted Content</h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            AI analyzes your audience to create hyper-targeted ad copy that resonates.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
          <Zap className="h-8 w-8 text-primary" />
          <h3 className="font-semibold">Lightning Fast</h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Generate unlimited ad variations in seconds, not hours.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 rounded-lg border p-6">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h3 className="font-semibold">Higher Conversions</h3>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Our AI is trained on millions of successful ads to maximize your ROI.
          </p>
        </div>
      </div>
    </section>
  )
}
