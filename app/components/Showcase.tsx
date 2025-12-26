'use client'

import { motion } from 'framer-motion'
import { 
  Code, 
  Database, 
  Settings, 
  Eye, 
  Copy,
  Check,
  Play,
  Zap
} from 'lucide-react'

export default function Showcase() {
  return (
    <section id="showcase" className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
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
            See BRMH in Action
          </h2>
          <p className="text-xs sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Explore our intuitive interface designed for developers, by developers
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
          {/* Left: Interface Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full lg:w-auto"
          >
          <div className="bg-gray-900 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-2xl">
              {/* Browser Header */}
              <div className="flex items-center space-x-1.5 md:space-x-2 mb-3 md:mb-6">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1"></div>
                <div className="text-gray-400 text-[10px] md:text-sm">BRMH Dashboard</div>
              </div>

              {/* Sidebar */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
                <div className="w-full sm:w-32 md:w-48 bg-gray-800 rounded-lg p-2.5 md:p-4">
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center space-x-1.5 md:space-x-2 text-gray-300">
                      <Database className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-sm">Namespaces</span>
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      <div className="bg-primary-600 text-white text-[10px] md:text-sm px-1.5 md:px-3 py-0.5 md:py-1 rounded">User API</div>
                      <div className="text-gray-400 text-[10px] md:text-sm px-1.5 md:px-3 py-0.5 md:py-1">Product API</div>
                      <div className="text-gray-400 text-[10px] md:text-sm px-1.5 md:px-3 py-0.5 md:py-1">Payment API</div>
                    </div>
                    <div className="flex items-center space-x-1.5 md:space-x-2 text-gray-300 mt-2 md:mt-4">
                      <Code className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[10px] md:text-sm">Schemas</span>
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      <div className="text-gray-400 text-[10px] md:text-sm px-1.5 md:px-3 py-0.5 md:py-1">User Schema</div>
                      <div className="text-gray-400 text-[10px] md:text-sm px-1.5 md:px-3 py-0.5 md:py-1">Product Schema</div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-gray-800 rounded-lg p-2.5 md:p-4">
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-xs md:text-base">User API - Methods</h3>
                      <button className="bg-green-600 text-white px-1.5 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-sm flex items-center space-x-0.5 md:space-x-1">
                        <Play className="w-2.5 h-2.5 md:w-3 md:h-3" />
                        <span>Test</span>
                      </button>
                    </div>
                    
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="bg-gray-700 rounded p-1.5 md:p-3">
                        <div className="flex items-center space-x-1 md:space-x-2 mb-1 md:mb-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 text-[10px] md:text-sm font-mono">GET</span>
                          <span className="text-white text-[10px] md:text-sm">/api/users</span>
                          <span className="text-gray-400 text-[9px] md:text-xs">200 OK</span>
                        </div>
                        <div className="text-gray-300 text-[9px] md:text-xs">
                          Retrieve all users with pagination
                        </div>
                      </div>
                      
                      <div className="bg-gray-700 rounded p-1.5 md:p-3">
                        <div className="flex items-center space-x-1 md:space-x-2 mb-1 md:mb-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-400 text-[10px] md:text-sm font-mono">POST</span>
                          <span className="text-white text-[10px] md:text-sm">/api/users</span>
                          <span className="text-gray-400 text-[9px] md:text-xs">201 Created</span>
                        </div>
                        <div className="text-gray-300 text-[9px] md:text-xs">
                          Create a new user account
                        </div>
                      </div>
                      
                      <div className="bg-gray-700 rounded p-1.5 md:p-3">
                        <div className="flex items-center space-x-1 md:space-x-2 mb-1 md:mb-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-400 text-[10px] md:text-sm font-mono">PUT</span>
                          <span className="text-white text-[10px] md:text-sm">/api/users/:id</span>
                          <span className="text-gray-400 text-[9px] md:text-xs">200 OK</span>
                        </div>
                        <div className="text-gray-300 text-[9px] md:text-xs">
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
              className="absolute -top-2 -right-2 md:-top-4 md:-right-4 bg-white dark:bg-gray-800 rounded-lg p-2 md:p-4 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <Zap className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">99.9%</div>
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Uptime</div>
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
            className="space-y-4 md:space-y-8 mt-6 lg:mt-0"
          >
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Code className="w-4 h-4 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2 text-gray-900 dark:text-white">Visual Schema Builder</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs md:text-base">
                    Design your API schemas with our intuitive drag-and-drop interface. 
                    No more writing JSON by hand - build complex schemas visually.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Play className="w-4 h-4 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2 text-gray-900 dark:text-white">Live API Testing</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs md:text-base">
                    Test your APIs directly in the browser with our built-in testing tool. 
                    See responses in real-time with syntax highlighting.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-4 h-4 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2 text-gray-900 dark:text-white">Advanced Configuration</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs md:text-base">
                    Fine-tune your APIs with advanced settings, validation rules, 
                    and custom middleware. Full control over your API behavior.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 md:space-x-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 md:w-6 md:h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2 text-gray-900 dark:text-white">Real-time Monitoring</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs md:text-base">
                    Monitor your API performance with detailed analytics, 
                    request logs, and error tracking. Stay on top of your API health.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-3 md:p-6">
              <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2 text-gray-900 dark:text-white">Ready to explore?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2 md:mb-4 text-xs md:text-base">
                Start building your first API with BRMH today.
              </p>
              <a href="#get-started" className="inline-flex items-center justify-center h-10 md:h-12 px-4 md:px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-xs md:text-base min-w-[120px] md:min-w-[180px]">
                Try BRMH Free
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 