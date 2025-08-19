// Simple reusable worker pool with backpressure and reuse
// Usage:
//   const pool = new WorkerPool(() => new WorkerModule.default(), size)
//   await Promise.all(tasks.map(t => pool.run(t)))
//   await pool.terminate()

type Resolver<T> = (value: T | PromiseLike<T>) => void
type Rejecter = (reason?: any) => void

export class WorkerPool<TIn = any, TOut = any> {
  private workers: Worker[] = []
  private idle: number[] = []
  private busy: Set<number> = new Set()
  private queue: Array<{ payload: TIn; resolve: Resolver<TOut>; reject: Rejecter }>
  private factory: () => Worker

  constructor(factory: () => Worker, size: number) {
    this.factory = factory
    this.queue = []
    const n = Math.max(1, size|0)
    for (let i = 0; i < n; i++) {
      const w = this.factory()
      this.workers.push(w)
      this.idle.push(i)
    }
  }

  run(payload: TIn): Promise<TOut> {
    return new Promise<TOut>((resolve, reject) => {
      this.queue.push({ payload, resolve, reject })
      this.pump()
    })
  }

  private pump() {
    while (this.idle.length && this.queue.length) {
      const workerIdx = this.idle.shift() as number
      const task = this.queue.shift() as { payload: TIn; resolve: Resolver<any>; reject: Rejecter }
      this.busy.add(workerIdx)
      const w = this.workers[workerIdx]

      const onMessage = (ev: MessageEvent<any>) => {
        cleanup()
        task.resolve(ev.data)
        this.busy.delete(workerIdx)
        this.idle.push(workerIdx)
        this.pump()
      }
      const onError = (err: any) => {
        cleanup()
        task.reject(err)
        this.busy.delete(workerIdx)
        this.idle.push(workerIdx)
        this.pump()
      }
      const cleanup = () => {
        // ensure single-shot listener
        w.removeEventListener('message', onMessage as any)
        w.removeEventListener('error', onError as any)
      }

      w.addEventListener('message', onMessage as any, { once: true })
      w.addEventListener('error', onError as any, { once: true })
      try { w.postMessage(task.payload as any) } catch (e) { onError(e) }
    }
  }

  async terminate() {
    for (const w of this.workers) {
      try { w.terminate() } catch {}
    }
    this.workers = []
    this.idle = []
    this.busy.clear()
    // reject pending tasks
    while (this.queue.length) {
      const t = this.queue.shift()!
      try { t.reject(new Error('WorkerPool terminated')) } catch {}
    }
  }
}
