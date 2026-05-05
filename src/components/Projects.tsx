import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ExternalLink, Github, X } from 'lucide-react';
import { projects } from '@/data/projects';

const Projects = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  return (
    <section id="projects" ref={ref} className="section-shell py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <p className="mb-4 text-center font-console text-xs uppercase tracking-[0.25em] text-amber-300">
          Projects / Mission Archive
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-16 text-center text-4xl font-bold sm:text-5xl"
        >
          Featured <span className="text-gradient">Projects</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="terminal-card neon-ring group cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setSelectedProject(index)}
            >
              <div className="aspect-video bg-gradient-accent relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/25 to-accent-purple/25 transition-all duration-300 group-hover:from-accent-blue/35 group-hover:to-accent-purple/35" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl font-bold text-white/20 group-hover:text-white/30 transition-colors">
                    {project.title.charAt(0)}
                  </div>
                </div>
                {project.achievement && (
                  <div className="absolute right-3 top-3 rounded bg-accent-purple/90 px-2 py-1 text-xs font-semibold text-slate-900 backdrop-blur-sm">
                    🏆 Winner
                  </div>
                )}
                {project.status && (
                  <div className="absolute right-3 top-3 rounded bg-accent-blue/90 px-2 py-1 text-xs font-semibold text-slate-900 backdrop-blur-sm">
                    {project.status}
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="p-6">
                <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-gradient">
                  {project.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.slice(0, 3).map((tech, i) => (
                    <span
                      key={i}
                    className="rounded border border-accent-blue/20 bg-accent-blue/10 px-2 py-1 text-xs text-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.tech.length > 3 && (
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-500">
                      +{project.tech.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  {project.demo && (
                    <a
                      href={project.demo}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-sm text-accent-blue transition-colors hover:text-accent-purple"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Demo
                    </a>
                  )}
                  <a
                    href={project.github}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Project Modal */}
        {selectedProject !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="terminal-card neon-ring max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl"
            >
              {selectedProject !== null && (
                <>
                  <div className="glass sticky top-0 flex items-start justify-between border-b border-accent-blue/20 p-6">
                    <h3 className="text-2xl font-bold">{projects[selectedProject].title}</h3>
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <p className="text-gray-300 leading-relaxed">
                      {projects[selectedProject].description}
                    </p>
                    {projects[selectedProject].achievement && (
                      <div className="rounded-lg border border-accent-purple/30 bg-accent-purple/10 p-4">
                        <p className="text-accent-purple font-semibold">
                          🏆 {projects[selectedProject].achievement}
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold mb-3">Tech Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {projects[selectedProject].tech.map((tech, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-accent-blue/20 bg-accent-blue/10 px-3 py-1 text-gray-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      {projects[selectedProject].demo && (
                        <a
                          href={projects[selectedProject].demo}
                          className="flex items-center gap-2 rounded-lg bg-gradient-accent px-6 py-3 font-semibold text-slate-900 transition-all hover:shadow-lg hover:shadow-accent-blue/50"
                        >
                          <ExternalLink className="w-5 h-5" />
                          View Demo
                        </a>
                      )}
                      <a
                        href={projects[selectedProject].github}
                        className="glass flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all hover:border-accent-blue/40"
                      >
                        <Github className="w-5 h-5" />
                        View Code
                      </a>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Projects;
