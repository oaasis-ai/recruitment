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
  recalculate(
    @Param('tenantId') tenantId: string,
    @Body() body: RecalculateBody,
  ) {
    this.service.recalculateAll(tenantId, body.locationIds, body.requestedBy)
    return { status: 'started' }
  }
}
