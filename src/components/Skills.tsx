import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { SkillCategory, skills } from '@/data/skills';

const Skills = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('all');

  const categories: { id: SkillCategory; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'languages', label: 'Languages' },
    { id: 'frontend', label: 'Frontend' },
    { id: 'backend', label: 'Backend' },
    { id: 'databases', label: 'Databases' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'aiml', label: 'AI/ML' },
    { id: 'apis', label: 'APIs' },
    { id: 'devops', label: 'DevOps' },
    { id: 'testing', label: 'Testing' },
    { id: 'monitoring', label: 'Monitoring' },
  ];

  const getAllSkills = () => {
    if (selectedCategory === 'all') {
      return [
        ...skills.languages,
        ...skills.frontend,
        ...skills.backend,
        ...skills.databases,
        ...skills.cloud,
        ...skills.aiml,
        ...skills.apis,
        ...skills.devops,
        ...skills.testing,
        ...skills.monitoring,
      ];
    }
    return skills[selectedCategory] || [];
  };

  const getSkillCategory = (skill: string): SkillCategory => {
    // Check in order of specificity - more specific categories first
    if (skills.languages.includes(skill)) return 'languages';
    if (skills.frontend.includes(skill)) return 'frontend';
    if (skills.backend.includes(skill)) return 'backend';
    if (skills.databases.includes(skill)) return 'databases';
    if (skills.cloud.includes(skill)) return 'cloud';
    if (skills.aiml.includes(skill)) return 'aiml';
    if (skills.apis.includes(skill)) return 'apis';
    if (skills.devops.includes(skill)) return 'devops';
    if (skills.testing.includes(skill)) return 'testing';
    if (skills.monitoring.includes(skill)) return 'monitoring';
    return 'all';
  };

  const displayedSkills = getAllSkills();

  return (
    <section id="skills" ref={ref} className="section-shell py-24 px-4 sm:px-6 lg:px-8 bg-background-light/50">
      <div className="max-w-6xl mx-auto">
        <p className="mb-4 text-center font-console text-xs uppercase tracking-[0.25em] text-accent-blue">
          Skills / Capability Matrix
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center text-4xl font-bold sm:text-5xl"
        >
          Skills & <span className="text-gradient">Technologies</span>
        </motion.h2>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-accent text-slate-900 shadow-lg shadow-accent-blue/40'
                  : 'glass text-gray-300 hover:border-accent-blue/40'
              }`}
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Skills Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {displayedSkills.map((skill, index) => {
            const skillCategory = getSkillCategory(skill);
            const isVisible = selectedCategory === 'all' || skillCategory === selectedCategory;

            return (
              <motion.div
                key={skill}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={
                  isInView && isVisible
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.8 }
                }
                transition={{
                  delay: index * 0.03,
                  duration: 0.4,
                  layout: { duration: 0.3 },
                }}
                whileHover={{ scale: 1.1, y: -5 }}
                className={`terminal-card group flex cursor-pointer flex-col items-center justify-between rounded-xl p-4 text-center ${
                  isVisible ? 'flex' : 'hidden'
                }`}
              >
                <div className="text-sm font-semibold text-gray-300 transition-colors group-hover:text-gradient">
                  {skill}
                </div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={
                      isInView && isVisible
                        ? {
                            width: `${Math.random() * 30 + 70}%`, // 70-100% for visual variety
                          }
                        : { width: 0 }
                    }
                    transition={{ delay: index * 0.03 + 0.2, duration: 0.8 }}
                    className="h-full bg-gradient-accent rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;
