import { Job } from 'bullmq'
import { BackgroundJobsService } from '../background_jobs.service'
import { BullMQConfigService } from './bullmq.config'

/**
 * Consumer side of a BullMQ queue. One instance runs in each worker process
 * and executes `processJob` for every job on the named queue.
 *
 * Delivery is at least once. If `processJob` throws, BullMQ retries the job
 * according to the `attempts` / `backoff` options it was added with. If the
 * worker process dies, or the job's lock is not renewed in time, the job is
 * considered stalled and is handed to another worker from the beginning.
 * The lock is renewed on a timer that runs on the worker's event loop.
 *
 * `getConcurrency()` jobs from this queue run at once per worker process
 * (default 5; the api container is configured with 2).
 */
export abstract class BaseBullMQProcessor<TJob> {
  protected constructor(
    protected readonly config: BullMQConfigService,
    protected readonly jobs: BackgroundJobsService,
  ) {}

  protected abstract queueName(): string

  protected abstract processJob(job: Job<TJob>): Promise<void>

  protected getConcurrency(): number {
    return 5
  }
}
