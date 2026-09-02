# Master Corpus — Resume Bullet Bank

Single source of truth for every resume bullet across Projects, Kidture
Health, and Freshworks. A specific resume for a specific application is a
**query** against this file, not a document maintained on its own — when
work ships or a plan's status changes, update the entry here; never hand-edit
a standalone resume file and let it drift out of sync with this corpus.

---

## How to tailor a resume from this corpus

1. **Extract the JD's top 5-6 signals** — the skills/tools/outcomes it
   states or repeats.
2. **Score every entry** against those signals using its `Tags` and
   `Tools` — highest overlap wins. Use `Role fit` as a relevance hint, not
   a hard bucket: a JD that's 70% backend / 30% AI/infra should pull
   top-scoring `Backend` entries plus the 1-2 highest `AI/ML Infra` ones,
   not force a pre-built template.
3. **Pick 5-6 entries per role section**, not more. Constraint: no more
   than 2 entries from the same `Tags` category in one role's bullet list
   — breadth reads better than three "testing rigor" bullets in a row.
   Lead with whichever entry scores highest against the JD's #1 stated
   requirement.
4. **`roadmap` entries are opt-in**, not default. Include them only when
   the JD explicitly wants eval/observability/LLM-pipeline/infra-migration
   experience — and never let roadmap entries outnumber shipped ones in a
   given role's list. Never rewrite a `roadmap` entry into shipped-style
   language ("built," "deployed," "shipped") without a real corresponding
   merge — check the entry's status before reusing it in a new session.
5. **Use `Short` instead of cutting whole entries** when space-constrained
   (2-page limit, a role that wants tighter bullets).
6. **Freshworks and Projects entries are self-reported** (flagged per
   entry below) — Kidture entries are checked against the actual repo.
   Weight your confidence accordingly if a technical interviewer starts
   probing a specific number.
7. When new work ships, add a new entry in the same shape below instead of
   editing a resume file directly — keep the corpus current, not the
   resume.

### Entry schema

Each entry has: an `id` (stable slug, don't rename once referenced
elsewhere), a **status** (`shipped` or `roadmap`, plus a `(self-reported)`
flag where verification wasn't possible), **Tags** (category, for the
"no more than 2 per category" rule), **Tools** (for keyword/ATS matching),
**Role fit** (0-5 relevance score across three lenses: Backend/Platform,
AI/ML Infra, Founding/Generalist Ownership — not a bucket, a weight),
an optional **Metric**, and two bullet variants: **Full** (the complete
Action–Benefit–Context bullet) and **Short** (~15-20 word compressed
version).

---

## Verification & grounding notes

- **Kidture Health entries:** checked against the actual `kido-backend`
  repo (models, services, `IMPLEMENTATION_STATUS.md`, `requirements.txt`,
  `render.yaml`, CI config) plus
  `docs/superpowers/plans/2026-08-25-aws-london-infrastructure.md`, as of
  **2026-09-02**. That AWS plan's checkbox state at the time: Tasks 2-7
  done (VPC, NAT, endpoints, security groups, RDS, ElastiCache); Task 1
  and Tasks 8-15 not started (Secrets Manager, containerizing the app,
  ECS/ALB, EventBridge crons, data migration, cutover). It's under active
  execution — re-check its checkbox state before reusing `roadmap`-tagged
  AWS entries after any gap.
- **Freshworks + Projects entries:** self-reported. No access to
  Freshworks' codebase or the personal-project repos, so none of this was
  ground-truth-checked the way Kidture was. Metrics were reviewed
  bullet-by-bullet with the user on 2026-09-02 and confirmed as stated.
  `fw-enterprise-billing-platform` carries a flag on its sales-cycle claim
  (weakest causal link in the corpus — have an attribution answer ready).
  `proj-thread-memory-management`'s "100%" is deliberately scoped to
  "across the test suite" rather than left as an unscoped absolute claim.
- **General:** re-verify anything in this corpus against source before
  reuse after a large gap (a quarter+) — roadmap items may have shipped,
  new units may exist, AWS task checkboxes will have moved.
- **Not in this corpus:** Education (GPA/coursework are self-reported
  facts, not engineering claims — nothing to ground-truth or reformat).

