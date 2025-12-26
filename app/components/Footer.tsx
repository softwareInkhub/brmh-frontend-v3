'use client'

import { motion } from 'framer-motion'
import { 
  Code, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  MessageCircle,
  Globe,
  Heart
} from 'lucide-react'

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "API Documentation", href: "#docs" },
    { name: "Changelog", href: "#changelog" }
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Careers", href: "#careers" },
    { name: "Press", href: "#press" }
  ],
  support: [
    { name: "Help Center", href: "#help" },
    { name: "Contact Support", href: "#contact" },
    { name: "Status", href: "#status" },
    { name: "Community", href: "#community" }
  ],
  legal: [
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
    { name: "Cookie Policy", href: "#cookies" },
    { name: "GDPR", href: "#gdpr" }
  ]
}

const socialLinks = [
  { name: "GitHub", icon: Github, href: "#github" },
  { name: "Twitter", icon: Twitter, href: "#twitter" },
  { name: "LinkedIn", icon: Linkedin, href: "#linkedin" },
  { name: "Email", icon: Mail, href: "mailto:hello@brmh.dev" }
]

export default function Footer() {
  return (
    <footer id="contact" className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-900 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8 lg:py-10">
        {/* Main Footer Content */}
        <div className="mb-5 md:mb-8">
          {/* Brand Section - Full Width on Mobile */}
          <div className="mb-6 md:mb-0 md:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold font-display">BRMH</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed max-w-md">
              Your unified API & namespace manager. Build, manage, and expose your APIs with powerful schema and method control.
            </p>
            <div className="flex space-x-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-white"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid - 2 Columns on Mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mt-6 md:mt-0">
            {/* Product Links */}
            <div>
              <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-white">Product</h3>
              <ul className="space-y-1.5">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-white">Company</h3>
              <ul className="space-y-1.5">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-white">Support</h3>
              <ul className="space-y-1.5">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-xs font-semibold mb-2 text-gray-900 dark:text-white">Legal</h3>
              <ul className="space-y-1.5">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-900 pt-4 md:pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-0">
            <div className="flex flex-col items-center md:flex-row md:justify-start gap-2 text-xs text-gray-600 dark:text-gray-400 text-center md:text-left">
              <span>&copy; 2024 BRMH. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center justify-center gap-1">
                <span className="hidden md:inline">Made with</span>
                <Heart className="w-3 h-3 text-red-500" />
                <span className="hidden md:inline">for developers</span>
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-2 sm:gap-3 md:gap-4 text-xs text-gray-600 dark:text-gray-400">
              <a href="#status" className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>All systems operational</span>
              </a>
              <a href="mailto:help@brmh.dev" className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5" />
                <span>help@brmh.dev</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 