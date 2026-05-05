export interface Experience {
  company: string;
  role: string;
  duration: string;
  location?: string;
  achievements: string[];
  tech: string[];
  highlights?: string[]; // Optional: for awards, recognitions
}

export const experiences: Experience[] = [
  {
    company: "Stealth Startup",
    role: "Founding Engineer",
    duration: "Dec 2025 - Present",
    location: "New York City, NY",
    achievements: [
      "Built a specialized multi-agent conversational interface with LangGraph, reducing parent logging friction by an estimated 60%",
      "Designed a multi-vector RAG pipeline across isolated healthcare data domains, improving contextual retrieval accuracy by 35%",
      "Implemented secure multi-tenant cloud deployment architecture on Azure and Vercel with automated CI/CD for rapid clinical beta iterations",
      "Developed low-latency streaming AI APIs using SSE and WebSockets for token-level response delivery",
      "Engineered clinical NLP and medical entity extraction pipelines to map unstructured parent inputs to standardized terminology",
      "Built LLM-backed physical examination summary pipelines integrating chat context and Apple HealthKit telemetry",
      "Established observability and continuous LLM-as-a-Judge evaluation workflows to detect regression and control model drift"
    ],
    tech: [
      "LangGraph",
      "RAG",
      "LLMs",
      "Clinical NLP",
      "Azure",
      "Vercel",
      "CI/CD",
      "SSE",
      "WebSockets",
      "Apple HealthKit"
    ]
  },
  {
    company: "Rutgers University",
    role: "Graduate Teaching Assistant",
    duration: "Aug 2024 - Dec 2025",
    location: "New Brunswick, NJ",
    achievements: [
      "Assisted with grading assignments, holding office hours, and providing feedback to students in the CS345: Introduction to Artificial Intelligence course",
      "Helped students understand the concepts of artificial intelligence and machine learning"
    ],
    tech: [
      "Python",
      "Java",
      "C/C++",
      "SQL",
      "Machine Learning",
      "Artificial Intelligence",
      "Deep Learning",
      "Neural Networks",
      "Reinforcement Learning",
      "Natural Language Processing",
      "Computer Vision",
    ]
  },
  {
    company: "Freshworks",
    role: "Senior Software Engineer (Full-Stack)",
    duration: "Apr 2023 - Oct 2023",
    location: "Chennai, India",
    achievements: [
      "Redesigned billing system for 20K+ enterprise customers using Ruby on Rails and ReactJS with streamlined UI/integrations",
      "Improved contract conversion by 35% and cut manual processing time by 60% through billing workflow automation",
      "Built DocuSign integration using Spring Boot 3 REST APIs with OAuth 2.0 authentication",
      "Eliminated 100% manual signature processing by enabling automated workflows in IT suite",
      "Built real-time observability dashboard integrating SQL, Redis, and Grafana for production incident monitoring",
      "Reduced mean time to resolution by 40% through PostgreSQL query performance tuning",
      "Drove tech debt remediation with dependency upgrades and comprehensive RSpec testing, achieving 90%+ coverage"
    ],
    tech: [
      "Ruby on Rails",
      "React.js",
      "Spring Boot 3",
      "PostgreSQL",
      "Redis",
      "Grafana",
      "OAuth 2.0",
      "RSpec",
      "REST APIs"
    ]
  },
  {
    company: "Freshworks",
    role: "Software Engineer (Full-Stack)",
    duration: "Apr 2021 - Mar 2023",
    location: "Chennai, India",
    achievements: [
      "Deployed Time-Off management module with PostgreSQL calendar sync and email notifications",
      "Streamlined leave management for 3,500+ mid-market customers, reducing HR query volumes by 25%",
      "Deployed cloud-native components on AWS (Lambda, EC2, S3, SQS) with CI/CD pipelines enabling daily releases",
      "Achieved 99.9% uptime SLA, cut infrastructure costs by 30%, and reduced rollback time to under 10 minutes",
      "Improved Time-off dashboard load speeds by 75% (8s → 2s) using React hooks and code-splitting",
      "Increased customer satisfaction by 55% through lazy loading and optimized JavaScript bundle sizes",
      "Optimized Rails backend with ActiveRecord eager loading to eliminate N+1 queries",
      "Reduced API load times by 60% using Redis caching and Sidekiq background jobs for async processing",
      "Built RESTful API endpoints with ActiveModel Serializers handling 30% more concurrent requests",
      "Maintained sub-200ms response times with 85%+ test coverage (RSpec/Cucumber), reducing production bugs by 45%",
      "Mentored 3 junior engineers on Rails, API design, and testing, improving team code quality by 35%"
    ],
    tech: [
      "Ruby on Rails",
      "React.js",
      "PostgreSQL",
      "AWS Lambda",
      "AWS EC2",
      "AWS S3",
      "AWS SQS",
      "Redis",
      "Sidekiq",
      "RSpec",
      "Cucumber",
      "CI/CD",
      "ActiveRecord"
    ],
    highlights: [
      "Best Squad Q2 & Q3 2022",
      "Delivered all roadmap items on time for 4 consecutive quarters"
    ]
  },
  {
    company: "Freshworks",
    role: "Software Engineer Intern & Graduate Trainee",
    duration: "Jan 2020 - Mar 2021",
    location: "Chennai, India",
    achievements: [
      "Developed AI-powered HR chatbot using Dialogflow NLP and Node.js with PostgreSQL conversation history",
      "Demonstrated 40% reduction in HR support tickets with 500+ employees during pilot",
      "Migrated legacy Employee dashboard to React.js with server-side rendering and responsive HTML5/CSS3",
      "Reduced page load times by 60% (5s → 2s) during peak traffic through modern frontend architecture",
      "Established RSpec testing guidelines and automated test execution in CI/CD pipeline",
      "Increased test coverage from 60% to 90% across Ruby on Rails unit and functional tests"
    ],
    tech: [
      "Dialogflow",
      "Node.js",
      "PostgreSQL",
      "React.js",
      "HTML5",
      "CSS3",
      "RSpec",
      "Ruby on Rails",
      "CI/CD"
    ],
    highlights: [
      "3rd place in Freshworks' 2020 Hackathon"
    ]
  }
];