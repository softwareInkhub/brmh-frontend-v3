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
      ease: [0.4, 0, 0.2, 1] as const
    }
  }
}

export default function Features() {
  return (
    <section id="features" className="py-12 md:py-20 px-4 md:px-20 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="w-full md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-4 sm:py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-xs font-medium mb-2 sm:mb-3 md:mb-4">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            Features
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-2 sm:mb-3 md:mb-4 px-4 sm:px-0 text-gray-900 dark:text-white leading-tight">
            Powerful Features for Modern Developers
          </h2>
          <p className="text-xs sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            Everything you need to build, manage, and scale your APIs in one unified platform
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8 md:mb-0"
        >
          {/* Mobile: Horizontal Scrollable */}
          <div className="flex sm:hidden gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
            {features.map((feature, index) => (
              <motion.div
                key={`mobile-${index}`}
                variants={itemVariants}
                className="group flex-shrink-0 w-[85vw] max-w-sm snap-start"
              >
                <div className={`bg-white dark:bg-gray-900 rounded-xl p-4 border-2 ${feature.borderColor} dark:border-gray-700 ${feature.hoverColor} dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl dark:hover:shadow-gray-900/50 relative overflow-hidden h-full flex flex-col`}>
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 ${feature.bgColor} dark:opacity-0 opacity-0 group-hover:opacity-100 dark:group-hover:opacity-20 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-10 h-10 ${feature.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}>
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    
                    <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white transition-colors flex-shrink-0">
                      {feature.title}
                    </h3>
                    
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors flex-grow">
                      {feature.description}
                    </p>

                    {/* Learn more link */}
                    <div className="mt-3 flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors flex-shrink-0">
                      <span>Learn more</span>
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 auto-rows-fr">
            {features.map((feature, index) => (
              <motion.div
                key={`desktop-${index}`}
                variants={itemVariants}
                className="group h-full"
              >
                <div className={`bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border-2 ${feature.borderColor} dark:border-gray-700 ${feature.hoverColor} dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl dark:hover:shadow-gray-900/50 relative overflow-hidden h-full flex flex-col`}>
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 ${feature.bgColor} dark:opacity-0 opacity-0 group-hover:opacity-100 dark:group-hover:opacity-20 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm flex-shrink-0`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    
                    <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white transition-colors flex-shrink-0">
                      {feature.title}
                    </h3>
                    
                    <p className="text-xs md:text-base text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors flex-grow">
                      {feature.description}
                    </p>

                    {/* Learn more link */}
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors flex-shrink-0">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 md:mt-16 lg:mt-20 bg-gradient-to-r from-blue-100 via-indigo-50 to-purple-100 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 border border-blue-200 dark:border-gray-700"
        >
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">Enterprise-Grade Infrastructure</h3>
            <p className="text-xs sm:text-base text-gray-700 dark:text-gray-300">Built for scale, security, and performance</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8 auto-rows-fr">
            <div className="text-center group h-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Enterprise Security</h3>
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 leading-tight">Bank-level security with encryption, authentication, and compliance</p>
            </div>
            
            <div className="text-center group h-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Global Infrastructure</h3>
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 leading-tight">Deployed across multiple regions for optimal performance</p>
            </div>
            
            <div className="text-center group col-span-2 sm:col-span-1 lg:col-span-1 h-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-gray-900 dark:text-gray-100">Analytics & Monitoring</h3>
              <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 leading-tight">Real-time insights into API usage and performance</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 