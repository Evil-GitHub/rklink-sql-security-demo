import dayjs from "dayjs";
import {
  buildSqlFingerprint,
  createId,
  type DbKind,
  type Decision,
  type RiskLevel,
  type SqlType,
} from "./mock";

export type SqlClientHistoryRecord = {
  id: string;
  executedAt: string;
  userId: string;
  user: string;
  sourceId: string;
  source: string;
  dbType: DbKind;
  schema?: string;
  tableName: string;
  sqlType: SqlType;
  decision: Decision;
  risk: RiskLevel;
  status: "执行成功" | "需审批" | "已阻断";
  rowCount: number;
  elapsedMs: number;
  sql: string;
  sqlFingerprint: string;
  summary: string;
};

const HISTORY_STORAGE_KEY = "RKLINK_SQL_SECURITY_SQL_CLIENT_HISTORY:v1";
const HISTORY_EVENT_NAME = "rklink-sql-security-sql-client-history-change";

const seedSqlClientHistoryRecords: SqlClientHistoryRecord[] = [
  {
    id: "SCH-SEED-003",
    executedAt: "2026-06-15 10:39:12",
    userId: "risk",
    user: "风控用户 刘伟",
    sourceId: "gaussdb-risk",
    source: "实时风控-GaussDB生产库",
    dbType: "gaussdb",
    schema: "risk_model",
    tableName: "device_fingerprint",
    sqlType: "select",
    decision: "pass",
    risk: "medium",
    status: "执行成功",
    rowCount: 3,
    elapsedMs: 82,
    sql: "select device_id, customer_id, device_fingerprint from device_fingerprint where risk_tag = '异地设备' limit 20;",
    sqlFingerprint: buildSqlFingerprint(
      "select device_id, customer_id, device_fingerprint from device_fingerprint where risk_tag = '异地设备' limit 20;",
    ),
    summary: "命中设备指纹敏感字段，结果按策略脱敏后返回。",
  },
  {
    id: "SCH-SEED-002",
    executedAt: "2026-06-15 09:58:44",
    userId: "dev",
    user: "开发用户 张明",
    sourceId: "mysql-prod",
    source: "客户中心-MySQL生产库",
    dbType: "mysql",
    schema: "crm_core",
    tableName: "customer_info",
    sqlType: "select",
    decision: "blocked",
    risk: "critical",
    status: "已阻断",
    rowCount: 0,
    elapsedMs: 41,
    sql: "select * from customer_info where 1=1;",
    sqlFingerprint: buildSqlFingerprint("select * from customer_info where 1=1;"),
    summary: "WHERE 恒真条件命中阻断规则。",
  },
  {
    id: "SCH-SEED-001",
    executedAt: "2026-06-14 17:21:33",
    userId: "hr",
    user: "人事用户 周倩",
    sourceId: "db2-payroll",
    source: "人事薪酬-DB2生产库",
    dbType: "db2",
    schema: "HR_SALARY",
    tableName: "employee_salary",
    sqlType: "select",
    decision: "pass",
    risk: "high",
    status: "执行成功",
    rowCount: 3,
    elapsedMs: 96,
    sql: "select employee_name, mobile, bank_card, salary_amount from employee_salary where department_id = 12 fetch first 20 rows only;",
    sqlFingerprint: buildSqlFingerprint(
      "select employee_name, mobile, bank_card, salary_amount from employee_salary where department_id = 12 fetch first 20 rows only;",
    ),
    summary: "薪酬、银行卡和手机号字段已强制脱敏。",
  },
];

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const cloneRecord = (record: SqlClientHistoryRecord) => ({ ...record });

export const buildSqlClientHistoryRecord = (
  record: Omit<SqlClientHistoryRecord, "id" | "executedAt" | "sqlFingerprint"> &
    Partial<Pick<SqlClientHistoryRecord, "id" | "executedAt" | "sqlFingerprint">>,
): SqlClientHistoryRecord => ({
  ...record,
  id: record.id || createId("SCH"),
  executedAt: record.executedAt || dayjs().format("YYYY-MM-DD HH:mm:ss"),
  sqlFingerprint: record.sqlFingerprint || buildSqlFingerprint(record.sql),
});

export const readSqlClientHistoryRecords = (): SqlClientHistoryRecord[] => {
  if (!canUseStorage()) return seedSqlClientHistoryRecords.map(cloneRecord);

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) return seedSqlClientHistoryRecords.map(cloneRecord);

  try {
    const parsed = JSON.parse(raw) as SqlClientHistoryRecord[];
    return Array.isArray(parsed)
      ? parsed.map(cloneRecord)
      : seedSqlClientHistoryRecords.map(cloneRecord);
  } catch {
    return seedSqlClientHistoryRecords.map(cloneRecord);
  }
};

const writeSqlClientHistoryRecords = (records: SqlClientHistoryRecord[]) => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(records.slice(0, 200).map(cloneRecord)),
  );
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT_NAME));
};

export const appendSqlClientHistoryRecord = (
  record: SqlClientHistoryRecord,
) => {
  const nextRecords = [
    record,
    ...readSqlClientHistoryRecords().filter((item) => item.id !== record.id),
  ];

  writeSqlClientHistoryRecords(nextRecords);
  return record;
};

export const resetSqlClientHistoryRecords = () => {
  writeSqlClientHistoryRecords(seedSqlClientHistoryRecords);
  return readSqlClientHistoryRecords();
};

export const subscribeSqlClientHistoryRecords = (callback: () => void) => {
  if (!canUseStorage()) return () => undefined;

  window.addEventListener(HISTORY_EVENT_NAME, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(HISTORY_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
};
