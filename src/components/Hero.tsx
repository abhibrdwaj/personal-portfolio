import { motion } from 'framer-motion';
import { ChevronDown, Download, MessageCircle, Code } from 'lucide-react';
import { useState, useEffect } from 'react';

const Hero = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'AI Engineer | Product-minded Full Stack | Systems Builder';
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  const scrollToProjects = () => {
    const projectsSection = document.getElementById('projects');
    projectsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToChatbot = () => {
    const chatbotButton = document.getElementById('chatbot-button');
    chatbotButton?.click();
  };

  const downloadResume = () => {
    // Placeholder for resume download
    window.open('https://drive.google.com/file/d/1kzVGrt6p-Zsj0C4iOirgEgPAprXgb0dI/view?usp=sharing', '_blank');
  };

  return (
    <section id="hero" className="section-shell relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <div className="scanline" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background-light to-background">
        <motion.div
          className="absolute inset-0 opacity-60"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(44, 226, 255, 0.18) 0%, transparent 48%)',
              'radial-gradient(circle at 80% 50%, rgba(175, 255, 64, 0.14) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 85%, rgba(44, 226, 255, 0.15) 0%, transparent 48%)',
              'radial-gradient(circle at 20% 50%, rgba(44, 226, 255, 0.18) 0%, transparent 48%)',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 font-console text-xs uppercase tracking-[0.35em] text-accent-blue"
        >
          // Building software that ships and scales
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6 text-5xl font-bold leading-[0.9] sm:text-6xl md:text-7xl lg:text-8xl"
        >
          <span className="block">Hi, I'm</span>
          <motion.span
            animate={{ textShadow: ['0 0 18px rgba(44,226,255,0.15)', '0 0 28px rgba(44,226,255,0.35)', '0 0 18px rgba(44,226,255,0.15)'] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-gradient"
          >
            Abhinav
          </motion.span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-6 min-h-[3rem] text-lg text-gray-300 sm:text-xl md:text-2xl"
        >
          <span>{displayText}</span>
          {isTyping && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="ml-1"
            >
              |
            </motion.span>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-12 flex flex-wrap justify-center gap-3 font-console text-xs text-gray-300"
        >
          <span className="neon-ring rounded-full border border-accent-blue/35 bg-accent-blue/15 px-3 py-1">4 yrs engineering</span>
          <span className="neon-ring rounded-full border border-accent-purple/35 bg-accent-purple/15 px-3 py-1">$1M→$7M MRR impact</span>
          <span className="neon-ring rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1">MS CS @ Rutgers</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-32 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToProjects}
            className="neon-ring flex items-center gap-2 rounded-lg bg-gradient-accent px-8 py-4 font-semibold text-slate-900 shadow-lg shadow-accent-blue/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent-blue/55"
          >
            <Code className="w-5 h-5" />
            View Projects
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadResume}
            className="glass neon-ring flex items-center gap-2 rounded-lg px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-blue/50"
          >
            <Download className="w-5 h-5" />
            Download Resume
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToChatbot}
            className="glass neon-ring flex items-center gap-2 rounded-lg px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-purple/50"
          >
            <MessageCircle className="w-5 h-5" />
            Chat with AI-Me
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => {
              const aboutSection = document.getElementById('about');
              aboutSection?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="text-xs font-console uppercase tracking-[0.2em] text-gray-400">Scroll to explore</span>
            <ChevronDown className="h-6 w-6 text-accent-blue" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