---

# PROJECTS

### `proj-ai-inference-guardrail` — shipped (self-reported)
**Tags:** ai-safety, systems-performance | **Tools:** Rust, Tokio, Kubernetes
**Role fit:** Backend/Platform 3 · AI/ML Infra 5 · Founding/Generalist 2
**Metric:** sub-millisecond median latency under 200 req/sec load

- **Full:** Engineered a low-latency validation layer in Rust to intercept and sanitize LLM prompts, preventing PII leakage and prompt-injection attacks through regex-based policy enforcement; achieved sub-millisecond median latency under a 200 req/sec load using Tokio for async I/O and zero-copy JSON parsing, containerized as a Kubernetes sidecar proxy.
- **Short:** Built a Rust/Tokio LLM prompt-sanitization sidecar (PII/prompt-injection guardrails) at sub-millisecond median latency under 200 req/sec, containerized for Kubernetes.

### `proj-thread-memory-management` — shipped (self-reported)
**Tags:** systems-programming | **Tools:** C, Valgrind, Bash
**Role fit:** Backend/Platform 3 · AI/ML Infra 0 · Founding/Generalist 1
**Metric:** 100% memory-leak detection across the test suite

- **Full:** Engineered a custom memory allocator (First Fit policy, doubly-linked free-list) and a thread library with MLFQ and Round Robin scheduling; validated library integrity via Bash-automated unit tests achieving 100% memory-leak detection across the test suite and preventing deadlocks/segmentation faults via Valgrind audits.
- **Short:** Built a custom memory allocator and MLFQ/Round-Robin thread scheduler in C, validated via Bash-automated tests (100% leak detection across the suite) and Valgrind audits.

### `proj-coco-ai` — shipped (self-reported)
**Tags:** ai-pipeline, mobile | **Tools:** React Native, AWS Bedrock, AWS Glue, Kendra, S3, SSE
**Role fit:** Backend/Platform 1 · AI/ML Infra 4 · Founding/Generalist 3
**Metric:** Winner, Rutgers Health Hackathon

- **Full:** Developed a React Native mobile health assistant using AWS Bedrock, implementing a human-in-the-loop ticketing system to escalate low-confidence responses and mitigate hallucinations; architected a RAG pipeline on AWS (Glue, Kendra, S3) with Server-Sent Events for real-time streaming notifications — winner, Rutgers Health Hackathon.
- **Short:** Built a React Native AI health assistant (AWS Bedrock) with human-in-the-loop escalation for low-confidence responses and a Glue/Kendra/S3 RAG pipeline — Rutgers Health Hackathon winner.

---

# WORK EXPERIENCE

## Kidture Health Inc. — Founding Engineer
**New York, NY · Jan 2026–Present**
**Stack:** Python · FastAPI · SQLAlchemy 2.0 · Alembic (39 migrations) · PostgreSQL + pgvector · Redis · Docker · Render · AWS (`eu-west-2`) · Anthropic Claude API (Haiku 4.5) · UMLS REST API · SNOMED CT · WeasyPrint · Resend · structlog · GitHub Actions CI · pytest

### Shipped

#### `erasure-gdpr`
**Tags:** data-systems, compliance, migrations | **Tools:** PostgreSQL, SQLAlchemy, Alembic, pytest
**Role fit:** Backend/Platform 5 · AI/ML Infra 1 · Founding/Generalist 4
**Metric:** 33 new tests, zero regressions vs. a 1,019-test baseline; full Postgres upgrade→downgrade→upgrade round-trip verified

- **Full:** Built an explicit deletion registry over SQLAlchemy's `Base.metadata.sorted_tables`, executed in one transaction — not DB-cascade, since this deployment enforces no foreign keys — plus a coverage-guard test that fails CI if any table is left unregistered. Shipped as a dual-write Alembic migration with zero HTTP response-shape changes; verified via a full Postgres upgrade→downgrade→upgrade round-trip and a 33-test pytest suite with zero regressions against a 1,019-test baseline.
- **Short:** Built a GDPR-aligned account-erasure system (explicit deletion registry, not DB-cascade) shipped via a zero-downtime Alembic migration, verified with 33 tests and zero regressions.

