import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { BackgroundJobsService } from '~/common/background_jobs/background_jobs.service'
import { BaseBullMQProcessor } from '~/common/background_jobs/bullmq/base-bullmq.processor'
import { BullMQConfigService } from '~/common/background_jobs/bullmq/bullmq.config'
import { MailerService } from '~/common/mailer/mailer.service'
import {
  EXCEPTION_RECALC_QUEUE_NAME,
  ExceptionRecalcJobData,
} from './exception-recalc.queue'
import { ExceptionReportService } from './exception-report.service'

@Injectable()
export class ExceptionRecalcProcessor extends BaseBullMQProcessor<ExceptionRecalcJobData> {
  private readonly logger = new Logger(ExceptionRecalcProcessor.name)

  constructor(
    config: BullMQConfigService,
    jobs: BackgroundJobsService,
    private readonly service: ExceptionReportService,
    private readonly mailer: MailerService,
  ) {
    super(config, jobs)
  }

  protected override queueName(): string {
    return EXCEPTION_RECALC_QUEUE_NAME
  }

  protected override async processJob(
    job: Job<ExceptionRecalcJobData>,
  ): Promise<void> {
    const {
      tenantId,
      jobType,
      locationIds = [],
      requestedBy,
      backgroundJobId = '',
    } = job.data

    if (jobType === 'notify') {
      await this.mailer.send(
        requestedBy ?? '',
        `Exceptions recalculated for ${tenantId}`,
      )
      return
    }

    await Promise.all(
      locationIds.map(async (locationId) => {
        try {
          await this.service.recalculateLocation(
            tenantId,
            locationId,
            backgroundJobId,
          )
          await this.jobs.incrementProgress(backgroundJobId, 1)
        } catch (error) {
          this.logger.warn(`Location ${locationId} skipped: ${error}`)
        }
      }),
    )

    await this.jobs.markComplete(backgroundJobId)
  }
}
