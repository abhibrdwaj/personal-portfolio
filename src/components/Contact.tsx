import { Mail, Linkedin, Github, Heart } from 'lucide-react';

const links = [
  { href: 'mailto:abhinav.bharadwaj.sarathy@gmail.com', label: 'Email', icon: Mail },
  { href: 'https://www.linkedin.com/in/abhinavsbharadwaj/', label: 'LinkedIn', icon: Linkedin },
  { href: 'https://github.com/abhibrdwaj', label: 'GitHub', icon: Github },
];

const Contact = () => {
  return (
    <footer id="contact" className="rule">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-3xl">Let's connect</h2>
        <p className="mx-auto mt-3 max-w-measure text-ink-muted">
          Open to discussing new opportunities, interesting problems, or just talking shop about
          AI, infrastructure, or software engineering in general.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          {links.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <div className="rule mt-10 pt-6">
          <p className="flex items-center justify-center gap-1.5 text-sm text-ink-subtle">
            Built with <Heart className="h-3.5 w-3.5 fill-current text-signal-attention" /> using React
            &amp; Tailwind
          </p>
          <p className="mt-1.5 text-xs text-ink-subtle">
            © {new Date().getFullYear()} Abhinav Bharadwaj Sarathy
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Contact;
