'use client'

import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown, Users } from 'lucide-react'

const plans = [
  {
    name: "Developer",
    price: "Free",
    description: "Perfect for individual developers and prototyping",
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    features: [
      "Up to 5 namespaces",
      "100 API methods",
      "50 schemas",
      "Basic AI code generation (10/month)",
      "1GB BRMH Drive storage",
      "Community support",
      "DynamoDB + ElastiCache",
      "API testing & validation"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For growing teams and production applications",
    icon: Star,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    features: [
      "Unlimited namespaces",
      "Unlimited API methods & schemas",
      "Advanced AI code generation (unlimited)",
      "AWS Lambda deployment",
      "Web scraping automation",
      "50GB BRMH Drive storage",
      "WHAPI notifications",
      "IAM role management",
      "Algolia search indexing",
      "Priority support",
      "Team collaboration (up to 10 users)"
    ],
    cta: "Start 14-Day Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations requiring dedicated infrastructure",
    icon: Crown,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    features: [
      "Everything in Professional",
      "Dedicated AWS infrastructure",
      "Custom ElastiCache configuration",
      "Unlimited BRMH Drive storage",
      "Multi-region deployment",
      "Custom AI model training",
      "Advanced IAM policies",
      "99.99% SLA guarantee",
      "Dedicated account manager",
      "Custom integrations",
      "On-premise deployment option",
      "24/7 enterprise support"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-6 md:py-10 px-3 md:px-12 bg-gray-50">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your needs. Start free and scale as you grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'md:-mt-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className={`bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular ? 'border-primary-200 shadow-xl' : 'border-gray-200'
              }`}>
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 ${plan.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className={`w-8 h-8 ${plan.color}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-500 ml-1">{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                {plan.cta === "Contact Sales" ? (
                  <a href="#contact" className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 text-center block ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}>
                    {plan.cta}
                  </a>
                ) : (
                  <a href="/" className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 text-center block ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}>
                    {plan.cta}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Setup Fees</h3>
                <p className="text-gray-600 text-sm">Start using BRMH immediately with zero setup costs</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
                <p className="text-gray-600 text-sm">Invite team members and collaborate seamlessly</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Scaling</h3>
                <p className="text-gray-600 text-sm">Upgrade or downgrade your plan anytime</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 