#### `two-lane-jobs`
**Tags:** distributed-systems, infra | **Tools:** Redis, Docker, Render, pytest
**Role fit:** Backend/Platform 5 · AI/ML Infra 2 · Founding/Generalist 4
**Metric:** 656-test suite; closed 14 pre-existing failures, zero new regressions

- **Full:** Designed a per-moment Redis-queued worker lane plus an hourly cron lane, deployed as separate Dockerized Render services with atomic-deploy semantics enforced at the infra level — worker and cron ship together or ingestion halts entirely. Verified with a 656-test pytest regression suite, closing 14 pre-existing failures with zero new ones.
- **Short:** Designed a two-lane Redis worker + cron job architecture with atomic-deploy semantics, closing 14 pre-existing test failures with zero regressions.

#### `subject-generalized-model`
**Tags:** data-systems, migrations | **Tools:** PostgreSQL, SQLAlchemy, Alembic
**Role fit:** Backend/Platform 4 · AI/ML Infra 1 · Founding/Generalist 3
**Metric:** validated against a real-data Postgres round-trip

- **Full:** Refactored per-child rollup tables into a `(subject_type, subject_id)` schema via a backward-compatible Alembic migration, adding 1:N device-metric fan-out at ingest — validated against a real-data Postgres round-trip, not just SQLite tests.
- **Short:** Refactored core rollup tables to a generalized subject schema via backward-compatible migration, supporting a second product surface without a rewrite.

#### `notification-dispatch`
**Tags:** distributed-systems | **Tools:** FastAPI
**Role fit:** Backend/Platform 3 · AI/ML Infra 0 · Founding/Generalist 2

- **Full:** Replaced client-trusted reminder logic with an hourly FastAPI cron endpoint sweeping a schedule-events table, eliminating timezone- and client-state-dependent delivery bugs.
- **Short:** Replaced client-trusted reminder logic with a server-authoritative hourly sweep, eliminating timezone-dependent delivery bugs.

#### `engineering-discipline`
**Tags:** testing-rigor, observability | **Tools:** structlog, Alembic, pytest, GitHub Actions
**Role fit:** Backend/Platform 4 · AI/ML Infra 2 · Founding/Generalist 3
**Metric:** 39 Alembic migrations, each round-trip verified; regression suites diffed test-by-test in CI

- **Full:** structlog-based structured logging across every service; every one of 39 Alembic migrations verified via full Postgres round-trip; every regression suite diffed test-name-by-test-name (not just pass/fail counts) against a recorded baseline in GitHub Actions CI — zero silent regressions across the codebase's history.
- **Short:** Structured logging (structlog) plus a discipline of full-round-trip migration verification and test-by-test regression diffing in CI, catching zero silent regressions across 39 migrations.

#### `aws-network-architecture`
**Tags:** infra, networking, compliance | **Tools:** AWS VPC, EC2, IAM, Security Groups, VPC Endpoints
**Role fit:** Backend/Platform 5 · AI/ML Infra 2 · Founding/Generalist 4
**Metric:** 2-AZ VPC (4 subnets), 6 VPC endpoints, 5 security groups, zero public IPs on app/worker compute

- **Full:** Designed and provisioned a 2-AZ VPC (4 subnets: 2 public/2 private) in AWS `eu-west-2` for a pediatric health workload, with app and worker compute never assigned a public IP. Built a self-managed NAT instance (a deliberate cost trade-off against a managed NAT Gateway) for third-party egress, and routed all AWS-service traffic (Bedrock, ECR, CloudWatch Logs, Secrets Manager, S3) through 6 VPC Gateway/Interface Endpoints instead of the NAT path. Diagnosed and fixed two live infrastructure bugs invisible from the console: a VPC endpoint DNS-resolution failure traced to `enableDnsHostnames` defaulting off on a manually-created VPC, and a NAT masquerade rule silently matching zero traffic because Amazon Linux 2023 on Nitro-based instances doesn't default its primary network interface to `eth0`.
- **Short:** Designed and provisioned a 2-AZ AWS VPC with a self-managed NAT instance and 6 VPC endpoints for AWS-service traffic, debugging two live infra issues (DNS hostname config, network-interface naming) invisible until tested live.

