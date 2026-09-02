# Rollout Runbook: portfolio-api on Oracle Cloud k3s

One-time setup steps to take `api/` from merged code to a live HTTPS endpoint.
Run these yourself — they need your Oracle Cloud, DuckDNS, and GitHub
accounts, which nothing else in this repo has access to.

## 1. Provision the VM

- Oracle Cloud Console -> Compute -> Instances -> Create Instance.
- Shape: `VM.Standard.A1.Flex` (Ampere ARM), Always Free eligible. 2 OCPU / 12GB is
  plenty for this workload; you can go up to 4 OCPU / 24GB, still free.
- Image: Ubuntu 22.04 (ARM).
- Networking: attach a reserved **public IPv4** (free, static).
- In the VM's attached Security List (or Network Security Group), allow
  ingress on **22** (SSH), **80**, and **443** from `0.0.0.0/0`. Oracle has
  two layers here (the VCN Security List *and* the instance's own iptables
  via `netfilter-persistent` on the image) -- if you can SSH in but 80/443
  don't respond later, check both.

## 2. Install k3s

SSH into the VM, then:

```bash
curl -sfL https://get.k3s.io | sh -
```

**Make k3s write a kubeconfig every user/process on this VM can read, before
doing anything else with `kubectl`.** Skipping this bit us twice in two
different contexts: k3s's bundled `kubectl` defaults to reading
`/etc/rancher/k3s/k3s.yaml` directly, and that file is root-owned with mode
`0600` by default -- so both an interactive SSH session *and* CI's
non-interactive SSH exec (step 12) fail with `permission denied` until this
is fixed at the source:

```bash
sudo mkdir -p /etc/rancher/k3s
echo 'write-kubeconfig-mode: "0644"' | sudo tee -a /etc/rancher/k3s/config.yaml
sudo systemctl restart k3s
```

This makes the admin kubeconfig (cluster-admin cert+key) world-readable on
the VM -- fine on a single-tenant personal VM with only the `ubuntu` user,
but know that's the trade-off. Doing this via k3s's own config (rather than
a one-off `chmod` on the file) matters because k3s rewrites
`/etc/rancher/k3s/k3s.yaml` itself on every start, silently reverting a
manual `chmod`.

Now set up your own `kubectl` config for this SSH session:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=$HOME/.kube/config
echo 'export KUBECONFIG=$HOME/.kube/config' >> ~/.bashrc
```

Confirm access -- this should now work even with `KUBECONFIG` unset, since
the 0644 fix above means k3s's default lookup path is readable on its own
(worth checking, since that's exactly the difference between an interactive
shell, which sources `~/.bashrc`, and CI's non-interactive exec, which
doesn't):

```bash
unset KUBECONFIG
kubectl get nodes
```

## 3. Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.2/cert-manager.yaml
kubectl -n cert-manager wait --for=condition=Available deployment --all --timeout=180s
```

## 4. Set up DuckDNS

- Sign in at https://www.duckdns.org, create a subdomain (e.g.
  `abhinav-portfolio`), and point it at the VM's static public IP.
- Because the IP is static (not the usual DuckDNS dynamic-IP case), this is
  a one-time setting, not a running updater.
- Your API's hostname is now `abhinav-portfolio.duckdns.org` (substitute
  your actual chosen name everywhere below).

## 5. Clone the repo onto the VM

```bash
sudo mkdir -p /opt/portfolio && sudo chown $USER:$USER /opt/portfolio
git clone https://github.com/abhibrdwaj/personal-portfolio.git /opt/portfolio
cd /opt/portfolio
```

## 6. Fill in the real secrets and hostnames (none of this is committed)

```bash
cp deploy/k3s/postgres-secret.example.yaml deploy/k3s/postgres-secret.yaml
cp deploy/k3s/api-secret.example.yaml deploy/k3s/api-secret.yaml
```

