import { trpc } from '@/services/trpc';

export type CreateDefinitionInput = Parameters<typeof trpc.definitions.createDefinition.mutate>[0];
export type UpdateDefinitionInput = Parameters<typeof trpc.definitions.updateDefinition.mutate>[0];
export type DeleteDefinitionInput = Parameters<typeof trpc.definitions.deleteDefinition.mutate>[0];
export type GetDefinitionInput = Parameters<typeof trpc.definitions.getDefinition.query>[0];

export const getDefinitions = async () => await trpc.definitions.getDefinitions.query();

export const getDefinition = async (input: GetDefinitionInput) =>
  await trpc.definitions.getDefinition.query(input);

export const createDefinition = async (input: CreateDefinitionInput) =>
  await trpc.definitions.createDefinition.mutate(input);

export const updateDefinition = async (input: UpdateDefinitionInput) =>
  await trpc.definitions.updateDefinition.mutate(input);

export const deleteDefinition = async (input: DeleteDefinitionInput) =>
  await trpc.definitions.deleteDefinition.mutate(input);

export const getCurrentDefinition = async () => await trpc.definitions.getCurrentDefinition.query();
