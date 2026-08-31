import { Body, Controller, Param, Post } from '@nestjs/common'
import { ExceptionReportService } from './exception-report.service'

interface RecalculateBody {
  locationIds: Array<string>
  requestedBy: string
}

@Controller('exception-reports')
export class ExceptionReportController {
  constructor(private readonly service: ExceptionReportService) {}

  @Post(':tenantId/recalculate')
  async recalculate(
    @Param('tenantId') tenantId: string,
    @Body() body: RecalculateBody,
  ): Promise<{ jobId: string }> {
    const jobId = await this.service.startRecalculation(
      tenantId,
      body.locationIds,
      body.requestedBy,
    )
    return { jobId }
  }
}
