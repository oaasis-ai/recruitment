import { Job, JobsOptions } from 'bullmq'
import { BullMQConfigService } from './bullmq.config'

/**
 * Producer side of a BullMQ queue. Subclasses name the queue and decide the
 * job id and options for each payload.
 */
export abstract class BaseBullMQQueue<TJob> {
  protected constructor(protected readonly config: BullMQConfigService) {}

  protected abstract queueName(): string

  /**
   * Id under which BullMQ stores the job. Return `undefined` to let BullMQ
   * assign a unique sequential id.
   *
   * BullMQ ignores an `add` whose id already exists in the queue, whatever
   * state that job is in (waiting, active, delayed, completed, failed), for as
   * long as the job is retained. Retention is governed by the
   * `removeOnComplete` / `removeOnFail` options.
   */
  protected abstract jobIdFor(data: TJob): string | undefined

  /** Extra BullMQ options merged into every `add` (attempts, backoff, retention, deduplication, ...). */
  protected extraJobOptions(_data: TJob): JobsOptions {
    return {}
  }

  /** Adds one job. Resolves once Redis has accepted (or ignored) it. */
  async add(data: TJob): Promise<Job<TJob>> {
    throw new Error('house implementation not included in this exercise')
  }

  /** Adds many jobs in one round trip, chunked internally. */
  async addBulk(datas: Array<TJob>): Promise<Array<Job<TJob>>> {
    throw new Error('house implementation not included in this exercise')
  }
}
