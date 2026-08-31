import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { BackgroundJobsService } from '~/common/background_jobs/background_jobs.service'
import { CacheHelperService } from '~/common/cache/cache-helper.service'
import { KyselyService } from '~/common/database/kysely.service'
import { PlanContextProvider } from '~/common/planning/plan-context.provider'
import { ExceptionRecalcQueue } from './exception-recalc.queue'

interface Movement {
  productLocationId: string
  date: string
  quantity: number
  unitOfMeasurementCode: string
}

interface BusinessException {
  productLocationId: string
  date: string
  score: number
  quantity: number
  unitOfMeasurementCode: string
}

@Injectable()
export class ExceptionReportService {
  private readonly logger = new Logger(ExceptionReportService.name)

  constructor(
    private readonly db: KyselyService,
    private readonly cache: CacheHelperService,
    private readonly jobs: BackgroundJobsService,
    private readonly planContext: PlanContextProvider,
    private readonly queue: ExceptionRecalcQueue,
  ) {}

  async startRecalculation(
    tenantId: string,
    locationIds: Array<string>,
    requestedBy: string,
  ): Promise<string> {
    if (await this.jobs.hasActiveJobOfType('exception_recalc')) {
      throw new ConflictException('A recalculation is already running')
    }

    const job = await this.jobs.createJob({
      type: 'exception_recalc',
      tenantId,
      total: locationIds.length,
    })

    this.logger.log(
      `Recalculation ${job.id} started for ${tenantId} by ${requestedBy}: ${locationIds.join(', ')}`,
    )

    this.recalculateAll(tenantId, locationIds, job.id)
      .then(() => this.queue.enqueue({ tenantId, jobType: 'notify', requestedBy }))
      .catch((error) => this.logger.error(`Recalculation ${job.id} failed: ${error}`))

    return job.id
  }

  async recalculateAll(
    tenantId: string,
    locationIds: Array<string>,
    backgroundJobId: string,
  ): Promise<void> {
    for (const locationId of locationIds) {
      await this.recalculateLocation(tenantId, locationId, backgroundJobId)
      await this.jobs.incrementProgress(backgroundJobId, 1)
    }
    await this.jobs.markComplete(backgroundJobId)
  }

  async recalculateLocation(
    tenantId: string,
    locationId: string,
    backgroundJobId: string,
  ): Promise<void> {
    const productLocations = await this.db
      .selectFrom('product_locations')
      .where('tenant_id', '=', tenantId)
      .where('location_id', '=', locationId)
      .select(['id', 'baseUnitOfMeasurementCode'])
      .execute()

    await this.db.transaction().execute(async (trx) => {
      for (const pl of productLocations) {
        if (await this.jobs.isCanceled(backgroundJobId)) {
          return
        }

        const planDate = await this.planContext.getDemandPlanDate()

        const movements = await trx
          .selectFrom('inventory_movements')
          .where('product_location_id', '=', pl.id)
          .where('date', '>=', planDate)
          .selectAll()
          .execute()

        const conversions = await trx
          .selectFrom('product_uom_conversions')
          .where('product_location_id', '=', pl.id)
          .select(['unitOfMeasurementCode', 'factorToBase'])
          .execute()

        const factors = Object.fromEntries(
          conversions.map((c) => [c.unitOfMeasurementCode, c.factorToBase]),
        )

        const exceptions = computeExceptions(
          pl.id,
          pl.baseUnitOfMeasurementCode,
          movements,
          factors,
        )

        await trx
          .deleteFrom('business_exceptions')
          .where('product_location_id', '=', pl.id)
          .execute()

        if (exceptions.length > 0) {
          await trx.insertInto('business_exceptions').values(exceptions).execute()
        }
      }

      await this.cache.invalidateByTag('business-exceptions')
    })
  }
}

// Walks movements in date order and flags every day whose running balance, in
// the product location's base unit, is negative. Balance is recomputed from the
// start for each day.
function computeExceptions(
  productLocationId: string,
  baseUnitOfMeasurementCode: string,
  movements: Array<Movement>,
  factors: Record<string, number>,
): Array<BusinessException> {
  const sorted = [...movements].sort((a, b) => a.date.localeCompare(b.date))
  const exceptions: Array<BusinessException> = []

  for (let i = 0; i < sorted.length; i++) {
    let balance = 0
    for (let j = 0; j <= i; j++) {
      balance +=
        sorted[j].quantity * (factors[sorted[j].unitOfMeasurementCode] ?? 1)
    }
    if (balance < 0) {
      exceptions.push({
        productLocationId,
        date: sorted[i].date,
        score: Math.abs(balance),
        quantity: balance,
        unitOfMeasurementCode: baseUnitOfMeasurementCode,
      })
    }
  }

  return exceptions
}
