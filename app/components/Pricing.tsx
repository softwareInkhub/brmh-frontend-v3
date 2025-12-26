'use client'

import { motion } from 'framer-motion'
import { Check, Star, Zap, Crown, Users } from 'lucide-react'

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for individual developers and small projects",
    icon: Zap,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    features: [
      "Up to 3 namespaces",
      "Basic API schemas",
      "100 API calls/month",
      "Community support",
      "Basic documentation"
    ],
    cta: "Get Started Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Ideal for growing teams and professional projects",
    icon: Star,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    features: [
      "Unlimited namespaces",
      "Advanced schemas & validation",
      "10,000 API calls/month",
      "Priority support",
      "Advanced analytics",
      "Custom domains",
      "Team collaboration",
      "API versioning"
    ],
    cta: "Start Pro Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with advanced requirements",
    icon: Crown,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    features: [
      "Everything in Pro",
      "Unlimited API calls",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantees",
      "Advanced security",
      "On-premise deployment",
      "Custom training"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-12 lg:mb-16"
        >
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold font-display mb-2 sm:mb-3 md:mb-4 text-gray-900 dark:text-white px-4 leading-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xs sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Choose the plan that fits your needs. Start free and scale as you grow.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="mb-8 md:mb-0">
          {/* Mobile: Horizontal Scrollable */}
          <div className="flex sm:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
            {plans.map((plan, index) => (
              <motion.div
                key={`mobile-${index}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative flex flex-col flex-shrink-0 w-[85vw] max-w-sm snap-start"
              >
                {plan.popular && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}
                
                <div className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-lg border-2 transition-all duration-300 h-full flex flex-col group ${
                  plan.popular 
                    ? 'border-blue-400 dark:border-purple-500 shadow-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  {/* Plan Header */}
                  <div className="text-center mb-4 flex-shrink-0">
                    <div className={`w-10 h-10 ${plan.bgColor} dark:opacity-80 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300`}>
                      <plan.icon className={`w-5 h-5 ${plan.color} ${
                        plan.color === 'text-blue-600' ? 'dark:text-blue-400' :
                        plan.color === 'text-purple-600' ? 'dark:text-purple-400' :
                        'dark:text-orange-400'
                      } group-hover:rotate-12 transition-transform duration-300`} />
                    </div>
                    
                    <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 px-1">{plan.description}</p>
                    
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button className={`w-full h-10 px-4 rounded-lg font-semibold text-xs transition-all duration-200 flex-shrink-0 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, index) => (
              <motion.div
                key={`desktop-${index}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative flex flex-col h-full"
              >
                {plan.popular && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}
                
                <div className={`bg-white dark:bg-gray-900 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-lg border-2 transition-all duration-300 h-full flex flex-col group ${
                  plan.popular 
                    ? 'border-blue-400 dark:border-purple-500 shadow-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/50 hover:border-purple-400 dark:hover:border-purple-400' 
                    : 'border-gray-200 dark:border-gray-700 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400 dark:hover:border-blue-500'
                }`}>
                  {/* Plan Header */}
                  <div className="text-center mb-6 md:mb-8 flex-shrink-0">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${plan.bgColor} dark:opacity-80 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <plan.icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${plan.color} ${
                        plan.color === 'text-blue-600' ? 'dark:text-blue-400' :
                        plan.color === 'text-purple-600' ? 'dark:text-purple-400' :
                        'dark:text-orange-400'
                      } group-hover:rotate-12 transition-transform duration-300`} />
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 md:mb-4 px-2">{plan.description}</p>
                    
                    <div className="mb-4 md:mb-6">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-sm sm:text-base text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-2 sm:space-x-3">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button className={`w-full h-12 px-6 rounded-lg font-semibold text-base transition-all duration-200 flex-shrink-0 group-hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl group-hover:shadow-2xl group-hover:shadow-purple-500/50'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:shadow-lg'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">No Setup Fees</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Start using BRMH immediately with zero setup costs</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Team Collaboration</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Invite team members and collaborate seamlessly</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">Instant Scaling</h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">Upgrade or downgrade your plan anytime</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 