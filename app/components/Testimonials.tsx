'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: "Alex Kumar",
    role: "Lead DevOps Engineer",
    company: "E-commerce Platform",
    avatar: "AK",
    content: "The AI-powered Lambda generation saved us 2 weeks of development time. We went from concept to production deployment in under 2 hours. The automatic API Gateway integration is phenomenal!",
    rating: 5
  },
  {
    name: "Maria Santos",
    role: "Backend Architect",
    company: "FinTech Startup",
    avatar: "MS",
    content: "Managing 50+ microservice APIs was a nightmare until we found BRMH. The namespace organization with DynamoDB and ElastiCache gives us sub-10ms response times. Game-changer for our team!",
    rating: 5
  },
  {
    name: "David Chen",
    role: "Full Stack Developer",
    company: "SaaS Company",
    avatar: "DC",
    content: "The web scraping feature alone is worth it - we automated Shopify and Stripe API imports in minutes. Combined with the IAM system, we have complete control over who accesses what.",
    rating: 5
  },
  {
    name: "Priya Patel",
    role: "Solutions Architect",
    company: "Digital Agency",
    avatar: "PP",
    content: "BRMH's WHAPI notification system integrated perfectly with our workflow. We now get real-time alerts on CRUD operations, and the file management system replaced our old drive solution.",
    rating: 5
  },
  {
    name: "James Wilson",
    role: "CTO",
    company: "Tech Consultancy",
    avatar: "JW",
    content: "From Cognito auth to multi-region Lambda deployments, everything just works. The breadcrumb routing and global state management make the developer experience exceptional.",
    rating: 5
  },
  {
    name: "Sophie Martin",
    role: "API Product Manager",
    company: "Enterprise Software",
    avatar: "SM",
    content: "We migrated 200+ legacy APIs to BRMH in one weekend using the web scraping tool. The schema validation and method testing caught bugs we didn't even know existed. Absolutely brilliant!",
    rating: 5
  }
]

const companies = [
  "E-commerce Platform", "FinTech Startup", "SaaS Company", "Digital Agency", "Tech Consultancy", "Enterprise Software", "Cloud Solutions", "Data Analytics Co"
]

export default function Testimonials() {
  return (
    <section className="py-6 md:py-10 px-3 md:px-12 bg-white">
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
            Loved by Developers Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of developers who trust BRMH for their API management needs
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
            >
              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <div className="mb-6">
                <Quote className="w-8 h-8 text-primary-200 mb-2" />
                <p className="text-gray-700 leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trusted By Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-gray-600 mb-8">
            Trusted by leading companies
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {companies.map((company, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center justify-center"
              >
                <div className="text-gray-400 font-semibold text-lg hover:text-primary-600 transition-colors">
                  {company}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                25+
              </div>
              <div className="text-gray-600">Platform Integrations</div>
            </div>
            
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                &lt;10ms
              </div>
              <div className="text-gray-600">Cache Response Time</div>
            </div>
            
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                99.9%
              </div>
              <div className="text-gray-600">API Uptime SLA</div>
            </div>
            
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                95%
              </div>
              <div className="text-gray-600">Cache Hit Rate</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 