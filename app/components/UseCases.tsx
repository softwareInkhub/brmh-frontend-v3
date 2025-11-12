'use client'

import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  Smartphone, 
  Building2, 
  Rocket,
  Code,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

const useCases = [
  {
    title: "E-commerce Integration",
    icon: ShoppingCart,
    color: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    description: "Manage Shopify, WooCommerce, and custom store APIs in one place",
    features: [
      "Unified product catalog across platforms",
      "Real-time inventory sync",
      "Order processing automation",
      "Customer data management"
    ],
    example: "E-commerce Platform"
  },
  {
    title: "Mobile App Backend",
    icon: Smartphone,
    color: "from-purple-500 to-pink-500",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    description: "Build scalable backend APIs for iOS and Android applications",
    features: [
      "User authentication & profiles",
      "Push notifications via WHAPI",
      "Cloud file storage (BRMH Drive)",
      "Real-time data sync"
    ],
    example: "Social Media App"
  },
  {
    title: "Enterprise Microservices",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    description: "Orchestrate complex microservice architectures with ease",
    features: [
      "Service discovery & routing",
      "Inter-service communication",
      "Centralized schema management",
      "Role-based access control (IAM)"
    ],
    example: "Enterprise SaaS"
  },
  {
    title: "Rapid Prototyping",
    icon: Rocket,
    color: "from-green-500 to-emerald-500",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    description: "Launch MVPs and prototypes in hours, not weeks",
    features: [
      "AI-generated Lambda functions",
      "Auto-scraped API documentation",
      "Instant mock data generation",
      "One-click deployments"
    ],
    example: "Startup MVP"
  }
]

export default function UseCases() {
  return (
    <section className="py-6 md:py-10 px-3 md:px-12 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 rounded-full text-green-700 text-sm font-medium mb-4">
            <Rocket className="w-4 h-4" />
            Use Cases
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-gray-900">
            Built for Every Scenario
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From startups to enterprises, BRMH adapts to your needs
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-10">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-10 rounded-full blur-3xl transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 ${useCase.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <useCase.icon className={`w-7 h-7 ${useCase.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                        {useCase.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {useCase.description}
                      </p>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 mb-4">
                    {useCase.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Example Badge */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                        Example: {useCase.example}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

