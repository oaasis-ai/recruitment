import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { CacheHelperService } from '~/common/cache/cache-helper.service'
import { KyselyService } from '~/common/database/kysely.service'
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

interface Summary {
  total: number
  count: number
  top: Array<BusinessException>
}

@Injectable()
export class ExceptionReportService {
  private readonly logger = new Logger(ExceptionReportService.name)
  private readonly summaryCache = new Map<string, Summary>()

  constructor(
    private readonly db: KyselyService,
    private readonly http: HttpService,
    private readonly cache: CacheHelperService,
    private readonly queue: ExceptionRecalcQueue,
  ) {
    setInterval(() => this.summaryCache.clear(), 10 * 60 * 1000)
  }

  async recalculateAll(
    tenantId: string,
    locationIds: Array<string>,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `Recalculation started for ${tenantId} by ${requestedBy}: ${locationIds.join(', ')}`,
    )

    for (const locationId of locationIds) {
      await this.recalculateLocation(tenantId, locationId)
    }

    await this.queue.enqueue({ tenantId, jobType: 'notify', requestedBy })
  }

  async recalculateLocation(tenantId: string, locationId: string): Promise<void> {
    const productLocations = await this.db
      .selectFrom('product_locations')
      .where('tenant_id', '=', tenantId)
      .where('location_id', '=', locationId)
      .select(['id'])
      .execute()

    await this.db.transaction().execute(async (trx) => {
      for (const pl of productLocations) {
        const movements = await trx
          .selectFrom('inventory_movements')
          .where('product_location_id', '=', pl.id)
          .selectAll()
          .execute()

        const exceptions = computeExceptions(pl.id, movements)

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

  async buildSummary(tenantId: string, uom?: string): Promise<Summary> {
    const cached = this.summaryCache.get(tenantId)
    if (cached) {
      return cached
    }

    const rows = await this.db
      .selectFrom('business_exceptions')
      .where('tenant_id', '=', tenantId)
      .selectAll()
      .execute()

    const factors = await this.fetchConversionFactors(tenantId, uom)

    const total = rows.reduce(
      (acc, row) =>
        acc + row.quantity * (factors[row.unitOfMeasurementCode] ?? 1),
      0,
    )

    const summary: Summary = {
      total,
      count: rows.length,
      top: rows.sort((a, b) => b.score - a.score).slice(0, 10),
    }

    this.summaryCache.set(tenantId, summary)
    return summary
  }

  private async fetchConversionFactors(
    tenantId: string,
    uom?: string,
  ): Promise<Record<string, number>> {
    try {
      const response = await firstValueFrom(
        this.http.get(
          `${process.env.UOM_SERVICE_URL}/tenants/${tenantId}/factors?to=${uom}`,
        ),
      )
      return response.data
    } catch (error) {
      this.logger.error(`Could not fetch factors: ${JSON.stringify(error)}`)
      return {}
    }
  }
}

// Walks movements in date order and flags every day whose running balance is
// negative. Balance is recomputed from the start for each day.
function computeExceptions(
  productLocationId: string,
  movements: Array<Movement>,
): Array<BusinessException> {
  const sorted = [...movements].sort((a, b) => a.date.localeCompare(b.date))
  const exceptions: Array<BusinessException> = []

  for (let i = 0; i < sorted.length; i++) {
    let balance = 0
    for (let j = 0; j <= i; j++) {
      balance += sorted[j].quantity
    }
    if (balance < 0) {
      exceptions.push({
        productLocationId,
        date: sorted[i].date,
        score: Math.abs(balance),
        quantity: balance,
        unitOfMeasurementCode: sorted[i].unitOfMeasurementCode,
      })
    }
  }

  return exceptions
}