#### `aws-managed-data-layer`
**Tags:** infra, data-systems, cost-optimization | **Tools:** RDS for PostgreSQL, pgvector, ElastiCache Serverless (Valkey)
**Role fit:** Backend/Platform 4 · AI/ML Infra 2 · Founding/Generalist 3
**Metric:** ~15x cost reduction on the cache tier ($6/mo Valkey vs. $91/mo Redis OSS Serverless floor) from engine choice alone

- **Full:** Provisioned RDS PostgreSQL (with `pgvector` enabled via an already-gated Alembic migration) and ElastiCache Serverless in AWS `eu-west-2`, both in private subnets with security-group-scoped access from app/worker compute only. Chose the Valkey engine over Redis OSS specifically for cost — Redis OSS Serverless's 1GB storage floor prices around $91/month before any real traffic, versus Valkey's 100MB floor at roughly $6/month — a deliberate right-sizing decision for a small beta rather than defaulting to the first console option.
- **Short:** Provisioned RDS Postgres (pgvector-enabled) and ElastiCache Serverless, choosing the Valkey engine over Redis OSS for a roughly 15x lower cost floor at beta scale.

#### `aws-dpia-infra`
**Tags:** compliance, infra | **Tools:** AWS
**Role fit:** Backend/Platform 3 · AI/ML Infra 1 · Founding/Generalist 4
**Metric:** 12-gap compliance register against a signed DPIA

- **Full:** Ran a 12-gap compliance register against a signed Data Protection Impact Assessment, translating it into a scoped, sequenced AWS UK infrastructure migration plan targeting a right-sized run cost (~$50-65/month) rather than defaulting to production-scale sizing.
- **Short:** Ran a DPIA gap-analysis and translated it into a scoped, cost-bounded AWS UK infrastructure migration plan.
- *Umbrella/compliance-framing entry — pair with `aws-network-architecture` / `aws-managed-data-layer` for technical depth, but don't use all three at once unless the JD wants heavy compliance emphasis.*

#### `safety-guardrail`
**Tags:** ai-safety, architecture | **Tools:** Python
**Role fit:** Backend/Platform 2 · AI/ML Infra 5 · Founding/Generalist 3

- **Full:** Designed a deny-list-based Safety Redirect Layer, enforced entirely in application code ahead of any model call, that escalates potentially acute symptoms without the escalation decision ever being LLM-generated — a hard architectural boundary, not a prompt instruction, verified by a dedicated test suite asserting the LLM is never invoked on the escalation path.
- **Short:** Designed a deny-list-based safety guardrail that escalates acute symptoms before any LLM is invoked — a hard code boundary, not a prompt instruction.

#### `clinical-term-extraction`
**Tags:** ai-pipeline, clinical-nlp | **Tools:** Anthropic Claude Haiku 4.5, UMLS REST API, SNOMED CT
**Role fit:** Backend/Platform 2 · AI/ML Infra 5 · Founding/Generalist 3
**Metric:** raised code-assignment accuracy from failing to 75% post-fix; 2 live-only bugs found and fixed

- **Full:** Built a hybrid resolver — a zero-LLM curated catalog for common symptoms, batched into a single Claude Haiku 4.5 call per request for free-text extraction (model proposes concepts only, never assigns codes), resolved against the NLM UMLS API through an exact→normalized→fuzzy match ladder with two-tier caching. Found and fixed two production-only integration bugs invisible to mocked pytest runs by running a golden-dataset eval against the live API; raised code-assignment accuracy from failing to 75% post-fix.
- **Short:** Built a hybrid SNOMED/UMLS clinical-term resolver (curated catalog + batched Claude Haiku extraction), catching 2 live-only bugs invisible to mocked tests, reaching 75% code-assignment accuracy.

#### `pattern-engine-gated-llm`
**Tags:** ai-pipeline, ai-safety | **Tools:** Anthropic Claude API, PostgreSQL
**Role fit:** Backend/Platform 1 · AI/ML Infra 5 · Founding/Generalist 2

