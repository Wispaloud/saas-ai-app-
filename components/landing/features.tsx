import { 
  Brain, 
  Globe, 
  Zap, 
  BarChart, 
  Shield, 
  Users 
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: "AI-Powered Generation",
    description: "Advanced GPT-4 integration creates compelling ad copy tailored to your brand voice and target audience."
  },
  {
    icon: Globe,
    title: "Multi-Platform Support",
    description: "Generate ads for Facebook, Instagram, Google Ads, LinkedIn, and more platforms from a single prompt."
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get multiple ad variations in seconds. No more writer's block or endless revisions."
  },
  {
    icon: BarChart,
    title: "Performance Analytics",
    description: "Track which ad variations perform best and optimize your campaigns with data-driven insights."
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description: "AI ensures all generated content aligns with your brand guidelines and compliance requirements."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together with your team to create, review, and approve ad campaigns in one place."
  }
]

export function Features() {
  return (
    <section id="features" className="container space-y-6 py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[980px] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Everything You Need to Scale Your Marketing
        </h2>
        <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
          Powerful features designed to help marketers create better ads, faster.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
        {features.map((feature, index) => (
          <div key={index} className="flex flex-col space-y-3 rounded-lg border p-6">
            <feature.icon className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">{feature.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
