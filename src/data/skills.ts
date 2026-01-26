export interface SkillsData {
  languages: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  cloud: string[];
  aiml: string[];
  testing: string[];
  apis: string[];
  devops: string[];
  monitoring: string[];
}

export const skills: SkillsData = {
  // Programming Languages
  languages: [
    "Python",
    "JavaScript", 
    "TypeScript",
    "Ruby",
    "Java",
    "C/C++",
    "SQL"
  ],

  // Frontend Technologies
  frontend: [
    "React.js",
    "React Native",
    "Next.js",
    "HTML5",
    "CSS3",
    "Tailwind CSS",
    "Vite",
    "Responsive Design",
    "Server-Side Rendering",
    "Code-Splitting",
    "Lazy Loading"
  ],

  // Backend Frameworks & Tools
  backend: [
    "Ruby on Rails",
    "Flask",
    "FastAPI",
    "Node.js",
    "Spring Boot",
    "ActiveRecord",
    "ActiveModel Serializers",
    "Sidekiq",
    "Microservices"
  ],

  // Databases & Caching
  databases: [
    "PostgreSQL",
    "MongoDB",
    "MySQL",
    "Redis",
    "DynamoDB",
    "AWS Redshift",
    "Vector Databases"
  ],

  // Cloud & Infrastructure
  cloud: [
    "AWS Lambda",
    "AWS EC2",
    "AWS S3",
    "AWS SQS",
    "AWS OpenSearch",
    "AWS Bedrock",
    "AWS Kendra",
    "AWS API Gateway",
    "GCP Vertex AI",
    "GCP Cloud Run",
    "GCP Big Query",
    "Azure",
    "Vercel",
    "CloudFront"
  ],

  // AI/ML & LLMs
  aiml: [
    "Claude API (Sonnet 3.5)",
    "OpenAI API (GPT-4)",
    "DALL-E 3",
    "Gemini 2.5 Flash",
    "LangChain",
    "LangGraph",
    "CrewAI",
    "RAG Pipelines",
    "Prompt Engineering",
    "Multi-Agent Systems",
    "LLM Embeddings",
    "AWS Bedrock",
    "AWS Kendra",
    "PyTorch",
    "TensorFlow",
    "Vector Databases",
    "Clustering"
  ],

  // APIs & Integration
  apis: [
    "RESTful APIs",
    "GraphQL",
    "OAuth 2.0",
    "Webhooks",
    "API Gateway",
    "Rate Limiting",
    "Error Handling",
    "DocuSign API",
    "OpenWeatherMap API",
    "NYC Open Data API"
  ],

  // DevOps & Infrastructure
  devops: [
    "Docker",
    "Kubernetes",
    "CI/CD Pipelines",
    "Linux",
    "Git"
  ],

  // Testing & Quality Assurance
  testing: [
    "RSpec",
    "Unit Testing",
    "Integration Testing",
    "Test Coverage"
  ],

  // Monitoring & Observability
  monitoring: [
    "Grafana",
    "Performance Tuning",
    "Production Debugging"
  ]
};

export type SkillCategory = 
  | "all" 
  | "languages" 
  | "frontend" 
  | "backend" 
  | "databases"
  | "cloud" 
  | "aiml" 
  | "apis"
  | "devops"
  | "testing"
  | "monitoring";

// // Skill proficiency levels (optional - for visual indicators)
// export interface SkillProficiency {
//   name: string;
//   level: "expert" | "advanced" | "intermediate" | "familiar";
//   yearsOfExperience?: number;
// }

// // Categorized by proficiency (based on resume context)
// export const skillsByProficiency = {
//   expert: [
//     "Ruby on Rails",
//     "React.js",
//     "PostgreSQL",
//     "AWS",
//     "RESTful APIs",
//     "Redis",
//     "RSpec"
//   ],
//   advanced: [
//     "Python",
//     "Flask",
//     "FastAPI",
//     "LangChain",
//     "Claude API",
//     "Docker",
//     "MongoDB",
//     "Node.js",
//     "TypeScript",
//     "RAG Pipelines",
//     "Multi-Agent Systems"
//   ],
//   intermediate: [
//     "Spring Boot",
//     "Kubernetes",
//     "React Native",
//     "OpenAI API",
//     "Gemini API",
//     "AWS Bedrock",
//     "Prompt Engineering",
//     "PyTorch",
//     "Next.js"
//   ],
//   familiar: [
//     "GraphQL",
//     "TensorFlow",
//     "Azure",
//     "C/C++",
//     "Java"
//   ]
// };

// // Skills grouped by use case (for filtering on portfolio)
// export const skillsByUseCase = {
//   fullStack: [
//     "Ruby on Rails",
//     "React.js",
//     "PostgreSQL",
//     "Redis",
//     "AWS",
//     "Docker",
//     "CI/CD Pipelines"
//   ],
//   aiEngineering: [
//     "Claude API",
//     "LangChain",
//     "LangGraph",
//     "CrewAI",
//     "RAG Pipelines",
//     "OpenAI API",
//     "Gemini API",
//     "Vector Databases",
//     "Prompt Engineering",
//     "Multi-Agent Systems"
//   ],
//   cloudInfra: [
//     "AWS Lambda",
//     "AWS EC2",
//     "AWS S3",
//     "Docker",
//     "Kubernetes",
//     "CI/CD Pipelines",
//     "GCP",
//     "Azure"
//   ],
//   apiIntegration: [
//     "RESTful APIs",
//     "OAuth 2.0",
//     "Webhooks",
//     "GraphQL",
//     "DocuSign API",
//     "Rate Limiting",
//     "API Gateway"
//   ]
// };