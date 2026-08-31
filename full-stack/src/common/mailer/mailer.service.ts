import { Injectable } from '@nestjs/common'

@Injectable()
export class MailerService {
  /** Sends one email. Throws if the provider rejects the request. */
  async send(to: string, subject: string): Promise<void> {
    throw new Error('house implementation not included in this exercise')
  }
}
