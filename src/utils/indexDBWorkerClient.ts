// utils/indexDBWorkerClient.ts
let worker: Worker;
const callbacks: Record<string, (res: any) => void> = {};

export const initWorker = () => {
  if (!worker && typeof window !== 'undefined') {
    worker = new Worker(new URL('../workers/indexDBWorkerClient.ts', import.meta.url), {
      type: 'module',
    });
    console.log('worker running');

    worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      if (callbacks[id]) {
        if (error) {
          console.error(error);
        }
        callbacks[id](result || error);
        delete callbacks[id];
      }
    };
  }
};

export const callWorker = (action: string, payload?: any): Promise<any> => {
  return new Promise((resolve) => {
    const id = crypto.randomUUID();
    callbacks[id] = resolve;
    worker.postMessage({ id, action, payload });
  });
};
