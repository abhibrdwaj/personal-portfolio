import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink, Github, Award, Clock } from 'lucide-react';
import { projects } from '@/data/projects';

// GitHub's own published language colors — real signal, not decoration.
const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  Ruby: '#701516',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
};

const Projects = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="projects" ref={ref} className="rule mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <h2 className="mb-10 text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-3xl">Projects</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((project, index) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.06, duration: 0.4 }}
            className="panel flex flex-col p-5 transition-colors hover:border-line-strong"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-mono text-sm font-medium text-ink">{project.title}</h3>
              {project.achievement && (
                <span className="flex flex-shrink-0 items-center gap-1 rounded-md border border-line px-2 py-0.5 text-xs text-signal-attention">
                  <Award className="h-3 w-3" />
                  Winner
                </span>
              )}
              {project.status && (
                <span className="flex flex-shrink-0 items-center gap-1 rounded-md border border-line px-2 py-0.5 text-xs text-ink-subtle">
                  <Clock className="h-3 w-3" />
                  {project.status}
                </span>
              )}
            </div>

            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{project.description}</p>

            {project.achievement && (
              <p className="mt-3 text-xs text-ink-subtle">{project.achievement}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded border border-line-muted px-2 py-0.5 font-mono text-xs text-ink-muted"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line-muted pt-3">
              <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <span
                  className="dot"
                  style={{ backgroundColor: LANGUAGE_COLORS[project.language] ?? '#8b949e' }}
                  aria-hidden
                />
                {project.language}
              </span>

              <div className="flex items-center gap-4">
                {project.demo && (
                  <a
                    href={project.demo}
                    className="flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Demo
                  </a>
                )}
                <a
                  href={project.github}
                  className="flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
                >
                  <Github className="h-3.5 w-3.5" />
                  Code
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
