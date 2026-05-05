import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import Chatbot from './components/Chatbot';

function App() {
  useEffect(() => {
    // Smooth scroll behavior is handled by CSS, but we can add additional logic here if needed
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="aurora-orb h-72 w-72 -left-24 top-24 bg-accent-blue/40" />
      <div className="aurora-orb h-96 w-96 -right-28 top-[35%] bg-accent-purple/30" />
      <div className="aurora-orb h-80 w-80 left-[30%] bottom-10 bg-amber-300/20" />
      <Navbar />
      <div className="relative z-10">
        <Hero />
        <div className="soft-divider" />
        <About />
        <div className="soft-divider" />
        <Experience />
        <div className="soft-divider" />
        <Projects />
        <div className="soft-divider" />
        <Skills />
        <div className="soft-divider" />
        <Contact />
      </div>
      <Chatbot />
    </div>
  );
}

export default App;
