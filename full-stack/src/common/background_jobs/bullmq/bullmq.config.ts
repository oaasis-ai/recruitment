import { Injectable } from '@nestjs/common'

/** Redis connection settings shared by every queue and worker in the process. */
@Injectable()
export class BullMQConfigService {}
