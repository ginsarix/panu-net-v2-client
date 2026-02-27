import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getWorkHours } from '@/services/api/work-hours';

type WorkHours = Awaited<ReturnType<typeof getWorkHours>>['employeeTallies']['result'];

export const useWorkHoursStore = defineStore('workHours', () => {
  const workHours = ref<WorkHours>([]);

  const loadWorkHours = async () => {
    const response = await getWorkHours();
    workHours.value = response.employeeTallies.result;
  };

  return { workHours, loadWorkHours };
});
