export interface Project {
  title: string;
  description: string;
  tech: string[];
  language: string;
  achievement?: string;
  status?: string;
  github: string;
  demo?: string;
}

export const projects: Project[] = [
  {
    title: "CoCo AI - Healthcare RAG System",
    description: "AI assistant for hospitalists to query medical records",
    tech: ["Claude API", "LangChain", "FAISS", "Python", "AWS"],
    language: "Python",
    achievement: "Won Rutgers Health Hackathon Fall 2025",
    github: "#",
    demo: "#"
  },
  {
    title: "Pediatric Fever Assessment",
    description: "LLM-powered medical report generation for pediatricians",
    tech: ["Claude Sonnet 4.5", "Python", "Flask", "React"],
    language: "Python",
    status: "In Development",
    github: "#"
  },
  {
    title: "Multi-Agent Job Assistant",
    description: "Resume tailoring and outreach automation using AI agents",
    tech: ["LangGraph", "Claude API", "RAG", "Gmail API"],
    language: "Python",
    status: "In Development",
    github: "#"
  },
  {
    title: "Freshteam Time-Off Management",
    description: "Scalable leave management system serving 20K+ customers",
    tech: ["Ruby on Rails", "React", "PostgreSQL", "Redis"],
    language: "Ruby",
    github: "#"
  },
  {
    title: "Billing Platform",
    description: "High-availability billing system processing $50M+ ARR",
    tech: ["Ruby on Rails", "PostgreSQL", "AWS", "Stripe API"],
    language: "Ruby",
    github: "#"
  }
];
