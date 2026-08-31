import { Injectable } from '@nestjs/common'
import { JobsOptions } from 'bullmq'
import { BaseBullMQQueue } from '~/common/background_jobs/bullmq/base-bullmq.queue'
import { BullMQConfigService } from '~/common/background_jobs/bullmq/bullmq.config'

export const EXCEPTION_RECALC_QUEUE_NAME = 'exception-recalc'

export interface ExceptionRecalcJobData {
  tenantId: string
  jobType: 'recalculate' | 'notify'
  locationIds?: Array<string>
  requestedBy?: string
  backgroundJobId?: string
}

@Injectable()
export class ExceptionRecalcQueue extends BaseBullMQQueue<ExceptionRecalcJobData> {
  constructor(config: BullMQConfigService) {
    super(config)
  }

  protected override queueName(): string {
    return EXCEPTION_RECALC_QUEUE_NAME
  }

  // One job per tenant at a time.
  protected override jobIdFor(data: ExceptionRecalcJobData): string {
    return `exception-recalc:${data.tenantId}`
  }

  protected override extraJobOptions(): JobsOptions {
    return {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: false,
    }
  }
}
