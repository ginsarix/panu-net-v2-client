import { defineStore } from 'pinia';
import { ref } from 'vue';

import {
  type GetTicketMessagesParams,
  type GetTicketsParams,
  getTicketMessages,
  getTickets,
} from '@/services/api/tickets';

type Ticket = Awaited<ReturnType<typeof getTickets>>['data'][number];
type TicketMessagesResponse = Awaited<ReturnType<typeof getTicketMessages>>;
type TicketMessage = TicketMessagesResponse['data'][number];
type CurrentTicket = TicketMessagesResponse['ticket'];

export const useTicketsStore = defineStore('tickets', () => {
  const tickets = ref<Ticket[]>([]);
  const totalTicketsCount = ref(0);

  const ticketMessages = ref<TicketMessage[]>([]);
  const totalTicketMessagesCount = ref(0);
  const currentTicket = ref<CurrentTicket | null>(null);

  const loadTickets = async (params?: GetTicketsParams) => {
    const response = await getTickets(params);
    tickets.value = response.data;
    totalTicketsCount.value = response.total;
  };

  const loadTicketMessages = async (ticketId: number, params?: GetTicketMessagesParams) => {
    const response = await getTicketMessages(ticketId, params);
    ticketMessages.value = response.data;
    totalTicketMessagesCount.value = response.total;
    currentTicket.value = response.ticket;
  };

  const addTicketToList = (ticket: Ticket, addToStart = false) =>
    addToStart ? tickets.value.unshift(ticket) : tickets.value.push(ticket);

  const removeTicketById = (id: string | number) => {
    tickets.value = tickets.value.filter((t) => t.ticket.id !== id);
  };

  return {
    tickets,
    addTicketToList,
    removeTicketById,
    totalTicketsCount,
    ticketMessages,
    totalTicketMessagesCount,
    currentTicket,
    loadTickets,
    loadTicketMessages,
  };
});
