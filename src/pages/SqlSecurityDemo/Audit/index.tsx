import { DownloadOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import { PageContainer } from "@ant-design/pro-components";
import {
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from "@rklink/components";
import { Button, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  appendAuditLog,
  readAuditLogs,
  subscribeAuditLogs,
} from "../auditStore";
import { readCurrentDemoUserId } from "../currentUserStore";
import { formatRuleHitSummary, riskMeta, type AuditLog } from "../mock";
import { readDemoUserAccounts } from "../userStore";

const { Text } = Typography;

const AUDIT_LIST_CONDITIONS = {
  time: "between",
  module: "eq",
  action: "eq",
  user: "eq",
  source: "eq",
  sqlType: "eq",
  decision: "eq",
  risk: "eq",
  ruleHitId: "eq",
  requestId: "like",
} as const;

const riskValueEnum = Object.fromEntries(
  Object.entries(riskMeta).map(([value, meta]) => [value, { text: meta.text }]),
);

const buildValueEnum = (values: Array<string | undefined>) =>
  Object.fromEntries(
    Array.from(new Set(values.filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
      .map((value) => [value, { text: value }]),
  );

const buildRuleHitValueEnum = (logs: AuditLog[]) => {
  const entries = new Map<string, string>();

  logs.forEach((log) => {
    log.ruleHits?.forEach((rule) => {
      entries.set(rule.id, `${rule.id} ${rule.name}`);
    });
  });

  return Object.fromEntries(
    Array.from(entries.entries())
      .sort(([left], [right]) => left.localeCompare(right, "zh-Hans-CN"))
      .map(([value, text]) => [value, { text }]),
  );
};

const getConditionValue = (
  conditions: RKTableRequestCondition[] = [],
  field: string,
) => conditions.find((item) => item.field === field)?.value;

const filterText = (value: string | undefined, keyword: unknown) => {
  const text = String(keyword || "")
    .trim()
    .toLowerCase();
  if (!text) return true;

  return String(value || "")
    .toLowerCase()
    .includes(text);
};

const toTimeRange = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;

  const [start, end] = value;
  const startTime = start ? dayjs(start) : undefined;
  const endTime = end ? dayjs(end) : undefined;

  return {
    end: endTime?.isValid() ? endTime.endOf("day") : undefined,
    start: startTime?.isValid() ? startTime.startOf("day") : undefined,
  };
};

const inTimeRange = (time: string, value: unknown) => {
  const range = toTimeRange(value);
  if (!range) return filterText(time, value);

  const current = dayjs(time);
  if (!current.isValid()) return false;
  if (range.start && current.isBefore(range.start)) return false;
  if (range.end && current.isAfter(range.end)) return false;

  return true;
};

const filterAuditLogs = (
  logs: AuditLog[],
  conditions: RKTableRequestCondition[] = [],
) => {
  const time = getConditionValue(conditions, "time");
  const module = getConditionValue(conditions, "module");
  const action = getConditionValue(conditions, "action");
  const user = getConditionValue(conditions, "user");
  const source = getConditionValue(conditions, "source");
  const sqlType = getConditionValue(conditions, "sqlType");
  const decision = getConditionValue(conditions, "decision");
  const risk = getConditionValue(conditions, "risk");
  const ruleHitId = getConditionValue(conditions, "ruleHitId");
  const requestId = getConditionValue(conditions, "requestId");

  return logs.filter(
    (log) =>
      inTimeRange(log.time, time) &&
      (!module || log.module === module) &&
      (!action || log.action === action) &&
      (!user || log.user === user) &&
      (!source || log.source === source) &&
      (!sqlType || log.sqlType === sqlType) &&
      (!decision || log.decision === decision) &&
      (!risk || log.risk === risk) &&
      (!ruleHitId ||
        log.ruleHits?.some((rule) => rule.id === String(ruleHitId))) &&
      filterText(log.requestId, requestId),
  );
};

const toCsvCell = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (rows: AuditLog[]) => {
  const headers = [
    "时间",
    "模块",
    "动作",
    "用户",
    "数据源",
    "类型",
    "处置",
    "风险",
    "命中规则",
    "IP",
    "请求号",
    "说明",
    "SQL",
  ];
  const body = rows.map((row) =>
    [
      row.time,
      row.module,
      row.action,
      row.user,
      row.source,
      row.sqlType,
      row.decision,
      riskMeta[row.risk].text,
      formatRuleHitSummary(row.ruleHits),
      row.ip,
      row.requestId,
      row.note,
      row.sql,
    ]
      .map(toCsvCell)
      .join(","),
  );
  const csv = [headers.map(toCsvCell).join(","), ...body].join("\n");
  const blob = new Blob([`\ufeff${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `audit-logs-${Date.now()}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const Audit = () => {
  const actionRef = useRef<ActionType>();
  const latestConditionsRef = useRef<RKTableRequestCondition[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => readAuditLogs());
  const currentUserName = useMemo(() => {
    const currentUserId = readCurrentDemoUserId();
    return (
      readDemoUserAccounts().find((user) => user.id === currentUserId)?.name ||
      "当前用户"
    );
  }, []);
  const auditValueEnums = useMemo(
    () => ({
      action: buildValueEnum(auditLogs.map((log) => log.action)),
      decision: buildValueEnum(auditLogs.map((log) => log.decision)),
      module: buildValueEnum(auditLogs.map((log) => log.module)),
      source: buildValueEnum(auditLogs.map((log) => log.source)),
      sqlType: buildValueEnum(auditLogs.map((log) => log.sqlType)),
      user: buildValueEnum(auditLogs.map((log) => log.user)),
      ruleHitId: buildRuleHitValueEnum(auditLogs),
    }),
    [auditLogs],
  );

  useEffect(() => {
    return subscribeAuditLogs(() => {
      setAuditLogs(readAuditLogs());
    });
  }, []);

  useEffect(() => {
    actionRef.current?.reload();
  }, [auditLogs]);

  const queryAuditLogs = async (params: RKTableConditionRequestParams) => {
    const pageNum = Number(params.pageNum || 1);
    const pageSize = Number(params.pageSize || 10);
    const conditions = params.conditions || [];
    const rows = filterAuditLogs(auditLogs, conditions);
    const start = (pageNum - 1) * pageSize;

    latestConditionsRef.current = conditions;

    return {
      code: 200,
      data: rows.slice(start, start + pageSize),
      total: rows.length,
    };
  };

  const exportAuditLogs = () => {
    const rows = filterAuditLogs(readAuditLogs(), latestConditionsRef.current);

    downloadCsv(rows);
    appendAuditLog({
      module: "审计日志",
      action: "审计导出",
      user: currentUserName,
      source: "审计日志",
      sqlType: "EXPORT",
      decision: "操作成功",
      risk: "low",
      note: `导出当前筛选条件下的审计日志 ${rows.length} 条。`,
    });
  };

  const columns: ProColumns<AuditLog>[] = [
    {
      title: "时间",
      dataIndex: "time",
      valueType: "dateRange",
      width: 170,
      render: (_, record) => record.time,
    },
    {
      title: "模块",
      dataIndex: "module",
      valueEnum: auditValueEnums.module,
      width: 120,
    },
    {
      title: "动作",
      dataIndex: "action",
      valueEnum: auditValueEnums.action,
      width: 120,
    },
    {
      title: "用户",
      dataIndex: "user",
      valueEnum: auditValueEnums.user,
      width: 150,
    },
    {
      title: "数据源",
      dataIndex: "source",
      valueEnum: auditValueEnums.source,
      width: 220,
      ellipsis: true,
    },
    {
      title: "类型",
      dataIndex: "sqlType",
      valueEnum: auditValueEnums.sqlType,
      width: 90,
    },
    {
      title: "处置",
      dataIndex: "decision",
      valueEnum: auditValueEnums.decision,
      width: 110,
    },
    {
      title: "风险",
      dataIndex: "risk",
      valueEnum: riskValueEnum,
      width: 100,
      render: (_, record) => (
        <Tag color={riskMeta[record.risk].color}>
          {riskMeta[record.risk].text}
        </Tag>
      ),
    },
    {
      title: "命中规则",
      dataIndex: "ruleHitId",
      valueEnum: auditValueEnums.ruleHitId,
      width: 260,
      render: (_, record) =>
        record.ruleHits?.length ? (
          <Space size={[4, 4]} wrap>
            {record.ruleHits.map((rule) => (
              <Tag
                key={`${record.id}-${rule.id}`}
                color={riskMeta[rule.risk].color}
              >
                {rule.id}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    { title: "IP", dataIndex: "ip", width: 120, search: false },
    {
      title: "说明",
      dataIndex: "note",
      width: 260,
      ellipsis: true,
      search: false,
    },
    {
      title: "SQL 摘要",
      dataIndex: "sql",
      width: 280,
      ellipsis: true,
      search: false,
      render: (_, record) =>
        record.sql ? (
          <Text code>{record.sql}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <RKTable<
        AuditLog,
        Record<string, unknown>,
        "text",
        RKTableConditionRequestParams
      >
        actionRef={actionRef}
        rowKey="id"
        headerTitle="审计事件列表"
        size="small"
        columns={columns}
        requestApi={queryAuditLogs}
        requestParamsFormatter={createRKTableConditionRequestParamsFormatter(
          AUDIT_LIST_CONDITIONS,
        )}
        defaultPageSize={10}
        search={{ labelWidth: 80 }}
        toolBarRender={() => [
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportAuditLogs}
          >
            导出
          </Button>,
        ]}
        scroll={{ x: "max-content" }}
      />
    </PageContainer>
  );
};

export default Audit;
