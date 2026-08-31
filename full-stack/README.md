# Code review exercise: exception recalculation

You are reviewing a small feature from a NestJS (Node.js) backend for a
supply-chain planning product. Treat it as a pull request: what would you flag,
how severe is each item, and what would you change?

Take five minutes to read in silence first, then talk us through it.

## What you need to know about the system

- One **API** process serves HTTP. Separate **worker** processes drain job
  queues. Both run the same codebase; a job handler runs wherever its queue's
  worker lives.
- Node.js runs JavaScript on a **single thread with an event loop**. `await`
  yields to other requests; synchronous CPU work does not. Anything heavy or
  blocking inside the API process stalls every other request on that process.
- Queues are **BullMQ** on Redis. `BaseBullMQQueue` enqueues; `BaseBullMQProcessor`
  runs the handler on a worker with **at-least-once delivery** and automatic
  retries. A job that crashes or whose worker dies is redelivered from the start.
- `KyselyService` is a typed SQL query builder over a Postgres connection pool.
  `db.transaction().execute(fn)` holds one pooled connection for the duration of `fn`.
- `CacheHelperService` is a shared Redis cache; `invalidateByTag` evicts every
  entry tagged with that string.
- The database is reached with a service-role key, so route-level auth guards
  are the only per-request authorization.

You do not need to know TypeScript idioms. If a construct is unfamiliar
(`?? 1`, `(x) => ...`, `[...arr]`), just ask.

## Files

```
src/exception-report/
  exception-report.controller.ts   HTTP routes
  exception-report.service.ts      the recalculation and the summary
  exception-recalc.queue.ts        job producer
  exception-recalc.processor.ts    job consumer (runs on a worker)
```

Imports from `~/common/...` are house modules; their behaviour is described above
and you can assume they work as documented.