- **Full:** Built a two-tier pattern-insight engine — a rules layer (day-frequency ranking, then denominator/ratio/independence significance tests) gates whether a pattern surfaces at all; Claude is only ever called to phrase a sentence from already-validated structured fields, keeping fuzzy reasoning entirely out of the detection path.
- **Short:** Built a two-tier pattern engine where statistical significance gates surface a pattern before any LLM call — the model only narrates pre-validated data, never detects.

#### `deterministic-llm-testing`
**Tags:** testing-rigor, ai-pipeline | **Tools:** pytest, Anthropic Claude API
**Role fit:** Backend/Platform 2 · AI/ML Infra 5 · Founding/Generalist 2

- **Full:** Built an environment-driven stub-mode pattern (absence of `ANTHROPIC_API_KEY` triggers a deterministic code path) applied uniformly across every Claude-backed service, giving the full pytest suite network-free, reproducible coverage of otherwise-nondeterministic AI pipelines.
- **Short:** Built a uniform stub-mode pattern across every LLM-backed service, giving the test suite deterministic, network-free coverage of nondeterministic AI pipelines.

#### `structured-capture-pipeline`
**Tags:** ai-pipeline, clinical-nlp | **Tools:** Anthropic Claude API
**Role fit:** Backend/Platform 1 · AI/ML Infra 4 · Founding/Generalist 2

- **Full:** Built an NLP extraction service converting free-text caregiver input into typed, schema-validated clinical observations with explicit confidence weighting, backed by Python-side coercion/validation on every model response.
- **Short:** Built an NLP pipeline converting free-text caregiver input into typed clinical observations with explicit confidence weighting.

#### `clinical-doc-synthesis`
**Tags:** ai-pipeline, clinical-nlp | **Tools:** WeasyPrint, PostgreSQL
**Role fit:** Backend/Platform 2 · AI/ML Infra 4 · Founding/Generalist 3

- **Full:** Built an async pipeline turning coded clinical observations into a physician-facing PDF via templated HTML assembly and WeasyPrint rendering, with a dedicated Postgres-backed report table handling expiry/purge.
- **Short:** Built an async pipeline synthesizing coded clinical data into a physician-facing PDF (WeasyPrint), with automatic expiry/purge.

#### `end-to-end-ownership`
*Framing/umbrella bullet — synthesizes several shipped units into one line; use for space-constrained resumes instead of listing each separately.*
**Tags:** founding-narrative | **Tools:** FastAPI, PostgreSQL, Alembic, Docker, AWS
**Role fit:** Backend/Platform 3 · AI/ML Infra 1 · Founding/Generalist 5
**Metric:** 39 migrations

- **Full:** Sole backend engineer for a pediatric health platform spanning schema design, 39 production migrations, API, compliance, and Dockerized deploy on Render — no dedicated DevOps/compliance/DBA function to hand off to.
- **Short:** Sole backend engineer across schema, migrations, API, compliance, and deploy for a pediatric health platform — no dedicated DevOps/compliance function.

#### `shipping-velocity`
*Framing/umbrella bullet.*
**Tags:** founding-narrative | **Tools:** Redis, Docker, WeasyPrint, pytest
**Role fit:** Backend/Platform 2 · AI/ML Infra 1 · Founding/Generalist 5
**Metric:** connected system shipped across ~1 week, verified each step

- **Full:** Shipped a connected sequence of systems — a Redis/Docker two-lane enrichment architecture, a statistical pattern-insight engine, and a WeasyPrint-based clinician report pipeline — across roughly one week of continuous delivery, each verified by a full pytest regression suite with zero silent breakage.
- **Short:** Shipped three connected systems (enrichment, pattern engine, clinician report pipeline) in roughly one week, each fully regression-tested.

#### `device-integrations`
**Tags:** integrations | **Tools:** Python (Oura API, Apple HealthKit)
**Role fit:** Backend/Platform 3 · AI/ML Infra 1 · Founding/Generalist 3
**Metric:** 28/28 targeted suite on resilience fix

- **Full:** Shipped device-integration sync (Oura, Apple HealthKit) and a production resilience fix for sync-state drift, verified by a 28-test targeted suite.
- **Short:** Shipped and hardened device-integration sync (Oura, Apple HealthKit), fixing a production sync-resilience bug (28/28 targeted tests).

