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
  yields to other work; synchronous CPU work does not. Anything heavy or
  blocking inside the API process stalls every other request on that process.
- Inventory movements are stored in whatever unit they arrived in;
  `product_uom_conversions` holds, per product location, the factor from each
  unit to that product location's base unit.
- The database is reached with a service-role key, so route-level auth guards
  are the only per-request authorization.

The house modules the feature imports (`~/common/...`, where `~` is `src/`) are
included as stubs in `src/common/`: real signatures, a comment on each stating
what it does, no implementation. Read them as you would in a real review.

You do not need to know TypeScript idioms. If a construct is unfamiliar
(`?? 1`, `(x) => ...`, `.then()`, `[...arr]`), just ask.

## Files

```
src/exception-report/                the code under review
  exception-report.controller.ts     HTTP route
  exception-report.service.ts        the recalculation
  exception-recalc.queue.ts          job producer
  exception-recalc.processor.ts      job consumer (runs on a worker)
src/common/                          house modules, as documented stubs
  background_jobs/                   job tracking rows + BullMQ base classes
  database/                          query builder, transactions, table types
  planning/  cache/
```
