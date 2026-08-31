import { Injectable } from '@nestjs/common'

/** Resolves dates from the tenant's active planning cycles. */
@Injectable()
export class PlanContextProvider {
  /**
   * Start date of the active demand planning cycle. Reads `planning_cycles`
   * on every call; the result is not cached.
   */
  async getDemandPlanDate(): Promise<string> {
    throw new Error('house implementation not included in this exercise')
  }
}