### Roadmap (architected / scoped — NOT implemented; never rewrite as "built")

#### `eval-harness-deepeval`
**Tags:** ai-pipeline, testing-rigor | **Tools:** DeepEval, pytest, GitHub Actions
**Role fit:** Backend/Platform 3 · AI/ML Infra 5 · Founding/Generalist 4
**Metric:** ~140-case golden dataset; 100% gate on deterministic checks, 0.85 threshold on LLM-judge scoring

- **Full:** Architected and authored the full technical design for a DeepEval golden-dataset evaluation harness (~140 hand-authored/clinician-reviewed cases, two-tier deterministic + LLM-judge scoring, GitHub Actions-gated) for the production capture-parsing LLM call, including a documented build-vs-buy evaluation against LangSmith/Braintrust, and drove it to internal sign-off.
- **Short:** Architected a DeepEval golden-dataset eval harness (~140 cases, two-tier scoring) for a production LLM call, incl. a documented DeepEval-vs-LangSmith build-vs-buy call; approved, pre-implementation.

#### `observability-langsmith`
**Tags:** ai-pipeline, observability | **Tools:** LangSmith
**Role fit:** Backend/Platform 2 · AI/ML Infra 5 · Founding/Generalist 3

- **Full:** Led the technical scoping for production LLM observability via LangSmith — request/response tracing and cost/latency telemetry across every model call site — explicitly deferred from the eval harness over the data-residency implications of tracing live traffic.
- **Short:** Scoped a LangSmith-based production LLM observability initiative (tracing, cost/latency telemetry), deliberately separated from the eval harness over data-residency implications.

#### `tool-calling-migration`
*Lowest-priority roadmap item — most speculative; use sparingly.*
**Tags:** ai-pipeline, architecture | **Tools:** Anthropic Claude API (tool-calling)
**Role fit:** Backend/Platform 1 · AI/ML Infra 4 · Founding/Generalist 1

- **Full:** Scoped a migration of core LLM extraction surfaces (capture parsing, enrichment, pattern narration) from prompt-engineered JSON output onto native Anthropic tool-calling with enforced input schemas, replacing today's hand-written coercion layer.
- **Short:** Scoped a migration of core LLM extraction surfaces to native tool-calling with enforced schemas, replacing hand-written JSON coercion.

#### `aws-ecs-cutover-plan`
*The network/data layer this cuts over onto (`aws-network-architecture`, `aws-managed-data-layer`) is already shipped; this entry covers only the remaining compute/cutover work, not started as of 2026-09-02.*
**Tags:** infra, migration, compliance | **Tools:** Docker, ECS Fargate, ECR, ALB, EventBridge Scheduler, Secrets Manager, IAM
**Role fit:** Backend/Platform 4 · AI/ML Infra 1 · Founding/Generalist 4
**Metric:** target run cost ~$50-65/month for the full environment; planned 48-hour parallel-run verification window before cutover

