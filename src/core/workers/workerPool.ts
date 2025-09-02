// WorkerPool - abstraction simple pour réutiliser des Web Workers
export interface WorkerTask<T = any> { id: string; payload: T; type: string; resolve: (v:any)=>void; reject: (e:any)=>void }

export class WorkerPool {
  private workers: Worker[] = []
  private queue: WorkerTask[] = []
  private roundRobin = 0

  constructor(size: number, private workerFactory: () => Worker){
    for(let i=0;i<size;i++) this.workers.push(this.workerFactory())
  }

  exec<TPayload, TResult>(type: string, payload: TPayload): Promise<TResult>{
    return new Promise((resolve, reject) => {
      const task: WorkerTask = { id: Math.random().toString(36).slice(2), payload, type, resolve, reject }
      this.queue.push(task)
      this.drain()
    })
  }

  private drain(){
    while(this.queue.length){
      const task = this.queue.shift()!
      const worker = this.nextWorker()
      worker.onmessage = (e: MessageEvent) => {
        if(e.data && e.data.id === task.id){ task.resolve(e.data.result) }
      }
      worker.onerror = (e) => task.reject(e)
      worker.postMessage({ id: task.id, type: task.type, payload: task.payload })
    }
  }

  private nextWorker(){
    const w = this.workers[this.roundRobin % this.workers.length]
    this.roundRobin++
    return w
  }

  destroy(){ this.workers.forEach(w=> w.terminate()); this.workers = []; this.queue = [] }

  // Expose métriques basiques pour diagnostics
  public getQueueLength(){ return this.queue.length }
  public getWorkerCount(){ return this.workers.length }
}

// Factory utilitaire simple pour un worker générique de calcul
export function createComputationWorker(){
  const code = `self.onmessage = (e)=>{ const { id, type, payload } = e.data; switch(type){ case 'sum': { const r = payload.reduce((a,b)=>a+b,0); self.postMessage({ id, result: r }); break;} case 'sort': { const r = [...payload].sort(); self.postMessage({ id, result: r }); break;} default: self.postMessage({ id, result: null }); } }`
  const blob = new Blob([code], { type: 'application/javascript' })
  return new Worker(URL.createObjectURL(blob))
}
