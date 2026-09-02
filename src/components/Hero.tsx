import { motion } from 'framer-motion';
import { ArrowDown, Download, MessageCircle } from 'lucide-react';

const badges = [
  { label: '4 yrs engineering' },
  { label: '$1M → $7M MRR impact' },
  { label: 'MS CS · Rutgers' },
];

const Hero = () => {
  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToChatbot = () => {
    document.getElementById('chatbot-button')?.click();
  };

  const downloadResume = () => {
    window.open('https://drive.google.com/file/d/1kzVGrt6p-Zsj0C4iOirgEgPAprXgb0dI/view?usp=sharing', '_blank');
  };

  return (
    <section id="hero" className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-4 flex items-center gap-2 font-mono text-xs text-ink-subtle"
      >
        <span className="dot bg-signal-success" aria-hidden />
        Founding Engineer @ Kidture Health — open to what's next
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-ink sm:text-5xl md:text-6xl"
      >
        Abhinav Bharadwaj Sarathy
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl"
      >
        Full-stack &amp; AI engineer. I've redesigned billing infrastructure for{' '}
        <span className="text-ink">20,000+ enterprise customers</span> at Freshworks and, since,
        become the sole backend engineer standing up a healthcare platform from an empty repo.
        Schema, compliance, and cloud, with no one to hand it off to.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 flex flex-wrap gap-2 font-mono text-xs text-ink-muted"
      >
        {badges.map((badge) => (
          <span key={badge.label} className="rounded-md border border-line px-3 py-1.5">
            {badge.label}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10 flex flex-wrap items-center gap-3"
      >
        <button
          onClick={scrollToProjects}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-white"
        >
          View projects
        </button>
        <button
          onClick={downloadResume}
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-canvas-subtle"
        >
          <Download className="h-4 w-4" />
          Résumé
        </button>
        <button
          onClick={scrollToChatbot}
          className="flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-canvas-subtle"
        >
          <MessageCircle className="h-4 w-4" />
          Ask Abhinav
        </button>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        className="mt-16 flex items-center gap-2 text-xs text-ink-subtle transition-colors hover:text-ink-muted"
      >
        <ArrowDown className="h-3.5 w-3.5" />
        Scroll
      </motion.button>
    </section>
  );
};

export default Hero;
