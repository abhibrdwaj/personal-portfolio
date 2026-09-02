import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { experiences } from '@/data/experience';
import freshworksLogo from '@/assets/logos/freshworks.svg';
import rutgersLogo from '@/assets/logos/rutgers-r.svg';
import stealthStartupLogo from '@/assets/logos/stealth-startup.png';

const Experience = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const companyLogoMap: Record<string, string> = {
    'Freshworks': freshworksLogo,
    'Rutgers University': rutgersLogo,
    'Kidture Health': stealthStartupLogo
  };

  return (
    <section id="experience" ref={ref} className="section-shell py-24 px-4 sm:px-6 lg:px-8 bg-background-light/50">
      <div className="max-w-6xl mx-auto">
        <p className="mb-4 text-center font-console text-xs uppercase tracking-[0.25em] text-accent-purple">
          Career / Deployment Log
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center text-4xl font-bold sm:text-5xl"
        >
          Experience <span className="text-gradient">Timeline</span>
        </motion.h2>

        <div className="relative">
          {/* Timeline Line */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute bottom-0 left-1/2 top-0 hidden w-0.5 -translate-x-1/2 transform bg-gradient-to-b from-accent-blue via-accent-purple to-accent-blue md:block"
          />

          {/* Experience Cards */}
          <div className="space-y-12">
            {experiences.map((exp, index) => {
              const isLeft = index % 2 === 0;
              const isExpanded = expandedIndex === index;
              const companyLogo = companyLogoMap[exp.company];

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
                  <div className="absolute left-1/2 z-10 hidden h-4 w-4 -translate-x-1/2 transform rounded-full border-4 border-background-light bg-gradient-accent md:block" />

                  {/* Card */}
                  <div
                    className={`w-full md:w-5/12 ${
                      isLeft ? 'md:pr-8' : 'md:pl-8'
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="terminal-card cursor-pointer rounded-xl p-6"
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white p-2">
                          {companyLogo ? (
                            <img
                              src={companyLogo}
                              alt={`${exp.company} logo`}
                              className="h-full w-full object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-slate-900" />
                          )}
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
                            <span className="mt-1 text-accent-purple">▸</span>
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
                          className="mt-4 border-t border-accent-blue/20 pt-4"
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
