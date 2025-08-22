import pDefer from 'p-defer';
import { defineStore } from 'pinia';

export const useAsyncGateStore = defineStore('asyncGate', () => {
  let deferred = pDefer<void>();

  function markReady() {
    deferred.resolve();
  }

  function reset() {
    deferred = pDefer<void>();
  }

  return {
    get promise() {
      return deferred.promise;
    },
    markReady,
    reset,
  };
});
