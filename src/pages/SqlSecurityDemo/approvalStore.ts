import { seedApprovalTickets, type ApprovalTicket } from './mock';

const APPROVAL_STORAGE_KEY = 'RKLINK_SQL_SECURITY_APPROVAL_TICKETS:v8';
const APPROVAL_EVENT_NAME = 'rklink-sql-security-approval-change';

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const readApprovalTickets = (): ApprovalTicket[] => {
  if (!canUseStorage()) return seedApprovalTickets();

  const raw = window.localStorage.getItem(APPROVAL_STORAGE_KEY);
  if (!raw) return seedApprovalTickets();

  try {
    const parsed = JSON.parse(raw) as ApprovalTicket[];
    return Array.isArray(parsed) ? parsed : seedApprovalTickets();
  } catch {
    return seedApprovalTickets();
  }
};

export const writeApprovalTickets = (tickets: ApprovalTicket[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    APPROVAL_STORAGE_KEY,
    JSON.stringify(tickets.slice(0, 200)),
  );
  window.dispatchEvent(new CustomEvent(APPROVAL_EVENT_NAME));
};

export const appendApprovalTicket = (ticket: ApprovalTicket) => {
  const nextTickets = [
    ticket,
    ...readApprovalTickets().filter((item) => item.id !== ticket.id),
  ];

  writeApprovalTickets(nextTickets);
  return ticket;
};

export const resetApprovalTickets = () => {
  const tickets = seedApprovalTickets();
  writeApprovalTickets(tickets);
  return tickets;
};

export const subscribeApprovalTickets = (callback: () => void) => {
  if (!canUseStorage()) return () => undefined;

  window.addEventListener(APPROVAL_EVENT_NAME, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(APPROVAL_EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
};
