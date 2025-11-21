import { trpc } from '../trpc';

type CreateContractInput = Parameters<typeof trpc.contract.createContract.mutate>[0];
type EditContractInput = Parameters<typeof trpc.contract.editContract.mutate>[0];
type DeleteContractInput = Parameters<typeof trpc.contract.deleteContract.mutate>[0];

export const createContract = async (contract: CreateContractInput) =>
  await trpc.contract.createContract.mutate(contract);
export const editContract = async (contract: EditContractInput) =>
  await trpc.contract.editContract.mutate(contract);
export const deleteContract = async (contract: DeleteContractInput) =>
  await trpc.contract.deleteContract.mutate(contract);

export const getContracts = async () => await trpc.contract.getContracts.query();
