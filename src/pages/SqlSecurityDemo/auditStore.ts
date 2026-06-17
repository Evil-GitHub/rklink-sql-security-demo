import dayjs from 'dayjs';
import { createId, seedAuditLogs, type AuditLog } from './mock';

const AUDIT_STORAGE_KEY = 'RKLINK_SQL_SECURITY_AUDIT_LOGS:v5';
const AUDIT_EVENT_NAME = 'rklink-sql-security-audit-change';

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const readAuditLogs = (): AuditLog[] => {
  if (!canUseStorage()) return seedAuditLogs;

  const raw = window.localStorage.getItem(AUDIT_STORAGE_KEY);
  if (!raw) return seedAuditLogs;

  try {
    const parsed = JSON.parse(raw) as AuditLog[];
    return Array.isArray(parsed) ? parsed : seedAuditLogs;
  } catch {
    return seedAuditLogs;
  }
};

const writeAuditLogs = (logs: AuditLog[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
  window.dispatchEvent(new CustomEvent(AUDIT_EVENT_NAME));
};

export const appendAuditLog = (
  entry: Omit<AuditLog, 'id' | 'time'> & {
    id?: string;
    time?: string;
  },
) => {
  const log: AuditLog = {
    id: entry.id || createId('AUD'),
    time: entry.time || dayjs().format('YYYY-MM-DD HH:mm:ss'),
    module: entry.module || 'SQL安全管控',
    action: entry.action || '用户操作',
    ip: entry.ip || '10.12.6.18',
    requestId: entry.requestId || createId('REQ'),
    ...entry,
  };

  writeAuditLogs([log, ...readAuditLogs()]);
  return log;
};

export const resetAuditLogs = () => {
  writeAuditLogs(seedAuditLogs);
};

export const subscribeAuditLogs = (callback: () => void) => {
  if (!canUseStorage()) return () => undefined;

  window.addEventListener(AUDIT_EVENT_NAME, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(AUDIT_EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
};
