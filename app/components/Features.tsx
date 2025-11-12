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
    title: "Namespace Management",
    description: "Organize APIs into logical namespaces with accounts, methods, schemas, webhooks, and lambdas. Support for 25+ integrations including Shopify, Instagram, Gmail, and AWS services.",
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    hoverColor: "hover:border-blue-300"
  },
  {
    icon: Sparkles,
    title: "AI-Powered Code Generation",
    description: "Generate AWS Lambda functions from natural language descriptions. AI agents analyze schemas and auto-generate serverless code with deployment automation.",
    color: "text-purple-600",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
    borderColor: "border-purple-200",
    hoverColor: "hover:border-purple-300"
  },
  {
    icon: Database,
    title: "Smart Data Layer",
    description: "DynamoDB integration with intelligent ElastiCache (Valkey) caching, duplicate detection, and Algolia search indexing for lightning-fast data access and retrieval.",
    color: "text-green-600",
    bgColor: "bg-gradient-to-br from-green-50 to-green-100",
    borderColor: "border-green-200",
    hoverColor: "hover:border-green-300"
  },
  {
    icon: Code2,
    title: "Web Scraping Engine",
    description: "Automatically extract API documentation from websites. Scrape endpoints from Shopify, Stripe, GitHub and custom URLs with AI-powered schema generation.",
    color: "text-indigo-600",
    bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    borderColor: "border-indigo-200",
    hoverColor: "hover:border-indigo-300"
  },
  {
    icon: GitBranch,
    title: "Serverless Lambda Deployment",
    description: "Deploy Node.js Lambda functions to AWS with automatic API Gateway setup, environment management, and version tracking. Zero-config deployments.",
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
    borderColor: "border-orange-200",
    hoverColor: "hover:border-orange-300"
  },
  {
    icon: Shield,
    title: "IAM & Security",
    description: "Role-based access control with namespace-specific permissions. OAuth2 integration, AWS Cognito authentication, and enterprise-grade security policies.",
    color: "text-red-600",
    bgColor: "bg-gradient-to-br from-red-50 to-red-100",
    borderColor: "border-red-200",
    hoverColor: "hover:border-red-300"
  },
  {
    icon: Share2,
    title: "File Management (BRMH Drive)",
    description: "Complete drive-like file system with S3 storage, folder hierarchies, sharing permissions, and seamless namespace integration for project files.",
    color: "text-cyan-600",
    bgColor: "bg-gradient-to-br from-cyan-50 to-cyan-100",
    borderColor: "border-cyan-200",
    hoverColor: "hover:border-cyan-300"
  },
  {
    icon: Zap,
    title: "Real-time Notifications",
    description: "WHAPI integration for WhatsApp notifications, CRUD operation triggers, event-driven webhooks, and customizable notification templates for team collaboration.",
    color: "text-pink-600",
    bgColor: "bg-gradient-to-br from-pink-50 to-pink-100",
    borderColor: "border-pink-200",
    hoverColor: "hover:border-pink-300"
  },
  {
    icon: BarChart3,
    title: "Analytics & Monitoring",
    description: "Real-time API usage analytics, performance monitoring, error tracking, and detailed request logs. Dashboard with insights into success rates and response times.",
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
    <section id="features" className="py-6 md:py-10 px-3 md:px-12 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
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
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Powered by AWS Enterprise Infrastructure</h3>
            <p className="text-gray-600">Production-ready tech stack with proven reliability</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">DynamoDB</h3>
              <p className="text-sm text-gray-600">NoSQL database for namespaces, schemas, and metadata with auto-scaling</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">ElastiCache</h3>
              <p className="text-sm text-gray-600">Valkey-powered caching for sub-millisecond response times</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <GitBranch className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Lambda & S3</h3>
              <p className="text-sm text-gray-600">Serverless compute and scalable storage for files and deployments</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Cognito Auth</h3>
              <p className="text-sm text-gray-600">Secure authentication with OAuth2, phone, and social login support</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 