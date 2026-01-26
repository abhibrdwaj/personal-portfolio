import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown, Building2, GraduationCap } from 'lucide-react';
import { experiences } from '@/data/experience';

const Experience = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section id="experience" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 bg-background-light/50">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl font-bold mb-16 text-center"
        >
          Experience <span className="text-gradient">Timeline</span>
        </motion.h2>

        <div className="relative">
          {/* Timeline Line */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-blue via-accent-purple to-accent-blue transform -translate-x-1/2"
          />

          {/* Experience Cards */}
          <div className="space-y-12">
            {experiences.map((exp, index) => {
              const isLeft = index % 2 === 0;
              const isExpanded = expandedIndex === index;
              const Icon = exp.company === 'Rutgers University' ? GraduationCap : Building2;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: index * 0.2, duration: 0.8 }}
                  className={`relative flex items-center ${
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-col`}
                >
                  {/* Timeline Dot */}
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-accent border-4 border-background-light z-10" />

                  {/* Card */}
                  <div
                    className={`w-full md:w-5/12 ${
                      isLeft ? 'md:pr-8' : 'md:pl-8'
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="glass rounded-xl p-6 cursor-pointer"
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{exp.role}</h3>
                          <p className="text-accent-blue font-semibold">{exp.company}</p>
                          <p className="text-sm text-gray-400 mt-1">{exp.duration}</p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {/* Key Achievements (Always visible) */}
                      <ul className="space-y-2 mb-4">
                        {exp.achievements.slice(0, 1).map((achievement, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-accent-purple mt-1">▸</span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-white/10"
                        >
                          <ul className="space-y-2 mb-4">
                            {exp.achievements.slice(1).map((achievement, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-accent-purple mt-1">▸</span>
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-2">
                            {exp.tech.map((tech, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Tech Stack Tags (Collapsed) */}
                      {!isExpanded && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {exp.tech.slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300"
                            >
                              {tech}
                            </span>
                          ))}
                          {exp.tech.length > 3 && (
                            <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-400">
                              +{exp.tech.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
