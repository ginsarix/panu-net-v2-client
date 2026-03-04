import { trpc } from '../trpc';

type OpenTicketInput = Parameters<typeof trpc.ticket.openTicket.mutate>[0];
type AddTicketMessageInput = Parameters<typeof trpc.ticket.addTicketMessage.mutate>[0];
export type GetTicketsParams = {
  page?: number;
  limit?: number;
  state?: 'open' | 'in_process' | 'completed' | 'reopened' | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | null;
  search?: string | null;
};
export type GetTicketMessagesParams = GetTicketsParams;

export const openTicket = async (ticket: OpenTicketInput) =>
  await trpc.ticket.openTicket.mutate(ticket);
export const setTicketState = async (ticketId: number, state: 'in_process' | 'completed') =>
  await trpc.ticket.setTicketState.mutate({ ticketId, state });
export const addTicketMessage = async (message: AddTicketMessageInput) =>
  await trpc.ticket.addTicketMessage.mutate(message);
export const getTickets = async (params?: GetTicketsParams) =>
  await trpc.ticket.getTickets.query(params ?? {});
export const getTicketMessages = async (ticketId: number, params?: GetTicketMessagesParams) =>
  await trpc.ticket.getTicketMessages.query({ ticketId, ...(params ?? {}) });
export const deleteTicket = async (id: number) => await trpc.ticket.deleteTicket.mutate({ id });
