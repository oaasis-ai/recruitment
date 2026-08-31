import { Injectable } from '@nestjs/common'
import { Kysely, Transaction } from 'kysely'
import { Database } from './database.types'

export interface UnitOfWork {
  trx: Transaction<Database>
  /** Queues a cache tag to be invalidated once the transaction has committed. */
  deferCacheInvalidation(tag: string): void
}

/**
 * Typed query builder over the process's Postgres connection pool. The pool
 * is shared by every request and job in the process; its size is
 * `DB_POOL_MAX` (default 80). Acquiring a connection when none is idle waits,
 * and times out after 30 s.
 */
@Injectable()
export class KyselyService extends Kysely<Database> {
  /**
   * Runs `fn` inside a transaction. One pooled connection is held from the
   * first statement until `fn` resolves or rejects.
   */
  override transaction(): {
    execute<T>(fn: (trx: Transaction<Database>) => Promise<T>): Promise<T>
  } {
    throw new Error('house implementation not included in this exercise')
  }

  /**
   * Like `transaction()`, and additionally flushes every tag queued through
   * `uow.deferCacheInvalidation` after the commit succeeds.
   */
  async runInTransaction<T>(fn: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    throw new Error('house implementation not included in this exercise')
  }
}
