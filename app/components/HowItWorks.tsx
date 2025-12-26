'use client'

import { motion } from 'framer-motion'
import { Code2, BookText, FlaskConical, MonitorPlay } from 'lucide-react'

const features = [
  {
    icon: Code2,
    title: 'Developing & Debugging',
    subtitle: 'Backend Developer',
    color: 'from-blue-400 to-blue-600',
    pos: 'left-top',
  },
  {
    icon: MonitorPlay,
    title: 'Mocking & Calling',
    subtitle: 'Frontend Developer',
    color: 'from-blue-400 to-blue-600',
    pos: 'right-top',
  },
  {
    icon: BookText,
    title: 'Documentation',
    subtitle: 'API Designer',
    color: 'from-yellow-400 to-yellow-500',
    pos: 'left-bottom',
  },
  {
    icon: FlaskConical,
    title: 'Automated Testing',
    subtitle: 'QA Engineer',
    color: 'from-purple-400 to-purple-600',
    pos: 'right-bottom',
  },
]

const nodePositions = {
  'left-top': 'top-0 left-0 md:-translate-x-1/2 md:-translate-y-1/2',
  'right-top': 'top-0 right-0 md:translate-x-1/2 md:-translate-y-1/2',
  'left-bottom': 'bottom-0 left-0 md:-translate-x-1/2 md:translate-y-1/2',
  'right-bottom': 'bottom-0 right-0 md:translate-x-1/2 md:translate-y-1/2',
}

export default function HowItWorks() {
  return (
    <section className="py-8 md:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-display mb-2 text-center text-gray-900 dark:text-white px-4 leading-tight">All-in-one API Development Platform</h2>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-6 md:mb-8 lg:mb-10 text-center px-4">API Design Specification and Connected Features</p>
        
        {/* Mobile: 2x2 Grid Layout */}
        <div className="w-full max-w-md sm:hidden mb-6">
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={`mobile-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 dark:border-gray-700/60"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <div className={`text-[10px] font-semibold leading-tight mb-0.5 ${
                    feature.color.includes('blue') ? 'text-blue-600 dark:text-blue-400' :
                    feature.color.includes('yellow') ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-purple-600 dark:text-purple-400'
                  }`}>
                    {feature.title}
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-gray-400">👤 {feature.subtitle}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Center text for mobile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-4"
          >
            <span className="text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              API Design Specification
            </span>
          </motion.div>
        </div>

        {/* Desktop: Animated SVG Layout */}
        <div className="hidden sm:block relative w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl h-[280px] sm:h-[380px] md:h-[460px] lg:h-[540px] flex items-center justify-center">
          {/* Center glow */}
          <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-blue-200/30 dark:bg-blue-500/20 blur-2xl" />
          {/* SVG animated lines and central circle */}
          <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Central circle */}
            <motion.circle 
              cx="300" cy="300" r="110" stroke="#e0e7ff" className="dark:stroke-blue-400/50" strokeWidth="2" 
              initial={{ filter: 'drop-shadow(0 0 0 #38bdf8)' }}
              animate={{ filter: [
                'drop-shadow(0 0 0 #38bdf8)',
                'drop-shadow(0 0 14px #38bdf8)',
                'drop-shadow(0 0 0 #38bdf8)'
              ] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Lines to nodes - symmetrical arrangement */}
            <motion.line x1="300" y1="190" x2="140" y2="100" stroke="#bae6fd" className="dark:stroke-blue-400/60" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
            <motion.line x1="300" y1="190" x2="460" y2="100" stroke="#bae6fd" className="dark:stroke-blue-400/60" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.7 }} />
            <motion.line x1="300" y1="410" x2="140" y2="500" stroke="#ddd6fe" className="dark:stroke-purple-400/60" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.9 }} />
            <motion.line x1="300" y1="410" x2="460" y2="500" stroke="#ddd6fe" className="dark:stroke-purple-400/60" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 1.1 }} />
          </svg>
          
          {/* Central circle text - positioned under the empty circle */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 translate-y-44 sm:translate-y-48 z-10 text-center w-full max-w-[220px]"
          >
            <span className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              API Design Specification
            </span>
          </motion.div>
 
          {/* Feature nodes - symmetrical absolute positions */}
          <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }} transition={{ delay: 1.0, duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
            whileHover={{ scale: 1.06 }}
            className="absolute left-[2%] top-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60 dark:border-gray-700/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-1">
              <Code2 className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 leading-tight">Developing & Debugging</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">👤 Backend Developer</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }} transition={{ delay: 1.15, duration: 0.6, repeat: Infinity, repeatDelay: 3.2 }}
            whileHover={{ scale: 1.06 }}
            className="absolute right-[2%] top-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60 dark:border-gray-700/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-1">
              <MonitorPlay className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 leading-tight">Mocking & Calling</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">👤 Frontend Developer</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }} transition={{ delay: 1.3, duration: 0.6, repeat: Infinity, repeatDelay: 3.4 }}
            whileHover={{ scale: 1.06 }}
            className="absolute left-[2%] bottom-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60 dark:border-gray-700/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mb-1">
              <BookText className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 leading-tight">Documentation</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">👤 API Designer</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }} transition={{ delay: 1.45, duration: 0.6, repeat: Infinity, repeatDelay: 3.6 }}
            whileHover={{ scale: 1.06 }}
            className="absolute right-[2%] bottom-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60 dark:border-gray-700/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-1">
              <FlaskConical className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 leading-tight">Automated Testing</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">👤 QA Engineer</div>
            </div>
          </motion.div>
        </div>
        <div className="mt-6 md:mt-10 text-center text-blue-600 dark:text-blue-400 text-sm sm:text-base md:text-lg font-medium">When the API Spec</div>
      </div>
    </section>
  )
} 