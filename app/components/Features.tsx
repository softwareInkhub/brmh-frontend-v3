'use client'

import { motion } from 'framer-motion'
import { 
  FolderOpen, 
  Code2, 
  Database, 
  Settings, 
  Share2, 
  Zap,
  Shield,
  Globe,
  GitBranch,
  BarChart3,
  Sparkles,
  ArrowRight
} from 'lucide-react'

const features = [
  {
    icon: FolderOpen,
    title: "Create and Manage Namespaces",
    description: "Organize your APIs into logical namespaces for better structure and management. Create unlimited namespaces with custom configurations.",
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    hoverColor: "hover:border-blue-300"
  },
  {
    icon: Code2,
    title: "Build & Control API Schemas",
    description: "Design comprehensive API schemas with validation rules, data types, and documentation. Full control over your API structure.",
    color: "text-green-600",
    bgColor: "bg-gradient-to-br from-green-50 to-green-100",
    borderColor: "border-green-200",
    hoverColor: "hover:border-green-300"
  },
  {
    icon: Database,
    title: "Store and Fetch APIs",
    description: "Seamlessly store and retrieve APIs from different platforms. Support for multiple data sources and formats.",
    color: "text-purple-600",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
    borderColor: "border-purple-200",
    hoverColor: "hover:border-purple-300"
  },
  {
    icon: Settings,
    title: "CRUD Operations",
    description: "Complete CRUD operations on methods and schemas. Create, read, update, and delete with powerful validation.",
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
    borderColor: "border-orange-200",
    hoverColor: "hover:border-orange-300"
  },
  {
    icon: Share2,
    title: "Live Sharing of Public APIs",
    description: "Make your namespaces public and share APIs with the developer community. Real-time updates and collaboration.",
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-pink-50 to-pink-100",
    borderColor: "border-pink-200",
    hoverColor: "hover:border-pink-300"
  },
  {
    icon: Zap,
    title: "High Performance",
    description: "Lightning-fast API responses with global CDN, caching, and optimized routing for the best developer experience.",
    color: "text-yellow-600",
    bgColor: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    borderColor: "border-yellow-200",
    hoverColor: "hover:border-yellow-300"
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

export default function Features() {
  return (
    <section id="features" className="py-12 md:py-20 px-4 md:px-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Features
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-gray-900">
            Powerful Features for Modern Developers
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need to build, manage, and scale your APIs in one unified platform
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group"
            >
              <div className={`bg-white rounded-2xl p-6 md:p-8 border-2 ${feature.borderColor} ${feature.hoverColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden`}>
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>

                  {/* Learn more link */}
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 md:mt-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 md:p-12 border border-blue-100"
        >
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Enterprise-Grade Infrastructure</h3>
            <p className="text-gray-600">Built for scale, security, and performance</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Enterprise Security</h3>
              <p className="text-sm text-gray-600">Bank-level security with encryption, authentication, and compliance</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Globe className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Global Infrastructure</h3>
              <p className="text-sm text-gray-600">Deployed across multiple regions for optimal performance</p>
            </div>
            
            <div className="text-center group sm:col-span-2 lg:col-span-1">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Analytics & Monitoring</h3>
              <p className="text-sm text-gray-600">Real-time insights into API usage and performance</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 