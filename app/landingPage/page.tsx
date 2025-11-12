'use client'

import { motion } from 'framer-motion'
import LandingHeader from '../components/LandingHeader'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Showcase from '../components/Showcase'
import UseCases from '../components/UseCases'
import Integrations from '../components/Integrations'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <LandingHeader />
      
      {/* Full width content */}
      <div className="w-full px-0">
        <div className="space-y-4 md:space-y-6">
          <Hero />
          <Features />
          <HowItWorks />
          <Showcase />
          <UseCases />
          <Integrations />
          <Pricing />
          <Testimonials />
        </div>
      </div>

      <Footer />
    </main>
  )
} 