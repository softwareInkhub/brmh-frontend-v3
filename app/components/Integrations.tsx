'use client'

import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import { 
  SiShopify,
  SiInstagram,
  SiGmail,
  SiGooglecalendar,
  SiGoogledocs,
  SiGooglesheets,
  SiGooglemeet,
  SiAmazon,
  SiGithub,
  SiAmazondynamodb,
  SiRazorpay,
  SiWhatsapp,
  SiPinterest,
  SiX,
  SiGoogledrive,
  SiYoutube,
  SiGooglecloud,
  SiStripe
} from 'react-icons/si'

const integrations = [
  { name: 'Shopify', icon: SiShopify, color: '#96bf48', bgColor: 'bg-green-50' },
  { name: 'Instagram', icon: SiInstagram, color: '#E4405F', bgColor: 'bg-pink-50' },
  { name: 'Gmail', icon: SiGmail, color: '#EA4335', bgColor: 'bg-red-50' },
  { name: 'Google Calendar', icon: SiGooglecalendar, color: '#4285F4', bgColor: 'bg-blue-50' },
  { name: 'Google Docs', icon: SiGoogledocs, color: '#4285F4', bgColor: 'bg-blue-50' },
  { name: 'Google Sheets', icon: SiGooglesheets, color: '#0F9D58', bgColor: 'bg-green-50' },
  { name: 'Google Meet', icon: SiGooglemeet, color: '#00897B', bgColor: 'bg-teal-50' },
  { name: 'AWS', icon: SiAmazon, color: '#FF9900', bgColor: 'bg-orange-50' },
  { name: 'GitHub', icon: SiGithub, color: '#181717', bgColor: 'bg-gray-50' },
  { name: 'DynamoDB', icon: SiAmazondynamodb, color: '#4053D6', bgColor: 'bg-blue-50' },
  { name: 'Razorpay', icon: SiRazorpay, color: '#0C2451', bgColor: 'bg-blue-50' },
  { name: 'Stripe', icon: SiStripe, color: '#635BFF', bgColor: 'bg-purple-50' },
  { name: 'WhatsApp', icon: SiWhatsapp, color: '#25D366', bgColor: 'bg-green-50' },
  { name: 'Pinterest', icon: SiPinterest, color: '#E60023', bgColor: 'bg-red-50' },
  { name: 'Twitter/X', icon: SiX, color: '#000000', bgColor: 'bg-gray-50' },
  { name: 'Google Drive', icon: SiGoogledrive, color: '#4285F4', bgColor: 'bg-blue-50' },
  { name: 'Google Cloud', icon: SiGooglecloud, color: '#4285F4', bgColor: 'bg-blue-50' },
  { name: 'YouTube', icon: SiYoutube, color: '#FF0000', bgColor: 'bg-red-50' },
]

export default function Integrations() {
  return (
    <section className="py-6 md:py-10 px-3 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 text-sm font-medium mb-4">
            <Layers className="w-4 h-4" />
            Integrations
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 text-gray-900">
            Connect with Your Favorite Tools
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            BRMH seamlessly integrates with 25+ popular platforms and services. Build unified APIs that work across all your tools.
          </p>
        </motion.div>

        {/* Integrations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 mb-12"
        >
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className={`${integration.bgColor} rounded-2xl p-6 border-2 border-transparent hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer group`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`w-12 h-12 rounded-xl ${integration.bgColor} ring-2 ring-white shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <integration.icon className="w-6 h-6" style={{ color: integration.color }} />
                </div>
                <span className="text-sm font-semibold text-gray-800">{integration.name}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Integration CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12"
        >
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            Don't see your integration?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Use our powerful web scraping engine to automatically import API documentation from any website, or create custom integrations with our flexible namespace system.
          </p>
          <button className="btn-primary">
            Request Integration
          </button>
        </motion.div>
      </div>
    </section>
  )
}

