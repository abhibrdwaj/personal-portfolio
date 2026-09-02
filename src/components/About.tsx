import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import profileImage from '@/assets/profile.jpeg';

const facts = [
  { label: 'Based in', value: 'New York City, NY' },
  { label: 'Education', value: "MS Computer Science, Rutgers '25" },
  { label: 'Focus', value: 'Backend, infra & applied AI' },
  { label: 'Currently', value: 'Founding Engineer, Kidture Health' },
];

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" ref={ref} className="rule mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="grid gap-12 md:grid-cols-[1fr_auto]"
      >
        <div>
          <h2 className="mb-6 text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-3xl">About</h2>
          <div className="max-w-measure space-y-4 leading-relaxed text-ink-muted">
            <p>
              I'm a full-stack engineer with close to 4 years of experience at Freshworks, where I
              built and rebuilt products that grew from $1M to $7M MRR. I finished my MS in Computer
              Science at Rutgers, focused on AI/ML.
            </p>
            <p>
              Most recently I've been the founding backend engineer at a healthcare startup.
              Schema design, compliance, infrastructure, and deploy, solo, with no dedicated
              DevOps or compliance function to lean on. I've built RAG systems, multi-agent
              pipelines, and production-grade services that real people depend on.
            </p>
            <p>
              I care about the parts of engineering that don't show up in a demo: migrations that
              don't take the site down, guardrails that hold before an LLM ever gets a turn, and
              infrastructure that's still boring six months later.
            </p>
          </div>

          <dl className="mt-8 grid max-w-measure grid-cols-2 gap-x-6 gap-y-4 font-mono text-sm sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-ink-subtle">{fact.label}</dt>
                <dd className="mt-1 text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="justify-self-center md:justify-self-end"
        >
          <div className="panel h-40 w-40 overflow-hidden p-1 sm:h-48 sm:w-48">
            <img
              src={profileImage}
              alt="Abhinav Bharadwaj Sarathy"
              className="h-full w-full rounded object-cover grayscale transition-all duration-500 hover:grayscale-0"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default About;