- **Full:** Scoped the remaining cutover from Render onto the AWS network already provisioned: containerizing the app service for the first time (previously ran on Render's native Python runtime), deploying app and worker as ECS Fargate services behind an ALB, moving every secret out of plaintext environment config into Secrets Manager references, and scoping IAM task roles to specific Bedrock model ARNs rather than wildcard access. Planned to replace Render's cron services with EventBridge Scheduler hitting the same internal endpoints, and to cut over with zero downtime — parallel-run both stacks for a 48-hour verification window, migrate data via `pg_dump`/`pg_restore` with row-count verification, decommission Render only after a second clean window — closing two items (primary storage region, app hosting region) in a formal Data Protection Impact Assessment gap register at a target run cost of $50-65/month.
- **Short:** Scoped a zero-downtime Render→AWS ECS Fargate cutover (containerization, Secrets Manager, scoped IAM, EventBridge cron replacement, verified data migration) closing 2 DPIA gaps at a ~$50-65/mo target cost.

---

## Freshworks — Senior Software Engineer, Backend/Platform Focus
**Chennai, India · Apr 2023–Oct 2023**
**Stack (self-reported):** AWS SQS · AWS Lambda · Pinecone · Redis · Grafana · PostgreSQL

#### `fw-ai-platform-orchestration`
**Tags:** distributed-systems, ai-pipeline, infra | **Tools:** AWS SQS, AWS Lambda, Pinecone
**Role fit:** Backend/Platform 4 · AI/ML Infra 4 · Founding/Generalist 2

- **Full:** Architected a high-throughput RAG ingestion pipeline using AWS SQS, Lambda, and Pinecone to support Freddy AI, implementing vector-namespace isolation to guarantee secure multi-tenant retrieval across enterprise customers.
- **Short:** Architected a high-throughput RAG ingestion pipeline (SQS/Lambda/Pinecone) for Freddy AI with vector-namespace isolation for secure multi-tenant retrieval.

#### `fw-high-velocity-shipping`
**Tags:** delivery, leadership | **Tools:** —
**Role fit:** Backend/Platform 3 · AI/ML Infra 2 · Founding/Generalist 4
**Metric:** 30-day sprint to global launch

- **Full:** Served as primary technical lead for the ESM-to-AI integration, delivering a production-ready system during a high-pressure 30-day sprint to meet global launch deadlines.
- **Short:** Led the ESM-to-AI integration as primary technical lead, delivering production-ready code in a 30-day sprint for a global launch.

#### `fw-reliability-observability`
**Tags:** observability, reliability, data-systems | **Tools:** Redis, Grafana, PostgreSQL
**Role fit:** Backend/Platform 5 · AI/ML Infra 1 · Founding/Generalist 3
**Metric:** MTTR reduced 40%

- **Full:** Designed an operational monitoring and reporting stack using Redis and Grafana; reduced Mean Time to Resolution (MTTR) by 40% via PostgreSQL query optimization and automated incident alerting.
- **Short:** Designed a Redis/Grafana monitoring stack and cut MTTR 40% via query optimization and automated alerting.

#### `fw-enterprise-billing-platform`
⚠️ *Weakest causal claim in the corpus (sales-cycle attribution) — have an explanation ready if probed.*
**Tags:** architecture | **Tools:** —
**Role fit:** Backend/Platform 4 · AI/ML Infra 0 · Founding/Generalist 3
**Metric:** eliminated 60% of manual interventions; accelerated sales cycles 35%

- **Full:** Led the architectural overhaul of the core billing engine to support enterprise-scale ITSM suites, automating high-stakes financial state machines — eliminating 60% of manual interventions and accelerating sales cycles by 35%.
- **Short:** Led an architectural overhaul of the core billing engine, automating financial state machines to cut manual interventions 60% and speed sales cycles 35%.

---

## Freshworks — Software Engineer, Full-Stack
**Chennai, India · Oct 2020–Mar 2023**
**Stack (self-reported):** Kafka · RabbitMQ · Sidekiq · PostgreSQL · PgBouncer · AWS (ALB, SQS, Lambda) · Redis · CDN · React · TypeScript

#### `fw-stream-processing`
**Tags:** distributed-systems | **Tools:** Kafka, RabbitMQ, Sidekiq
**Role fit:** Backend/Platform 5 · AI/ML Infra 0 · Founding/Generalist 2
**Metric:** 1M+ daily tasks

- **Full:** Designed an event-driven engine using Kafka/RabbitMQ and Sidekiq, optimizing background worker pools to process 1M+ daily tasks.
- **Short:** Designed a Kafka/RabbitMQ/Sidekiq event-driven engine processing 1M+ daily background tasks.

#### `fw-database-scaling`
**Tags:** data-systems, performance | **Tools:** PostgreSQL, PgBouncer
**Role fit:** Backend/Platform 5 · AI/ML Infra 0 · Founding/Generalist 2
**Metric:** DB load −40% for 4K+ concurrent customers

- **Full:** Implemented PostgreSQL read-replicas and connection pooling (PgBouncer), reducing primary DB load by 40% for 4K+ concurrent SMB customers.
- **Short:** Implemented Postgres read-replicas + PgBouncer pooling, cutting primary DB load 40% across 4K+ concurrent customers.

#### `fw-data-migration`
**Tags:** data-systems, migrations | **Tools:** —
**Role fit:** Backend/Platform 4 · AI/ML Infra 0 · Founding/Generalist 2
**Metric:** 100% consistency across millions of records

- **Full:** Directed zero-downtime migrations using throttled batch processing and shadow-writes, maintaining 100% data consistency for millions of records.
- **Short:** Directed zero-downtime migrations (throttled batch + shadow-writes) maintaining 100% data consistency across millions of records.

#### `fw-infra-as-code`
**Tags:** infra, deployment | **Tools:** AWS ALB, SQS, Lambda, CI/CD
**Role fit:** Backend/Platform 4 · AI/ML Infra 0 · Founding/Generalist 2
**Metric:** 99.9% uptime

- **Full:** Managed AWS infrastructure (ALB, SQS, Lambda) via automated CI/CD, achieving 99.9% uptime and cutting rollback times through blue-green deployment patterns.
- **Short:** Managed AWS infra (ALB/SQS/Lambda) via automated CI/CD blue-green deploys, achieving 99.9% uptime.

#### `fw-traffic-orchestration`
**Tags:** performance, caching | **Tools:** Redis, CDN
**Role fit:** Backend/Platform 4 · AI/ML Infra 0 · Founding/Generalist 1
**Metric:** p99 latency −60% at peak

- **Full:** Engineered a multi-tier caching strategy (Redis/CDN) to mitigate "thundering herd" issues, reducing p99 API response times by 60% during peak login surges.
- **Short:** Engineered a multi-tier Redis/CDN caching strategy mitigating thundering-herd issues, cutting p99 latency 60% at peak.

#### `fw-performance-ui`
**Tags:** frontend-performance | **Tools:** React, Highcharts
**Role fit:** Backend/Platform 1 · AI/ML Infra 0 · Founding/Generalist 1
**Metric:** initial load latency −80%

- **Full:** Optimized a data-heavy time-off dashboard using viewport-based batch rendering in React Highcharts, eliminating DOM jitters and reducing initial loading latency by 80%.
- **Short:** Optimized a data-heavy dashboard with viewport-based batch rendering (React Highcharts), cutting initial load latency 80%.

#### `fw-frontend-typescript-migration`
**Tags:** frontend, migration | **Tools:** TypeScript, React (SSR)
**Role fit:** Backend/Platform 1 · AI/ML Infra 0 · Founding/Generalist 2

- **Full:** Spearheaded the incremental migration of UI components to TypeScript within a React.js (SSR) codebase, enforcing type-safe component contracts.
- **Short:** Spearheaded incremental TypeScript migration of UI components within an SSR React.js codebase.

---

## Freshworks — Software Engineer Intern
**Chennai, India · Jan 2020–Sep 2020**
**Stack (self-reported):** Dialogflow · Node.js · RSpec · Cucumber

#### `fw-hr-chatbot`
**Tags:** ai-pipeline, hackathon | **Tools:** Dialogflow, Node.js
**Role fit:** Backend/Platform 1 · AI/ML Infra 3 · Founding/Generalist 2
**Metric:** ticket volume −40%; 3rd place, Freshworks Global Hackathon 2020

- **Full:** Designed and prototyped an NLP-based HR chatbot using Dialogflow and Node.js, reducing ticket volume by 40% — secured 3rd place in the 2020 Freshworks Global Hackathon.
- **Short:** Designed an NLP HR chatbot (Dialogflow/Node.js) cutting ticket volume 40%; 3rd place, Freshworks Global Hackathon 2020.

#### `fw-quality-engineering`
**Tags:** testing-rigor | **Tools:** RSpec, Cucumber
**Role fit:** Backend/Platform 3 · AI/ML Infra 0 · Founding/Generalist 2
**Metric:** test coverage 60% → 90%

- **Full:** Established RSpec/Cucumber testing standards, increasing unit and functional test coverage from 60% to 90%.
- **Short:** Established RSpec/Cucumber testing standards, raising unit/functional test coverage from 60% to 90%.

---

## Not in this corpus

**Education** — GPA/coursework are self-reported facts, not engineering
claims; nothing to ground-truth or reformat into this schema. Carry them
on the resume as originally written.
