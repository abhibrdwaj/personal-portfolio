import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { SkillCategory, skills } from '@/data/skills';

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

const Skills = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('all');

  const displayedSkills =
    selectedCategory === 'all'
      ? Array.from(
          new Set([
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
          ])
        )
      : skills[selectedCategory] ?? [];

  return (
    <section id="skills" ref={ref} className="rule mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <h2 className="mb-8 text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-3xl">Skills</h2>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              selectedCategory === category.id
                ? 'bg-ink text-canvas'
                : 'border border-line text-ink-muted hover:border-line-strong hover:text-ink'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <motion.div layout className="flex flex-wrap gap-2">
        {displayedSkills.map((skill, index) => (
          <motion.span
            key={skill}
            layout
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: Math.min(index * 0.015, 0.4), duration: 0.3 }}
            className="rounded-md border border-line-muted px-2.5 py-1 font-mono text-xs text-ink-muted"
          >
            {skill}
          </motion.span>
        ))}
      </motion.div>
    </section>
  );
};

export default Skills;
