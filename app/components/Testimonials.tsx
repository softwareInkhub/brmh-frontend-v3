'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Backend Developer",
    company: "TechCorp",
    avatar: "SC",
    content: "BRMH has completely transformed how we manage our APIs. The visual schema builder is a game-changer, and the real-time testing saves us hours of development time.",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "API Architect",
    company: "StartupXYZ",
    avatar: "MR",
    content: "The namespace organization feature is brilliant. We can now manage multiple client APIs in one place with perfect separation. Highly recommended for any development team.",
    rating: 5
  },
  {
    name: "Emily Watson",
    role: "Full Stack Developer",
    company: "DevStudio",
    avatar: "EW",
    content: "I love how easy it is to share APIs with the community. The public namespace feature has helped us collaborate with other developers seamlessly.",
    rating: 5
  }
]

const companies = [
  "TechCorp", "StartupXYZ", "DevStudio", "InnovateLab", "CodeCraft", "DataFlow"
]

export default function Testimonials() {

  return (
    <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
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
            Loved by Developers Worldwide
          </h2>
          <p className="text-xs sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Join thousands of developers who trust BRMH for their API management needs
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10 md:mb-12 lg:mb-16"
        >
          {/* Mobile: Horizontal Auto-scroll (Right to Left) */}
          <div className="overflow-hidden relative py-3 sm:hidden -mx-4 px-4">
            <div className="flex animate-scroll gap-4 items-center">
              {/* First set */}
              {testimonials.map((testimonial, index) => (
                <div
                  key={`mobile-first-${index}`}
                  className="flex-shrink-0 w-[75vw] max-w-[280px] bg-gray-50 dark:bg-gray-900 rounded-lg p-3.5 border border-gray-200 dark:border-gray-800"
                >
                  {/* Rating */}
                  <div className="flex items-center space-x-0.5 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="mb-4">
                    <Quote className="w-6 h-6 text-primary-200 dark:text-primary-700 mb-1.5" />
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold text-xs">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {testimonials.map((testimonial, index) => (
                <div
                  key={`mobile-second-${index}`}
                  className="flex-shrink-0 w-[75vw] max-w-[280px] bg-gray-50 dark:bg-gray-900 rounded-lg p-3.5 border border-gray-200 dark:border-gray-800"
                >
                  {/* Rating */}
                  <div className="flex items-center space-x-0.5 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="mb-4">
                    <Quote className="w-6 h-6 text-primary-200 dark:text-primary-700 mb-1.5" />
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold text-xs">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg md:rounded-xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-800"
              >
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500" />
                  ))}
                </div>

                {/* Quote */}
                <div className="mb-6">
                  <Quote className="w-8 h-8 text-primary-200 dark:text-primary-700 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trusted By Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="mb-6 md:mb-8 lg:mb-10">
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold mb-3 md:mb-4">
              Trusted Worldwide
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 dark:from-gray-200 dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent mt-3 md:mt-4 px-4">
              Trusted by leading companies
            </h3>
          </div>
          
          {/* Scrolling Companies */}
          <div className="overflow-hidden relative py-3 md:py-4 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="flex animate-scroll gap-8 sm:gap-12 md:gap-16 lg:gap-20 items-center px-4 sm:px-6 lg:px-8">
              {/* First set */}
              {companies.map((company, index) => {
                const gradients = [
                  'from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-300',
                  'from-purple-600 via-purple-500 to-pink-500 dark:from-purple-400 dark:via-purple-300 dark:to-pink-300',
                  'from-green-600 via-green-500 to-emerald-500 dark:from-green-400 dark:via-green-300 dark:to-emerald-300',
                  'from-orange-600 via-orange-500 to-red-500 dark:from-orange-400 dark:via-orange-300 dark:to-red-300',
                  'from-indigo-600 via-indigo-500 to-purple-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-purple-300',
                  'from-pink-600 via-pink-500 to-rose-500 dark:from-pink-400 dark:via-pink-300 dark:to-rose-300'
                ];
                return (
                  <div
                    key={`first-${index}`}
                    className="flex-shrink-0 flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${gradients[index % gradients.length]} font-extrabold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl whitespace-nowrap tracking-tight`}>
                      {company}
                    </div>
                  </div>
                );
              })}
              {/* Duplicate set for seamless loop */}
              {companies.map((company, index) => {
                const gradients = [
                  'from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-400 dark:via-blue-300 dark:to-cyan-300',
                  'from-purple-600 via-purple-500 to-pink-500 dark:from-purple-400 dark:via-purple-300 dark:to-pink-300',
                  'from-green-600 via-green-500 to-emerald-500 dark:from-green-400 dark:via-green-300 dark:to-emerald-300',
                  'from-orange-600 via-orange-500 to-red-500 dark:from-orange-400 dark:via-orange-300 dark:to-red-300',
                  'from-indigo-600 via-indigo-500 to-purple-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-purple-300',
                  'from-pink-600 via-pink-500 to-rose-500 dark:from-pink-400 dark:via-pink-300 dark:to-rose-300'
                ];
                return (
                  <div
                    key={`second-${index}`}
                    className="flex-shrink-0 flex items-center gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${gradients[index % gradients.length]} font-extrabold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl whitespace-nowrap tracking-tight`}>
                      {company}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 md:mt-12 lg:mt-16 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-12 border border-blue-200/50 dark:border-blue-500/20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-1 md:mb-2">
                10K+
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">Active Developers</div>
            </div>
            
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-1 md:mb-2">
                50K+
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">APIs Created</div>
            </div>
            
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-1 md:mb-2">
                99.9%
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">Uptime</div>
            </div>
            
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent mb-1 md:mb-2">
                24/7
              </div>
              <div className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium">Support</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 