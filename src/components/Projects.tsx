import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ExternalLink, Github, X } from 'lucide-react';
import { projects } from '@/data/projects';

const Projects = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  return (
    <section id="projects" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl font-bold mb-16 text-center"
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
              className="glass rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setSelectedProject(index)}
            >
              {/* Project Image Placeholder */}
              <div className="aspect-video bg-gradient-accent relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 group-hover:from-accent-blue/30 group-hover:to-accent-purple/30 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl font-bold text-white/20 group-hover:text-white/30 transition-colors">
                    {project.title.charAt(0)}
                  </div>
                </div>
                {project.achievement && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-accent-purple/90 backdrop-blur-sm rounded text-xs font-semibold">
                    🏆 Winner
                  </div>
                )}
                {project.status && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-accent-blue/90 backdrop-blur-sm rounded text-xs font-semibold">
                    {project.status}
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-gradient transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech.slice(0, 3).map((tech, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded bg-white/5 text-gray-400"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.tech.length > 3 && (
                    <span className="px-2 py-1 text-xs rounded bg-white/5 text-gray-500">
                      +{project.tech.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  {project.demo && (
                    <a
                      href={project.demo}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-sm text-accent-blue hover:text-accent-purple transition-colors"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {selectedProject !== null && (
                <>
                  <div className="sticky top-0 glass border-b border-white/10 p-6 flex items-start justify-between">
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
                      <div className="p-4 bg-accent-purple/10 rounded-lg border border-accent-purple/20">
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
                            className="px-3 py-1 rounded-full bg-white/5 text-gray-300"
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
                          className="px-6 py-3 bg-gradient-accent rounded-lg font-semibold hover:shadow-lg hover:shadow-accent-blue/50 transition-all flex items-center gap-2"
                        >
                          <ExternalLink className="w-5 h-5" />
                          View Demo
                        </a>
                      )}
                      <a
                        href={projects[selectedProject].github}
                        className="px-6 py-3 glass rounded-lg font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
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
