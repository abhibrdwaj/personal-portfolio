import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown, Award, Building2 } from 'lucide-react';
import { experiences } from '@/data/experience';
import freshworksLogo from '@/assets/logos/freshworks.svg';
import rutgersLogo from '@/assets/logos/rutgers-r.svg';
import stealthStartupLogo from '@/assets/logos/kidture-health.png';

const companyLogoMap: Record<string, string> = {
  Freshworks: freshworksLogo,
  'Rutgers University': rutgersLogo,
  'Kidture Health': stealthStartupLogo,
};

const Experience = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <section id="experience" ref={ref} className="rule mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <h2 className="mb-10 text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-3xl">Experience</h2>

      <div className="relative">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
          className="absolute bottom-0 left-[15px] top-2 hidden w-px bg-line sm:block"
        />

        <div className="space-y-3">
          {experiences.map((exp, index) => {
            const isExpanded = expandedIndex === index;
            const isCurrent = exp.duration.toLowerCase().includes('present');
            const companyLogo = companyLogoMap[exp.company];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className="relative sm:pl-10"
              >
                <span
                  className={`absolute left-[11px] top-[26px] hidden h-2.5 w-2.5 rounded-full ring-4 ring-canvas sm:block ${
                    isCurrent ? 'bg-signal-success' : 'bg-line-strong'
                  }`}
                  aria-hidden
                />

                <div className="panel overflow-hidden">
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="flex w-full items-start gap-4 p-4 text-left sm:p-5"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-white p-1.5">
                      {companyLogo ? (
                        <img
                          src={companyLogo}
                          alt=""
                          className="h-full w-full object-contain"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-canvas" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h3 className="font-medium text-ink">
                          {exp.role} <span className="text-ink-muted">· {exp.company}</span>
                        </h3>
                        <span className="whitespace-nowrap font-mono text-xs text-ink-subtle">
                          {exp.duration}
                        </span>
                      </div>
                      {exp.location && <p className="mt-0.5 text-xs text-ink-subtle">{exp.location}</p>}

                      {exp.highlights && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {exp.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-xs text-ink-muted"
                            >
                              <Award className="h-3 w-3 text-signal-attention" />
                              {highlight}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <ChevronDown
                      className={`mt-1 h-4 w-4 flex-shrink-0 text-ink-subtle transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div className="px-4 pb-4 sm:pl-[4.75rem] sm:pr-5 sm:pb-5">
                    <ul className="space-y-1.5">
                      {(isExpanded ? exp.achievements : exp.achievements.slice(0, 1)).map((achievement, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-muted">
                          <span className="mt-[3px] font-mono text-xs text-signal-success">+</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>

                    {isExpanded && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {exp.tech.map((tech) => (
                          <span
                            key={tech}
                            className="rounded border border-line-muted px-2 py-0.5 font-mono text-xs text-ink-muted"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experience;
