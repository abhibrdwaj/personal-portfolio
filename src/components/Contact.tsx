import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, Heart } from 'lucide-react';

const Contact = () => {
  return (
    <footer id="contact" className="section-shell border-t border-accent-blue/20 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          <div>
            <p className="mb-3 font-console text-xs uppercase tracking-[0.25em] text-accent-purple">
              Contact / Open Channel
            </p>
            <h2 className="mb-4 text-3xl font-bold">
              Let's <span className="text-gradient">Connect</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              I'm always open to discussing new opportunities, interesting projects, 
              or just having a chat about AI, software engineering, or technology in general.
            </p>
          </div>

          <div className="flex justify-center gap-6">
            <motion.a
              href="mailto:abhinav.bharadwaj@rutgers.edu"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:border-accent-blue/40"
            >
              <Mail className="h-5 w-5 text-gray-300" />
            </motion.a>
            <motion.a
              href="https://www.linkedin.com/in/abhinavsbharadwaj/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:border-accent-purple/40"
            >
              <Linkedin className="h-5 w-5 text-gray-300" />
            </motion.a>
            <motion.a
              href="https://github.com/abhibrdwaj"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="glass flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:border-amber-300/40"
            >
              <Github className="h-5 w-5 text-gray-300" />
            </motion.a>
          </div>

          <div className="pt-8 border-t border-accent-blue/20">
            <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
              Built with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> using React, 
              Tailwind
            </p>
            <p className="text-gray-600 text-xs mt-2">
              © {new Date().getFullYear()} Abhinav Bharadwaj. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Contact;