Edit both copies: put a real Postgres password in `postgres-secret.yaml`
(and match it in `api-secret.yaml`'s `DATABASE_URL`), your real
`OPENAI_API_KEY`, your Langfuse keys (sign up free at
https://cloud.langfuse.com if you haven't), and set `CORPUS_VERSION` to the
current `git rev-parse --short HEAD`.

The Ubuntu Minimal aarch64 image has no `nano`/`vim` installed -- use `sed`
instead of an interactive editor:

```bash
PGPASS=$(openssl rand -base64 24)
sed -i "s/REPLACE_ME/$PGPASS/" deploy/k3s/postgres-secret.yaml
sed -i "s|REPLACE_ME_SAME_AS_POSTGRES_PASSWORD|$PGPASS|" deploy/k3s/api-secret.yaml
sed -i "s/REPLACE_ME_GIT_SHA/$(git rev-parse --short HEAD)/" deploy/k3s/api-secret.yaml
sed -i "s|OPENAI_API_KEY: REPLACE_ME|OPENAI_API_KEY: <your-real-key>|" deploy/k3s/api-secret.yaml
# optional, only if you have Langfuse keys ready:
sed -i "s|LANGFUSE_PUBLIC_KEY: REPLACE_ME|LANGFUSE_PUBLIC_KEY: <your-value>|" deploy/k3s/api-secret.yaml
sed -i "s|LANGFUSE_SECRET_KEY: REPLACE_ME|LANGFUSE_SECRET_KEY: <your-value>|" deploy/k3s/api-secret.yaml
```

`cat` both files afterward to eyeball them before applying -- but don't paste
the actual password/API key values back into a chat session if you're
working through this interactively with an assistant; regenerate them if
you accidentally do, it costs nothing to redo.

Edit `deploy/k3s/cluster-issuer.yaml`: replace `REPLACE_ME_EMAIL` with your
real email.

Edit `deploy/k3s/ingress.yaml`: replace both `REPLACE_ME.duckdns.org` with
your real DuckDNS hostname from step 4.

## 7. Apply the namespace, Postgres, and schema

```bash
kubectl apply -f deploy/k3s/namespace.yaml
kubectl apply -f deploy/k3s/postgres-secret.yaml
kubectl apply -f deploy/k3s/postgres.yaml
kubectl -n portfolio wait --for=condition=Ready pod -l app=postgres --timeout=180s

kubectl -n portfolio cp api/db/schema.sql postgres-0:/tmp/schema.sql
kubectl -n portfolio exec postgres-0 -- psql -U portfolio -d portfolio -f /tmp/schema.sql
```

## 8. Build and push the first image

Easiest: push this branch's commits to `main` once (after Task 10's CI
workflow is merged) -- CI builds and pushes
`ghcr.io/abhibrdwaj/portfolio-api:<sha>` automatically. Note the short SHA
it used; you'll need it below.

## 9. Apply cert-manager's issuer, the API, and the Ingress

```bash
kubectl apply -f deploy/k3s/cluster-issuer.yaml
kubectl apply -f deploy/k3s/api-secret.yaml

sed "s|ghcr.io/abhibrdwaj/portfolio-api:latest|ghcr.io/abhibrdwaj/portfolio-api:<sha-from-step-8>|" \
  deploy/k3s/api.yaml | kubectl apply -f -

kubectl apply -f deploy/k3s/ingress.yaml
kubectl -n portfolio rollout status deployment/portfolio-api --timeout=120s
```

## 10. Seed Postgres with the corpus

```bash
sed -e "s|REPLACE_ME_GIT_SHA|<sha-from-step-8>|" \
    -e "s|ghcr.io/abhibrdwaj/portfolio-api:latest|ghcr.io/abhibrdwaj/portfolio-api:<sha-from-step-8>|" \
    deploy/k3s/ingest-job.yaml | kubectl apply -f -
kubectl -n portfolio wait --for=condition=complete job/corpus-ingest --timeout=300s
kubectl -n portfolio logs job/corpus-ingest
```

Expect a line like `Ingested <N> chunks at corpus_version=<sha>`.

## 11. Verify

```bash
curl -sS https://abhinav-portfolio.duckdns.org/health
curl -sS https://abhinav-portfolio.duckdns.org/v1/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"role":"user","content":"What is your experience at Kidture Health?"}]}'
```

Expect `{"status":"ok"}` from the first call and a real grounded reply with
citations from the second.

## 12. Wire up CI for future deploys

In the GitHub repo's Settings -> Secrets and variables -> Actions, add:

- `ORACLE_VM_HOST` — the VM's public IP.
- `ORACLE_VM_USER` — the SSH user (e.g. `ubuntu`).
- `ORACLE_VM_SSH_KEY` — the private key matching a public key already
  authorized on the VM (`~/.ssh/authorized_keys`). No extra kubeconfig setup
  needed for this beyond step 2's `write-kubeconfig-mode: "0644"` fix --
  without it, CI's non-interactive SSH exec fails with
  `/etc/rancher/k3s/k3s.yaml: permission denied` even when your own
  interactive SSH session works fine, since the interactive fix
  (`KUBECONFIG` exported via `~/.bashrc`) only applies to shells that source
  `~/.bashrc`, and CI's non-interactive exec never does.

From here, every push to `main` that changes `api/**` builds, pushes, and
rolls out automatically, re-running the corpus ingest whenever
`api/corpus/**` changed in that push.

## 13. Point the frontend at the new API

Create `.env.production` at the repo root (this is not secret, just the
public API URL, so it's fine to commit):

```
VITE_API_BASE_URL=https://abhinav-portfolio.duckdns.org
```

Then:

```bash
npm run deploy
```

This rebuilds the frontend with the production API URL baked in and
publishes it to GitHub Pages via `gh-pages`.

## 14. Enabling voice replies (POST /v1/chat/speak) on an already-live VM

The Deployment reads all its env vars from the `portfolio-api-credentials`
Secret via `envFrom`, so adding keys to that Secret is enough -- no edit to
`api.yaml` needed. On the VM:

```bash
cd /opt/portfolio
cat >> deploy/k3s/api-secret.yaml <<'EOF'
  TTS_MODE: fish_audio
  FISH_AUDIO_API_KEY: <your-real-key>
  FISH_AUDIO_VOICE_ID: <your-real-voice-id>
EOF
kubectl apply -f deploy/k3s/api-secret.yaml
kubectl -n portfolio rollout restart deployment/portfolio-api
kubectl -n portfolio rollout status deployment/portfolio-api --timeout=120s
```

A `kubectl apply` on an existing Secret updates the object, but a running
pod's env vars are only read at container start -- hence the explicit
`rollout restart` after. Verify:

```bash
curl -sS -X POST https://abhinav-portfolio.duckdns.org/v1/chat/speak \
  -H 'content-type: application/json' -d '{"text":"Testing my cloned voice."}' \
  --output /tmp/speak-check.mp3
file /tmp/speak-check.mp3   # expect an actual audio file, not an error JSON body
```

If it 502s, `kubectl -n portfolio logs deployment/portfolio-api | grep upstream_tts_failure`
now logs the real upstream error (e.g. Fish Audio's 402 insufficient-API-credit
response) instead of just the generic 502.

## Bugs hit during the first rollout (already fixed in code -- historical reference)

The steps above already reflect these fixes; a fresh VM following this
runbook top to bottom won't need to rediscover any of them. Kept here for
context on why the code/CI look the way they do.

- **`exec /usr/local/bin/uvicorn: exec format error`** -- the API pod
  crash-looped because `docker/build-push-action` was building on the
  GitHub Actions runner's native `linux/amd64`, but the Oracle VM is
  `linux/arm64` (Ampere). Fixed by adding `docker/setup-qemu-action` +
  `docker/setup-buildx-action` and `platforms: linux/arm64` to the
  `build-and-deploy` job in `.github/workflows/api-tests.yml`.
- **`RuntimeError: No markdown corpus files under /app/corpus`** -- the
  `corpus-ingest` Job failed because `api/Dockerfile` copied `app/`,
  `scripts/`, and `pyproject.toml` but never `corpus/`. Fixed with one more
  `COPY corpus ./corpus` line.
- **`asyncpg.exceptions.DataError: invalid input for query argument $N: [...] (expected str, got list)`**
  -- both `ingest_corpus.py` and `PgVectorRetrievalBackend.retrieve()` bound
  a raw Python `list[float]` to a `$N::vector` parameter. asyncpg has no
  built-in codec for pgvector's `vector` type, so it needs the embedding
  formatted as a pgvector text literal (`"[0.1,0.2,...]"`) first. Fixed by
  adding `embedding_to_pgvector()` to `api/app/db.py` and using it in both
  places.
- **`/etc/rancher/k3s/k3s.yaml: permission denied`** -- hit twice, in two
  different contexts (an interactive SSH session, then again from CI's
  non-interactive SSH exec once the `ORACLE_VM_SSH_KEY` secret was added).
  Root cause and fix are in step 2 (`write-kubeconfig-mode: "0644"` in
  k3s's own config, not a one-off `chmod` or a `~/.bashrc` export -- the
  former gets silently reverted on every k3s restart, and the latter never
  applies to CI's non-interactive exec in the first place).
