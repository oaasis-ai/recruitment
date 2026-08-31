import { Injectable } from '@nestjs/common'

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceled'

export interface BackgroundJob {
  id: string
  type: string
  tenantId: string
  status: JobStatus
  progress: number
  total: number
}

/**
 * One row in `background_jobs` per long-running piece of work, so the UI can
 * show progress and a planner can cancel. Every method here is a single SQL
 * statement against that table; none of them take locks.
 */
@Injectable()
export class BackgroundJobsService {
  /** Inserts a row in status `queued` with `progress = 0`. */
  async createJob(input: {
    type: string
    tenantId: string
    total: number
  }): Promise<BackgroundJob> {
    throw new Error('house implementation not included in this exercise')
  }

  /** `SELECT EXISTS` of a row of this type in status `queued` or `running`. */
  async hasActiveJobOfType(type: string): Promise<boolean> {
    throw new Error('house implementation not included in this exercise')
  }

  /** `SELECT status` for the row; true when a user has canceled it. */
  async isCanceled(id: string): Promise<boolean> {
    throw new Error('house implementation not included in this exercise')
  }

  /** `UPDATE ... SET progress = progress + delta`. */
  async incrementProgress(id: string, delta: number): Promise<void> {
    throw new Error('house implementation not included in this exercise')
  }

  /**
   * Records that the unit of work identified by `key` is done and adds
   * `value` to progress. Recording the same key again is a no-op.
   */
  async recordProgressKey(id: string, key: string, value: number): Promise<void> {
    throw new Error('house implementation not included in this exercise')
  }

  /** Sets status `completed`. */
  async markComplete(id: string): Promise<void> {
    throw new Error('house implementation not included in this exercise')
  }
}
