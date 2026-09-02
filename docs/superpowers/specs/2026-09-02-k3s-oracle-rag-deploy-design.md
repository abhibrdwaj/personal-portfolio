# Self-Hosted Production Deploy: k3s on Oracle Cloud, Postgres/pgvector

Status: approved design, pending implementation plan
Date: 2026-09-02

## Context

`api/` (the chat + JD-fit RAG backend, merged to `main` via
[PR #1](https://github.com/abhibrdwaj/personal-portfolio/pull/1)) has never been
deployed. Today it only runs locally: a single-process FastAPI app that rebuilds
an in-memory NumPy vector index from `api/corpus/**/*.md` at boot, using OpenAI
for both embeddings and chat completions. The frontend (`src/`) is already
deployed for free via GitHub Pages (`npm run deploy`, `gh-pages`), reachable at
`https://abhibrdwaj.github.io/personal-portfolio/`.

This spec covers standing up a real production deployment for the API, chosen
deliberately to double as a genuine, defensible piece of infrastructure
experience — not just "it runs somewhere."

## Goals

- Serve `/v1/chat` and `/v1/jd-fit` in production, reachable over HTTPS from the
  GitHub Pages frontend.
- Zero *fixed* recurring cost. The only acceptable recurring cost is OpenAI API
  usage, which exists regardless of hosting choice and is out of scope here.
- Run real, self-managed infrastructure — Kubernetes (k3s), Docker, a
  self-hosted Postgres/pgvector instance — as a genuine, explainable addition
  to the resume, not a managed black box.
- Give the corpus a real version history instead of "whatever was embedded at
  the last boot."

## Non-goals (explicit YAGNI cuts for v1)

- High availability / multi-node k3s, multi-replica API (see the rate-limiter
  note below for why 1 replica is a deliberate choice, not an oversight).
- A cluster-level metrics stack (Prometheus/Grafana). `kubectl logs` /
  `kubectl top` is enough to operate a single-node personal project.
- Helm charts, Kustomize overlays, or a GitOps controller (ArgoCD/Flux). Plain
  YAML manifests are simpler to read, review, and is still a legitimate
  "wrote raw Kubernetes manifests" resume line. Any of the above are
  reasonable phase-2 additions once v1 is stable, not part of this spec.
- A staging cluster. This is a personal project; the single Oracle VM is the
  only environment.

## Decisions made during brainstorming

- **Host: Oracle Cloud "Always Free" tier**, not GCP. GCP's Always Free VM is
  a 1 vCPU / 1GB RAM `e2-micro` — too small to reliably run k3s + Postgres +
  the API together without OOM risk. Oracle's Always Free ARM tier (up to 4
  vCPU / 24GB RAM, forever, no time limit) comfortably fits the whole stack at
  zero cost. GCP's $300 credit is a 90-day trial, not "staying free," and was
  ruled out on that basis.
- **Vector store: self-hosted Postgres + pgvector**, not Qdrant and not the
  status quo in-memory index. This reinforces the same stack already on the
  resume from Kidture Health (FastAPI + pgvector) rather than adding an
  unrelated vector-DB skill, and gives the corpus a real, queryable version
  history.
- **DNS: a free DuckDNS hostname**, not a purchased domain, to keep the
  "$0 fixed cost" constraint. Oracle's reserved public IP is static, so this
  is a one-time DNS record, not a dynamic-DNS updater. A real domain
  (~$10-15/yr) remains a trivial drop-in upgrade later if wanted — swapping
  the `Ingress` host and the cert-manager challenge target, nothing else
  changes.
- **Retrieval driver: `asyncpg`**, not SQLAlchemy. Matches this codebase's
  existing hand-rolled style (no ORM anywhere in `api/app/` today) rather than
  introducing one for a single query pattern.

## Architecture

### Cluster layout

One Oracle Always Free ARM VM (Ubuntu, e.g. 2 OCPU / 12GB) running `k3s` as a
single-node cluster (`k3s server`, no separate agents). k3s bundles Traefik
(ingress controller), `local-path-provisioner` (PVCs backed by the VM's own
disk — no cloud block-storage API needed), and containerd. Everything lives in
one `portfolio` namespace.

### Workloads

- **`postgres`** — a 1-replica `StatefulSet` on the official `pgvector/pgvector`
  image, with a PVC (~5-10Gi, trivial against Oracle's 200GB free block
  storage) and its password in a `Secret`. Reachable only inside the cluster
  at `postgres.portfolio.svc.cluster.local`; never exposed via `Ingress`.
- **`portfolio-api`** — a `Deployment`, **1 replica**. This is a deliberate
  constraint, not a placeholder: the existing `RateLimiter` /
  `V1RateLimitMiddleware` (`api/app/rate_limit.py`,
  `api/app/middleware/rate_limit_http.py`) holds its counters in per-process
  memory. At 2+ replicas, each pod enforces its own independent limit, so the
  effective global rate limit silently becomes `configured_limit *
  replica_count`. Acceptable and explicitly documented for a single-node
  personal project; a shared-state limiter (e.g. counters in Postgres or a
  self-hosted Redis) is the fix if replica count ever needs to grow, and is
  out of scope here.
- **`Ingress`** (Traefik) — routes the DuckDNS hostname to the `portfolio-api`
  `Service`, TLS from a cert-manager-issued `Secret`.
- **`ingest` Job** — runs corpus ingestion directly against Postgres (see Data
  flow below), tagged with `corpus_version = git SHA`, run manually for the
  initial seed and by CI afterward whenever `api/corpus/**` changes.

### Data flow change

Today, `load_vector_index()` (`api/app/corpus_loader.py`) re-embeds the entire
corpus into RAM on every process boot — fine for a single local dev process,
wasteful and slow for a pod that might restart at any time in production. This
changes:

- The app stops rebuilding anything at startup in production. `retrieve()`
  becomes a SQL query against Postgres (`ORDER BY embedding <=> $1 LIMIT $2
  WHERE kind = ANY($3)`) instead of an in-memory NumPy cosine loop.
- A `PgVectorRetrievalBackend` is added implementing the `RetrievalBackend`
  protocol (recovered from an abandoned, never-merged local commit that
  already defines this protocol plus tested `InMemoryRetrievalBackend` and
  `HttpRetrievalBackend` implementations — reused as the interface shape, not
  copied wholesale, since the HTTP variant doesn't apply here).
- Local dev and `pytest` keep using `InMemoryRetrievalBackend` — no Postgres
  dependency for running the test suite. Backend selection is one env var
  (`VECTOR_BACKEND=in_memory|pgvector`), read once at app startup in
  `app/main.py`'s `lifespan()`.
- Query-time embedding of the user's message (chat) or each extracted
  requirement (jd-fit) is unchanged — that still calls OpenAI per request, same
  as today. Only *corpus* embedding moves out of the request/boot path and into
  the separate `ingest` Job.
- New dependency: `asyncpg`, added to `api/pyproject.toml`.

### Networking, TLS, DNS

Oracle's reserved public IP on the free VM is static, so DNS is a one-time
setup: a free DuckDNS hostname (e.g. `<name>.duckdns.org`) gets an A record
pointed at that IP. `cert-manager` (installed via its official manifest) plus
a `ClusterIssuer` for Let's Encrypt (HTTP-01 challenge, satisfied through
Traefik) issues and renews the TLS certificate automatically. Only ports
80/443 are opened in the VM's security list; Postgres and the k3s API server
(`:6443`) are not reachable from outside the VM.

### CI/CD

Extends the existing `.github/workflows/api-tests.yml` (currently: run
`pytest` only). A second job, gated on the test job passing and only on pushes
to `main`:

1. Build the API Docker image, tag it with the commit SHA.
2. Push to GitHub Container Registry (`ghcr.io/abhibrdwaj/portfolio-api:<sha>`).
3. SSH into the Oracle VM (deploy key stored as a GitHub Actions secret) and
   `kubectl set image deployment/portfolio-api api=ghcr.io/.../portfolio-api:<sha>`.
4. If `api/corpus/**` changed in the pushed commits, also re-run the `ingest`
   Job with `corpus_version=<sha>`.

The same SHA is simultaneously the image tag, the `CORPUS_VERSION` value
already threaded through `Settings`/`TraceRecorder`, and the git commit — so a
trace, a deployed image, and a corpus revision are always mutually traceable.

### Security additions

- `CORS_ORIGINS` (`api/app/config.py`) gets set to
  `https://abhibrdwaj.github.io` in the production `Secret`/env — today it
  defaults to a localhost dev URL; this is the first time it needs a real
  value.
- Everything else already in `api/app/middleware/` (body-size limit,
  request-ID tagging, the per-process rate limiter discussed above) carries
  over unchanged.
- Secrets (`OPENAI_API_KEY`, Postgres password, GHCR pull credential if the
  image repo is private, SSH deploy key) live in Kubernetes `Secret` objects
  created directly on the VM (`kubectl create secret ...`), never committed to
  git. Sealed-secrets/SOPS for a git-committable secrets workflow is a
  reasonable phase-2 addition, not required for v1.

### Observability

The `TraceRecorder` (`api/app/observability/trace.py`) already emits spans to
Langfuse when `LANGFUSE_PUBLIC_KEY`/`LANGFUSE_SECRET_KEY` are set — it's
written and inert today purely for lack of configured keys. Production stands
this up for real: a free Langfuse Cloud account, three env vars in the
`Secret`. No new code.

## Rollout plan (high level; the implementation plan will detail exact commands)

1. Provision the Oracle Always Free VM, install k3s.
2. Install `cert-manager`, create the `ClusterIssuer`.
3. Apply the `postgres` `StatefulSet` + `Secret` + internal `Service`.
4. Add `PgVectorRetrievalBackend`, the `asyncpg` dependency, and the
   `VECTOR_BACKEND` toggle; keep `pytest` green against the in-memory backend.
5. Build and run the `ingest` Job once manually to seed Postgres from
   `api/corpus/**`.
6. Apply the `portfolio-api` `Deployment` + `Service` + `Ingress`.
7. Point DuckDNS at the VM's IP; verify HTTPS `/health`, `/v1/chat`,
   `/v1/jd-fit`.
8. Update `VITE_API_BASE_URL` in the frontend build to the new HTTPS endpoint,
   redeploy the GitHub Pages site.
9. Wire the CI job described above for all future deploys.

## Cost summary

| Item | Cost |
|---|---|
| Oracle Always Free VM (compute) | $0, no time limit |
| Block storage (Postgres PVC) | $0, within 200GB free allowance |
| Network egress | $0, within 10TB/month free allowance |
| Public IPv4 | $0, reserved address included free |
| TLS (Let's Encrypt via cert-manager) | $0 |
| Container registry (GHCR) | $0 at this scale |
| CI/CD (GitHub Actions) | $0, within free-tier minutes |
| DNS (DuckDNS) | $0 |
| **OpenAI API usage** | **Usage-based, small, unrelated to hosting choice** |

Only genuinely optional cost: a purchased custom domain (~$10-15/yr) in place
of the free DuckDNS hostname — cosmetic only, not required.
