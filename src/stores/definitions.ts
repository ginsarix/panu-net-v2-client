import { defineStore } from 'pinia';
import { ref } from 'vue';

import { getCurrentDefinition, getDefinition, getDefinitions } from '@/services/api/definitions';

type Definition = Awaited<ReturnType<typeof getDefinition>>['definition'];
type DefinitionSummary = Awaited<ReturnType<typeof getDefinitions>>['definitions'][number];

export const useDefinitionsStore = defineStore('definitions', () => {
  const currentDefinition = ref<Definition | null>(null);
  const loadingCurrentDefinition = ref(false);

  const loadCurrentDefinition = async () => {
    loadingCurrentDefinition.value = true;
    try {
      const { definition } = await getCurrentDefinition();
      currentDefinition.value = definition;
    } catch (error) {
      throw error;
    } finally {
      loadingCurrentDefinition.value = false;
    }
  };

  const definitions = ref<Definition[]>([]);
  const loading = ref(false);

  const loadDefinitions = async () => {
    loading.value = true;
    try {
      const { definitions: summaries } = await getDefinitions();

      const detailedDefinitions = await Promise.all(
        summaries.map(async (summary: DefinitionSummary) => {
          const { definition } = await getDefinition({ id: summary.id });
          return definition;
        }),
      );

      definitions.value = detailedDefinitions;
    } finally {
      loading.value = false;
    }
  };

  const addDefinitionToList = (definition: Definition, addToStart = false) =>
    addToStart ? definitions.value.unshift(definition) : definitions.value.push(definition);

  const updateDefinitionInList = (definition: Definition) => {
    definitions.value = definitions.value.map((item) =>
      item.id === definition.id ? definition : item,
    );
  };

  const removeDefinitionFromList = (id: number) => {
    definitions.value = definitions.value.filter((definition) => definition.id !== id);
  };

  return {
    definitions,
    loading,
    loadDefinitions,
    addDefinitionToList,
    updateDefinitionInList,
    removeDefinitionFromList,
    currentDefinition,
    loadingCurrentDefinition,
    loadCurrentDefinition,
  };
});
