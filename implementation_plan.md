# Phase 30 — Lifespan-Owned Photo Provider Job Runner

Status: **Paused by user; implementation verified, live-provider smoke deferred**

## Dependency Context

- Installed Pillow version confirmed: `12.3.0`
- Application requirement: `Pillow>=12.2.0,<13.0.0`
- Installed httpx version confirmed: `0.28.1`
- Existing application constraint: `httpx>=0.27,<1.0`
- `pip-audit -r apps/api/requirements.txt`: no known application dependency vulnerabilities
- pytest remains in `apps/api/requirements-dev.txt`, not application requirements

## Runner Contract

`PhotoProviderJobRunner` is application-owned through FastAPI lifespan. Its API is:

```python
class PhotoProviderJobRunner:
    async def start(self) -> None: ...
    def schedule(self, *, job_id: str, gateway_request: PhotoGatewayRequest) -> None: ...
    async def stop(self) -> None: ...
```

The route obtains the runner from `http_request.app.state.photo_provider_job_runner`. It passes only the validated transient `PhotoGatewayRequest`; FastAPI/Starlette request objects are never retained.

The runner owns `_tasks: dict[str, asyncio.Task[None]]` and `_stopping: bool`. Scheduling rejects while stopping, ignores a duplicate live task, creates exactly one application-owned task, registers a done callback, and returns immediately. The callback identity-checks registry removal, handles cancellation separately, consumes completed exceptions, logs only finite redacted diagnostics, and releases task/request references.

## Route Contract

```text
validate request
→ persist queued job
→ runner.schedule(job_id=job_id, gateway_request=gateway_request)
→ return HTTP 202 with queued status
```

If scheduling fails after persistence, the still-queued row becomes failed with `job_schedule_failed`, `worker_id = NULL`, provider flags false, no provider call, and no liveRun.

## Recovery Contract

```text
queued at startup without persisted payload
→ failed / queued_payload_unavailable / worker_id cleared / provider flags false / no liveRun

processing at startup from a previous process
→ failed / worker_interrupted / non-retryable / worker_id cleared / no automatic replay
```

Recovery runs before the runner accepts scheduling.

## Shutdown Contract

`stop()` marks the runner stopping, rejects new schedules, cancels all registered tasks, awaits them with `return_exceptions=True`, clears the registry, and leaves no live task.

Worker cancellation is ownership checked with `job_id`, `status = 'processing'`, and matching `worker_id`:

```text
cancelled before provider dispatch → worker_interrupted
cancelled after dispatch occurred or may have occurred → ambiguous_provider_timeout / non-retryable
```

A worker that lost ownership performs no terminal transition.

## Preserved Invariants

- Queued-and-unowned atomic claim with rowcount exactly one
- 30-second heartbeat
- SQLite lock retries at 1s, 2s, and 4s
- Ownership-checked heartbeat and terminal updates
- Stale sweep based on `updated_at`
- `worker_interrupted` for stale processing
- No retry after ambiguous provider dispatch
- Worker-level retry authority
- Atomic asset row and completed-job transaction

## Failure Codes

```text
queued_payload_unavailable
worker_interrupted
ambiguous_provider_timeout
job_schedule_failed
```

## Verification

Runner unit and real-Uvicorn lifecycle tests are mandatory. The controlled live OpenAI smoke test remains deferred until runner-focused, backend, frontend, dependency, and security gates pass.

Local gates passed on 2026-07-17:

- Runner and real-Uvicorn lifecycle tests: 16 passed
- OpenAI adapter and lifespan cleanup regression tests: 18 passed
- Full Python API suite: 88 passed
- Repository doctor: 100/100
- npm audit: 0 vulnerabilities
- pip-audit: no known application dependency vulnerabilities
- High-confidence secret scan: no findings

The controlled live call reached OpenAI on 2026-07-17 but was rejected with the stable code `billing_hard_limit_reached`. No image or durable runtime artifact was produced. The user paused this integration on 2026-07-17; `AXIOM_ENABLE_OPENAI_IMAGE_PROVIDER` remains disabled by default. When resumed, restore project billing capacity, rerun one controlled smoke test, verify signed asset delivery and lifecycle evidence, then lock Phase 30.
