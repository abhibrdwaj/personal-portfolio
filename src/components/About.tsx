import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, TrendingUp, Code2 } from 'lucide-react';
import profileImage from '@/assets/profile.jpeg';

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const highlights = [
    { icon: Code2, text: '4 Years Engineering', color: 'text-accent-blue' },
    { icon: TrendingUp, text: 'Grew Product $1M→$7M MRR', color: 'text-accent-purple' },
    { icon: GraduationCap, text: "MS Computer Science '25", color: 'text-accent-blue' },
  ];

  return (
    <section id="about" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 gap-12 items-center mb-16"
        >
          {/* Text Content */}
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl sm:text-5xl font-bold mb-6"
            >
              About <span className="text-gradient">Me</span>
            </motion.h2>
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-4 text-gray-300 leading-relaxed"
            >
              <p>
                I'm a full-stack engineer with close to 4 years of experience at Freshworks, 
                where I built scalable products that grew from $1M to $7M MRR. Currently, 
                I'm completing my MS in Computer Science at Rutgers University, focusing 
                on AI/ML applications.
              </p>
              <p>
                My passion lies at the intersection of software engineering and artificial 
                intelligence. I've built healthcare AI systems using RAG, developed 
                multi-agent systems with LangChain, and created production-grade applications 
                serving millions of users.
              </p>
              <p>
                I'm transitioning into AI/ML roles where I can leverage my engineering 
                expertise to build intelligent systems that solve real-world problems.
              </p>
            </motion.div>
          </div>

          {/* Profile Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden glass p-1 group">
              <img
                src={profileImage}
                alt="Abhinav Bharadwaj Sarathy"
                className="w-full h-full object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Highlights Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass rounded-xl p-6 text-center group cursor-pointer"
              >
                <Icon className={`w-12 h-12 mx-auto mb-4 ${highlight.color} group-hover:scale-110 transition-transform`} />
                <p className="text-lg font-semibold">{highlight.text}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default About;
