'use client'

import { motion } from 'framer-motion'
import { 
  Code, 
  Database, 
  Settings, 
  Eye, 
  Play,
  Zap,
  Sparkles,
  Bot,
  Globe
} from 'lucide-react'

export default function Showcase() {
  return (
    <section id="showcase" className="py-6 md:py-10 px-3 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            See BRMH in Action
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-gray-900">
            Intuitive Interface Designed for Developers
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore our powerful dashboard with real-time capabilities
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Interface Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-gray-900 rounded-xl p-4 md:p-6 shadow-2xl">
              {/* Browser Header */}
              <div className="flex items-center space-x-2 mb-4 md:mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1"></div>
                <div className="text-gray-400 text-xs md:text-sm">BRMH Dashboard</div>
              </div>

              {/* Sidebar */}
              <div className="flex space-x-3 md:space-x-4">
                <div className="w-36 md:w-48 bg-gray-800 rounded-lg p-3 md:p-4">
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Database className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Namespaces</span>
                    </div>
                    <div className="space-y-1">
                      <div className="bg-blue-600 text-white text-xs md:text-sm px-2 md:px-3 py-1 rounded">User API</div>
                      <div className="text-gray-400 text-xs md:text-sm px-2 md:px-3 py-1">Product API</div>
                      <div className="text-gray-400 text-xs md:text-sm px-2 md:px-3 py-1">Payment API</div>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300 mt-3 md:mt-4">
                      <Code className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Schemas</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-400 text-xs md:text-sm px-2 md:px-3 py-1">User Schema</div>
                      <div className="text-gray-400 text-xs md:text-sm px-2 md:px-3 py-1">Product Schema</div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-gray-800 rounded-lg p-3 md:p-4">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-xs md:text-base">User API - Methods</h3>
                      <button className="bg-green-600 text-white px-2 md:px-3 py-1 rounded text-xs flex items-center space-x-1">
                        <Play className="w-2 h-2 md:w-3 md:h-3" />
                        <span>Test</span>
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-gray-700 rounded p-2 md:p-3">
                        <div className="flex items-center space-x-2 mb-1 md:mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 text-xs md:text-sm font-mono">GET</span>
                          <span className="text-white text-xs md:text-sm">/api/users</span>
                          <span className="text-gray-400 text-[10px] md:text-xs">200 OK</span>
                        </div>
                        <div className="text-gray-300 text-[10px] md:text-xs">
                          Retrieve all users with pagination
                        </div>
                      </div>
                      
                      <div className="bg-gray-700 rounded p-2 md:p-3">
                        <div className="flex items-center space-x-2 mb-1 md:mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-400 text-xs md:text-sm font-mono">POST</span>
                          <span className="text-white text-xs md:text-sm">/api/users</span>
                          <span className="text-gray-400 text-[10px] md:text-xs">201 Created</span>
                        </div>
                        <div className="text-gray-300 text-[10px] md:text-xs">
                          Create a new user account
                        </div>
                      </div>
                      
                      <div className="bg-gray-700 rounded p-2 md:p-3">
                        <div className="flex items-center space-x-2 mb-1 md:mb-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-400 text-xs md:text-sm font-mono">PUT</span>
                          <span className="text-white text-xs md:text-sm">/api/users/:id</span>
                          <span className="text-gray-400 text-[10px] md:text-xs">200 OK</span>
                        </div>
                        <div className="text-gray-300 text-[10px] md:text-xs">
                          Update user information
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-white rounded-lg p-3 md:p-4 shadow-lg border border-gray-200"
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <div>
                  <div className="text-sm font-semibold">99.9%</div>
                  <div className="text-xs text-gray-500">Uptime</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Features List */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-gray-900">AI Lambda Generator</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Generate AWS Lambda functions from natural language. AI analyzes schemas and auto-generates serverless code with deployment automation.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Globe className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-gray-900">Intelligent Web Scraping</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Automatically extract API documentation from any website. Import Shopify, Stripe, GitHub APIs in minutes with AI-powered parsing.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Play className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-gray-900">Built-in API Testing</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Test APIs directly in browser with real-time responses. Syntax highlighting, request history, and validation built-in.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Database className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-gray-900">Smart Caching Layer</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    ElastiCache (Valkey) integration with duplicate detection and Algolia search for lightning-fast sub-10ms response times.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Settings className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-1 md:mb-2 text-gray-900">Advanced IAM System</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    Role-based access control with namespace-specific permissions. AWS Cognito auth and enterprise-grade security.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 md:p-6 border border-blue-100">
              <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-900">Ready to explore?</h3>
              <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4">
                Start building your first API with BRMH today.
              </p>
              <a href="/" className="btn-primary inline-block">
                Try BRMH Free
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
