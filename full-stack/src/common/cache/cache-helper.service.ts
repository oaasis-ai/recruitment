import { Injectable } from '@nestjs/common'

/** Shared Redis cache used by every api and worker process of the tenant. */
@Injectable()
export class CacheHelperService {
  /** Deletes every cached entry tagged with `tag`, immediately. */
  async invalidateByTag(tag: string): Promise<void> {
    throw new Error('house implementation not included in this exercise')
  }
}
