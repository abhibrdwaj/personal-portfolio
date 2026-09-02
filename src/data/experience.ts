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
    company: "Kidture Health",
    role: "Founding Engineer",
    duration: "Jan 2026 - Present",
    location: "New York City, NY",
    achievements: [
      "Sole backend engineer for a pediatric health platform — schema design, 39 production migrations, API, compliance, and Dockerized deploy on Render, with no dedicated DevOps/compliance function to hand off to",
      "Built a GDPR-aligned account-erasure system (explicit deletion registry, not DB-cascade) shipped via a zero-downtime Alembic migration, verified with 33 tests and zero regressions",
      "Designed a two-lane Redis worker + cron job architecture with atomic-deploy semantics, closing 14 pre-existing test failures with zero regressions",
      "Designed and provisioned a 2-AZ AWS VPC with a self-managed NAT instance and 6 VPC endpoints, debugging two live infra issues invisible until tested live",
      "Provisioned RDS Postgres (pgvector-enabled) and ElastiCache Serverless, choosing the Valkey engine over Redis OSS for a roughly 15x lower cost floor at beta scale",
      "Designed a deny-list-based safety guardrail that escalates acute symptoms before any LLM is invoked — a hard code boundary, not a prompt instruction",
      "Built a hybrid SNOMED/UMLS clinical-term resolver (curated catalog + batched Claude Haiku extraction), reaching 75% code-assignment accuracy",
      "Shipped and hardened device-integration sync (Oura, Apple HealthKit), fixing a production sync-resilience bug (28/28 targeted tests)"
    ],
    tech: [
      "Python",
      "FastAPI",
      "SQLAlchemy",
      "Alembic",
      "PostgreSQL",
      "pgvector",
      "Redis",
      "Docker",
      "Render",
      "AWS",
      "Anthropic Claude API"
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