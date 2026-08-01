import asyncio
import logging
from collections.abc import Awaitable, Callable

from apps.api.schemas.photo import PhotoGatewayRequest
from apps.api.services.photo_gateway import PhotoGatewayStore, _get_store, _run_job_worker


logger = logging.getLogger("axiom.photo_provider_job_runner")
Worker = Callable[[str, PhotoGatewayRequest], Awaitable[None]]


class PhotoProviderJobRunner:
    def __init__(self, store: PhotoGatewayStore | None = None, worker: Worker = _run_job_worker):
        self._store = store
        self._worker = worker
        self._tasks: dict[str, asyncio.Task[None]] = {}
        self._stopping = True

    async def start(self) -> None:
        self._store = self._store or _get_store()
        self._store.recover_startup_jobs()
        self._stopping = False

    def schedule(self, *, job_id: str, gateway_request: PhotoGatewayRequest) -> None:
        if self._stopping:
            if self._store:
                self._store.mark_schedule_failed(job_id)
            raise RuntimeError("Photo provider job runner is unavailable.")

        current = self._tasks.get(job_id)
        if current and not current.done():
            return

        coroutine = self._worker(job_id, gateway_request)
        try:
            task = asyncio.create_task(coroutine, name=f"photo-provider-job:{job_id}")
        except Exception as error:
            coroutine.close()
            if self._store:
                self._store.mark_schedule_failed(job_id)
            raise RuntimeError("Photo provider job could not be scheduled.") from error
        self._tasks[job_id] = task
        task.add_done_callback(lambda completed, scheduled_job_id=job_id: self._task_done(scheduled_job_id, completed))

    def _task_done(self, job_id: str, task: asyncio.Task[None]) -> None:
        if self._tasks.get(job_id) is task:
            self._tasks.pop(job_id, None)
        if task.cancelled():
            logger.info("runner_task_cancelled job_id=%s", job_id[:32])
            return
        exception = task.exception()
        if exception is not None:
            logger.error("runner_task_failed job_id=%s diagnostic=worker_exception", job_id[:32])

    async def stop(self) -> None:
        self._stopping = True
        tasks = list(self._tasks.values())
        if tasks:
            await asyncio.sleep(0)
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        self._tasks.clear()
