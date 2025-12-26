'use client'

import { motion } from 'framer-motion'
import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Showcase from '../components/Showcase'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'
import Header2 from '../components/Header2'

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero section - Full width */}
      <Hero />
      
      {/* Center content and add responsive padding/spacing */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 md:space-y-12 lg:space-y-16">
          <Features />
          <HowItWorks />
          <Showcase />
          <Pricing />
          <Testimonials />
        </div>
      </div>

      <Footer />
    </main>
  )
} 