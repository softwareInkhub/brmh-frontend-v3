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
    <section className="py-10 md:py-16 px-3 md:px-6 bg-transparent">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold font-display mb-1 text-center">All-in-one API Development Platform</h2>
        <p className="text-xs sm:text-base md:text-lg text-gray-500 mb-4 md:mb-10 text-center">API Design Specification and Connected Features</p>
        <div className="relative w-full max-w-sm sm:max-w-xl md:max-w-3xl h-[360px] sm:h-[460px] md:h-[540px] flex items-center justify-center">
          {/* Center glow */}
          <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-blue-200/30 blur-2xl" />
          {/* SVG animated lines and central circle */}
          <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Central circle */}
            <motion.circle 
              cx="300" cy="300" r="110" stroke="#e0e7ff" strokeWidth="2" 
              initial={{ filter: 'drop-shadow(0 0 0 #38bdf8)' }}
              animate={{ filter: [
                'drop-shadow(0 0 0 #38bdf8)',
                'drop-shadow(0 0 14px #38bdf8)',
                'drop-shadow(0 0 0 #38bdf8)'
              ] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Lines to nodes - symmetrical arrangement */}
            <motion.line x1="300" y1="190" x2="140" y2="100" stroke="#bae6fd" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
            <motion.line x1="300" y1="190" x2="460" y2="100" stroke="#bae6fd" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.7 }} />
            <motion.line x1="300" y1="410" x2="140" y2="500" stroke="#ddd6fe" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.9 }} />
            <motion.line x1="300" y1="410" x2="460" y2="500" stroke="#ddd6fe" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 1.1 }} />
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
            className="absolute left-[2%] top-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-1">
              <Code2 className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-base font-semibold text-blue-600 leading-tight">Developing & Debugging</div>
              <div className="text-[9px] sm:text-xs text-gray-400">👤 Backend Developer</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }} transition={{ delay: 1.15, duration: 0.6, repeat: Infinity, repeatDelay: 3.2 }}
            whileHover={{ scale: 1.06 }}
            className="absolute right-[2%] top-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-1">
              <MonitorPlay className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-base font-semibold text-blue-600 leading-tight">Mocking & Calling</div>
              <div className="text-[9px] sm:text-xs text-gray-400">👤 Frontend Developer</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }} transition={{ delay: 1.3, duration: 0.6, repeat: Infinity, repeatDelay: 3.4 }}
            whileHover={{ scale: 1.06 }}
            className="absolute left-[2%] bottom-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mb-1">
              <BookText className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-base font-semibold text-yellow-600 leading-tight">Documentation</div>
              <div className="text-[9px] sm:text-xs text-gray-400">👤 API Designer</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }} transition={{ delay: 1.45, duration: 0.6, repeat: Infinity, repeatDelay: 3.6 }}
            whileHover={{ scale: 1.06 }}
            className="absolute right-[2%] bottom-[4%] w-32 sm:w-40 h-20 sm:h-28 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/60">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-1">
              <FlaskConical className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="text-center">
              <div className="text-xs sm:text-base font-semibold text-purple-600 leading-tight">Automated Testing</div>
              <div className="text-[9px] sm:text-xs text-gray-400">👤 QA Engineer</div>
            </div>
          </motion.div>
        </div>
        <div className="mt-6 md:mt-10 text-center text-blue-500 text-sm sm:text-base md:text-lg font-medium">When the API Spec</div>
      </div>
    </section>
  )
} 