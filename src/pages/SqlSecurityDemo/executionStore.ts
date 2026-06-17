export type ExecutionRecord = {
  affectedRows: number;
  executedAt: string;
  executor: string;
  id: string;
  result: "执行成功" | "执行失败";
  rollbackStatus: "已登记" | "无需回滚";
  source: string;
  sql: string;
  ticketId: string;
};

const EXECUTION_STORAGE_KEY = "RKLINK_SQL_SECURITY_EXECUTION_RECORDS:v4";
const EXECUTION_EVENT_NAME = "rklink-sql-security-execution-change";

const seedExecutionRecords: ExecutionRecord[] = [
  {
    id: "EXE-SEED-001",
    ticketId: "APR-SEED-003",
    executedAt: "2026-06-14 17:02:45",
    executor: "人事用户 周倩",
    source: "人事薪酬-DB2生产库",
    sql: "update employee_salary set salary_amount = '28600.00' where employee_id = 'E12001';",
    affectedRows: 1,
    result: "执行成功",
    rollbackStatus: "已登记",
  },
  {
    id: "EXE-SEED-002",
    ticketId: "APR-SEED-002",
    executedAt: "2026-06-15 10:22:46",
    executor: "DBA 管理员 王强",
    source: "实时风控-GaussDB生产库",
    sql: "update risk_event set event_status = 'CLOSED' where risk_level = 'LOW' and event_date < '2026-06-01';",
    affectedRows: 128,
    result: "执行成功",
    rollbackStatus: "已登记",
  },
];

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const readExecutionRecords = (): ExecutionRecord[] => {
  if (!canUseStorage()) return seedExecutionRecords;

  const raw = window.localStorage.getItem(EXECUTION_STORAGE_KEY);
  if (!raw) return seedExecutionRecords;

  try {
    const parsed = JSON.parse(raw) as ExecutionRecord[];
    return Array.isArray(parsed) ? parsed : seedExecutionRecords;
  } catch {
    return seedExecutionRecords;
  }
};

export const writeExecutionRecords = (records: ExecutionRecord[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    EXECUTION_STORAGE_KEY,
    JSON.stringify(records.slice(0, 200)),
  );
  window.dispatchEvent(new CustomEvent(EXECUTION_EVENT_NAME));
};

export const appendExecutionRecord = (record: ExecutionRecord) => {
  const nextRecords = [
    record,
    ...readExecutionRecords().filter((item) => item.id !== record.id),
  ];

  writeExecutionRecords(nextRecords);
  return record;
};

export const subscribeExecutionRecords = (callback: () => void) => {
  if (!canUseStorage()) return () => undefined;

  window.addEventListener(EXECUTION_EVENT_NAME, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(EXECUTION_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
};
