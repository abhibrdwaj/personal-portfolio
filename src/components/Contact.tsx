import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, Heart } from 'lucide-react';

const Contact = () => {
  return (
    <footer id="contact" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8"
        >
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Let's <span className="text-gradient">Connect</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              I'm always open to discussing new opportunities, interesting projects, 
              or just having a chat about AI, software engineering, or technology in general.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-6">
            <motion.a
              href="mailto:abhinav.bharadwaj@rutgers.edu"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Mail className="w-5 h-5 text-gray-300" />
            </motion.a>
            <motion.a
              href="https://www.linkedin.com/in/abhinavsbharadwaj/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Linkedin className="w-5 h-5 text-gray-300" />
            </motion.a>
            <motion.a
              href="https://github.com/abhibrdwaj"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Github className="w-5 h-5 text-gray-300" />
            </motion.a>
          </div>

          {/* Footer Credit */}
          <div className="pt-8 border-t border-white/10">
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
