import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  TableOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { PageContainer, type ProColumns } from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import { history as routerHistory } from "@umijs/max";
import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Input,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Tree,
  Typography,
} from "antd";
import type { DataNode } from "antd/es/tree";
import { useEffect, useMemo, useState } from "react";
import { appendAuditLog } from "../auditStore";
import { useCurrentDemoUserId } from "../currentUserStore";
import {
  analyzeSql,
  buildQueryResultPreview,
  compactRuleHits,
  dataSources,
  decisionMeta,
  getDataSourceTableMetadata,
  riskMeta,
  type QueryResultPreview,
  type QueryResultRow,
  type ReviewResult,
  type RuleHit,
  type TableColumnMeta,
  type TableMetadata,
} from "../mock";
import {
  readMockDataSourceConnections,
  subscribeMockDataSourceConnections,
} from "../mockApi";
import {
  readDemoUsersWithPermissions,
  subscribeUserPermissionChange,
} from "../permissionStore";
import {
  appendSqlClientHistoryRecord,
  buildSqlClientHistoryRecord,
  readSqlClientHistoryRecords,
  subscribeSqlClientHistoryRecords,
  type SqlClientHistoryRecord,
} from "../sqlClientHistoryStore";
import { tablePagination } from "../tablePagination";
import "./index.less";

const { Text } = Typography;
const { TextArea } = Input;

const emptyQueryResult: QueryResultPreview = {
  tableName: "-",
  sourceName: "-",
  columns: [],
  rows: [],
  emptyText: "执行 SELECT 并通过审核后展示结果",
};

const getDefaultMaskingEnabled = (user: {
  canViewPlain: boolean;
  maskingDefault: boolean;
}) => !user.canViewPlain || user.maskingDefault;

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
};

const getTableLimitClause = (table: TableMetadata) =>
  table.dbType === "oracle" || table.dbType === "db2"
    ? " fetch first 20 rows only"
    : " limit 20";

const getTableWhereClause = (table: TableMetadata) => {
  const columnNames = table.columns.map((column) => column.name);

  if (table.tableName === "customer_info" && columnNames.includes("city")) {
    return " where city = '北京'";
  }

  const dateColumn = table.columns.find((column) =>
    ["event_date", "created_at", "trade_time", "signed_date"].includes(
      column.name,
    ),
  );
  if (dateColumn) return ` where ${dateColumn.name} >= '2026-06-01'`;

  if (columnNames.includes("department_id")) return " where department_id = 12";

  return "";
};

const buildTableSelectSql = (table: TableMetadata) => {
  const columns = table.columns
    .slice(0, Math.min(table.columns.length, 5))
    .map((column) => column.name)
    .join(", ");

  return `select ${columns} from ${table.tableName}${getTableWhereClause(
    table,
  )}${getTableLimitClause(table)};`;
};

const getHistoryStatus = (review: ReviewResult) => {
  if (review.decision === "blocked") return "已阻断";
  if (review.decision === "approval") return "需审批";
  return "执行成功";
};

const getElapsedMs = (review: ReviewResult, rowCount: number) =>
  36 + review.ruleHits.length * 13 + rowCount * 4;

const seedDataSourceIds = dataSources.map((source) => source.id);

const SqlClient = () => {
  const { message } = App.useApp();
  const currentUserId = useCurrentDemoUserId();
  const [users, setUsers] = useState(() => readDemoUsersWithPermissions());
  const [connectionSources, setConnectionSources] = useState(
    readMockDataSourceConnections,
  );
  const [sourceId, setSourceId] = useState("mysql-prod");
  const [selectedTableKey, setSelectedTableKey] = useState<string>();
  const [sql, setSql] = useState("");
  const [maskingEnabled, setMaskingEnabled] = useState(true);
  const [review, setReview] = useState<ReviewResult>();
  const [queryResult, setQueryResult] =
    useState<QueryResultPreview>(emptyQueryResult);
  const [activeTab, setActiveTab] = useState("structure");
  const [historyRecords, setHistoryRecords] = useState(
    readSqlClientHistoryRecords,
  );
  const [resourceRefreshSeed, setResourceRefreshSeed] = useState(0);

  const currentUser = useMemo(
    () => users.find((item) => item.id === currentUserId) || users[0],
    [currentUserId, users],
  );
  const availableSources = useMemo(() => {
    const hasFullDataSourceScope = seedDataSourceIds.every((id) =>
      currentUser.allowedSources.includes(id),
    );

    return connectionSources.filter(
      (source) =>
        hasFullDataSourceScope ||
        currentUser.allowedSources.includes(source.id),
    );
  }, [connectionSources, currentUser.allowedSources]);
  const currentSource = useMemo(
    () =>
      availableSources.find((item) => item.id === sourceId) ||
      availableSources[0] ||
      dataSources[0],
    [availableSources, sourceId],
  );
  const allVisibleTables = useMemo(
    () =>
      availableSources.flatMap((source) => getDataSourceTableMetadata(source)),
    [availableSources, resourceRefreshSeed],
  );
  const selectedTable = useMemo(
    () => allVisibleTables.find((table) => table.key === selectedTableKey),
    [allVisibleTables, selectedTableKey],
  );
  const sourceOptions = useMemo(
    () =>
      availableSources.map((source) => ({
        label: source.name,
        value: source.id,
      })),
    [availableSources],
  );
  const visibleHistoryRecords = useMemo(() => {
    if (
      currentUser.canViewPlain ||
      currentUser.platformPermissions.includes("audit")
    ) {
      return historyRecords;
    }

    return historyRecords.filter((record) => record.userId === currentUser.id);
  }, [currentUser, historyRecords]);

  useEffect(
    () =>
      subscribeUserPermissionChange(() => {
        setUsers(readDemoUsersWithPermissions());
      }),
    [],
  );

  useEffect(
    () =>
      subscribeMockDataSourceConnections(() => {
        setConnectionSources(readMockDataSourceConnections());
      }),
    [],
  );

  useEffect(
    () =>
      subscribeSqlClientHistoryRecords(() => {
        setHistoryRecords(readSqlClientHistoryRecords());
      }),
    [],
  );

  useEffect(() => {
    const nextSource =
      availableSources.find((source) => source.id === sourceId) ||
      availableSources[0] ||
      dataSources[0];

    if (nextSource.id !== sourceId) {
      setSourceId(nextSource.id);
    }

    setMaskingEnabled(getDefaultMaskingEnabled(currentUser));
    setReview(undefined);
    setQueryResult(emptyQueryResult);
  }, [
    availableSources,
    currentUser.id,
    currentUser.canViewPlain,
    currentUser.maskingDefault,
    sourceId,
  ]);

  useEffect(() => {
    const sourceTables = getDataSourceTableMetadata(currentSource);
    const defaultTable =
      sourceTables.find((table) => table.authorized) || sourceTables[0];

    if (
      defaultTable &&
      (!selectedTable ||
        !sourceTables.some((table) => table.key === selectedTable.key))
    ) {
      setSelectedTableKey(defaultTable.key);
    }
  }, [currentSource, selectedTable]);

  const resetRunState = () => {
    setReview(undefined);
    setQueryResult(emptyQueryResult);
  };

  const treeData = useMemo<DataNode[]>(
    () =>
      availableSources.map((source) => {
        const tables = getDataSourceTableMetadata(source);
        const schemas = tables.reduce<Map<string, TableMetadata[]>>(
          (result, table) => {
            const schemaTables = result.get(table.schema) || [];
            schemaTables.push(table);
            result.set(table.schema, schemaTables);
            return result;
          },
          new Map(),
        );

        return {
          key: `source:${source.id}`,
          title: (
            <span className="sql-client-tree-source">
              <DatabaseOutlined />
              <span>{source.name}</span>
            </span>
          ),
          children: Array.from(schemas.entries()).map(
            ([schema, schemaTables]) => ({
              key: `schema:${source.id}:${schema}`,
              title: (
                <span className="sql-client-tree-schema">
                  <span>{schema}</span>
                  <Text type="secondary">{schemaTables.length}</Text>
                </span>
              ),
              selectable: false,
              children: schemaTables.map((table) => ({
                key: table.key,
                title: (
                  <Tooltip
                    title={`${table.schema}.${table.tableName} | ${
                      table.label
                    } | ${table.authorized ? "已授权" : "未授权"}`}
                  >
                    <span className="sql-client-tree-table">
                      <TableOutlined />
                      <span>{table.tableName}</span>
                      {!table.authorized && <Tag>未授权</Tag>}
                    </span>
                  </Tooltip>
                ),
              })),
            }),
          ),
        };
      }),
    [availableSources, resourceRefreshSeed],
  );

  const handleSourceChange = (nextSourceId: string) => {
    const source = availableSources.find((item) => item.id === nextSourceId);
    const sourceTables = source ? getDataSourceTableMetadata(source) : [];
    const nextTable =
      sourceTables.find((table) => table.authorized) || sourceTables[0];

    setSourceId(nextSourceId);
    setSelectedTableKey(nextTable?.key);
    resetRunState();
  };

  const handleTreeSelect = (keys: React.Key[]) => {
    const key = String(keys[0] || "");
    if (!key) return;

    if (key.startsWith("source:")) {
      handleSourceChange(key.replace("source:", ""));
      return;
    }

    const table = allVisibleTables.find((item) => item.key === key);
    if (!table) return;

    setSelectedTableKey(table.key);
    setSourceId(table.sourceId);
  };

  const fillTableSelectSql = (table = selectedTable) => {
    if (!table) return;

    setSourceId(table.sourceId);
    setSql(buildTableSelectSql(table));
    setActiveTab("structure");
    resetRunState();
  };

  const runSql = () => {
    const nextSql = sql.trim();
    if (!nextSql) {
      message.warning("请输入 SQL");
      return;
    }

    const nextReview = analyzeSql(
      nextSql,
      currentSource,
      currentUser,
      maskingEnabled,
    );
    const nextQueryResult = buildQueryResultPreview(
      nextReview,
      currentUser.resultLimit,
    );
    const rowCount = nextQueryResult.rows.length;
    const elapsedMs = getElapsedMs(nextReview, rowCount);

    setReview(nextReview);
    setQueryResult(nextQueryResult);
    setActiveTab(nextReview.decision === "pass" ? "results" : "review");

    const historyRecord = buildSqlClientHistoryRecord({
      userId: currentUser.id,
      user: currentUser.name,
      sourceId: currentSource.id,
      source: currentSource.name,
      dbType: currentSource.dbType,
      schema: selectedTable?.schema,
      tableName: nextReview.tableName,
      sqlType: nextReview.sqlType,
      decision: nextReview.decision,
      risk: nextReview.risk,
      status: getHistoryStatus(nextReview),
      rowCount,
      elapsedMs,
      sql: nextReview.sql,
      summary: nextReview.summary,
    });
    appendSqlClientHistoryRecord(historyRecord);

    appendAuditLog({
      module: "SQL客户端",
      action:
        nextReview.decision === "blocked"
          ? "SQL阻断"
          : nextReview.decision === "approval"
          ? "提交审核"
          : "SQL执行",
      user: currentUser.name,
      source: currentSource.name,
      sqlType: nextReview.sqlType.toUpperCase(),
      decision: decisionMeta[nextReview.decision].text,
      risk: nextReview.risk,
      note: `${nextReview.summary} SQL 指纹 ${historyRecord.sqlFingerprint}，耗时 ${elapsedMs}ms。`,
      sql: nextReview.sql,
      ruleHits: compactRuleHits(nextReview.ruleHits),
    });

    if (nextReview.decision === "blocked") {
      message.error("SQL 已被阻断，并写入执行历史和审计日志");
      return;
    }

    if (nextReview.decision === "approval") {
      message.warning("该 SQL 需要审批，请到 SQL 审核工作台生成审批单");
      return;
    }

    message.success(
      nextReview.maskingApplied ? "执行成功，结果已动态脱敏" : "执行成功",
    );
  };

  const columnRows = useMemo(
    () =>
      (selectedTable?.columns || []).map((column) => ({
        ...column,
        key: column.name,
      })),
    [selectedTable],
  );
  const columnColumns: ProColumns<TableColumnMeta & { key: string }>[] = [
    {
      title: "字段名",
      dataIndex: "name",
      width: 170,
      fixed: "left",
      render: (_, record) => (
        <Space size={6} wrap>
          <Text code>{record.name}</Text>
          {record.primaryKey && <Tag color="blue">PK</Tag>}
        </Space>
      ),
    },
    { title: "类型", dataIndex: "type", width: 150 },
    {
      title: "可为空",
      dataIndex: "nullable",
      width: 90,
      render: (_, record) => (record.nullable ? "是" : "否"),
    },
    { title: "字段说明", dataIndex: "comment", width: 180 },
    {
      title: "敏感类型",
      dataIndex: "sensitiveType",
      width: 120,
      render: (_, record) =>
        record.sensitiveType ? (
          <Tag color="orange">{record.sensitiveType}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "脱敏规则",
      dataIndex: "maskRule",
      ellipsis: true,
      render: (_, record) => record.maskRule || <Text type="secondary">-</Text>,
    },
  ];

  const ruleColumns: ProColumns<RuleHit>[] = [
    { title: "规则编号", dataIndex: "id", width: 120 },
    { title: "规则名称", dataIndex: "name", width: 180 },
    {
      title: "风险",
      dataIndex: "risk",
      width: 100,
      render: (_, record) => (
        <Tag color={riskMeta[record.risk].color}>
          {riskMeta[record.risk].text}
        </Tag>
      ),
    },
    {
      title: "处置",
      dataIndex: "action",
      width: 90,
      render: (_, record) => <Tag>{record.action}</Tag>,
    },
    { title: "说明", dataIndex: "description", ellipsis: true },
  ];

  const queryResultColumns: ProColumns<QueryResultRow>[] =
    queryResult.columns.map((column) => ({
      title: column.title,
      dataIndex: column.dataIndex,
      width: column.width,
      align: column.align,
      ellipsis: true,
    }));

  const historyColumns: ProColumns<SqlClientHistoryRecord>[] = [
    { title: "时间", dataIndex: "executedAt", width: 170 },
    { title: "用户", dataIndex: "user", width: 140 },
    { title: "数据源", dataIndex: "source", width: 220, ellipsis: true },
    {
      title: "类型",
      dataIndex: "sqlType",
      width: 90,
      render: (_, record) => record.sqlType.toUpperCase(),
    },
    {
      title: "结果",
      dataIndex: "status",
      width: 110,
      render: (_, record) => (
        <Tag color={decisionMeta[record.decision].color}>{record.status}</Tag>
      ),
    },
    {
      title: "风险",
      dataIndex: "risk",
      width: 100,
      render: (_, record) => (
        <Tag color={riskMeta[record.risk].color}>
          {riskMeta[record.risk].text}
        </Tag>
      ),
    },
    { title: "行数", dataIndex: "rowCount", width: 80, align: "right" },
    {
      title: "耗时",
      dataIndex: "elapsedMs",
      width: 90,
      align: "right",
      render: (_, record) => `${record.elapsedMs}ms`,
    },
    {
      title: "SQL",
      dataIndex: "sql",
      ellipsis: true,
      render: (_, record) => <Text code>{record.sql}</Text>,
    },
    {
      title: "操作",
      key: "action",
      width: 110,
      fixed: "right",
      render: (_, record) => (
        <Button
          size="small"
          type="link"
          onClick={() => {
            setSourceId(record.sourceId);
            setSql(record.sql);
            setActiveTab("review");
            resetRunState();
          }}
        >
          回填
        </Button>
      ),
    },
  ];

  const tableDetailContent = selectedTable ? (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
        <Descriptions.Item label="数据源">
          {currentSource.name}
        </Descriptions.Item>
        <Descriptions.Item label="Schema">
          <Text code>{selectedTable.schema}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="表名">
          <Text code>{selectedTable.tableName}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="中文名">
          {selectedTable.label}
        </Descriptions.Item>
        <Descriptions.Item label="数据量">
          {selectedTable.rows}
        </Descriptions.Item>
        <Descriptions.Item label="敏感等级">
          <Tag color={selectedTable.sensitivity === "高" ? "red" : "gold"}>
            {selectedTable.sensitivity}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="负责人">
          {selectedTable.owner}
        </Descriptions.Item>
        <Descriptions.Item label="授权状态">
          <Tag color={selectedTable.authorized ? "green" : "default"}>
            {selectedTable.authorized ? "在当前连接授权范围内" : "未授权"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
      <RKTable<TableColumnMeta & { key: string }>
        rowKey="key"
        size="small"
        columns={columnColumns}
        dataSource={columnRows}
        pagination={false}
        search={false}
        options={false}
        scroll={{ x: 900 }}
      />
    </Space>
  ) : (
    <Empty description="请选择资源树中的表" />
  );

  const reviewContent = review ? (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Space size={8} wrap>
        <Tag color={riskMeta[review.risk].color}>
          {review.risk === "critical" ? (
            <CloseCircleOutlined />
          ) : review.risk === "low" ? (
            <CheckCircleOutlined />
          ) : (
            <WarningOutlined />
          )}{" "}
          {riskMeta[review.risk].text}
        </Tag>
        <Tag color={decisionMeta[review.decision].color}>
          {decisionMeta[review.decision].text}
        </Tag>
        {review.maskingApplied && <Tag color="cyan">动态脱敏</Tag>}
      </Space>
      <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
        <Descriptions.Item label="SQL 类型">
          {review.sqlType.toUpperCase()}
        </Descriptions.Item>
        <Descriptions.Item label="目标表">{review.tableName}</Descriptions.Item>
        <Descriptions.Item label="目标库">
          {review.source.name}
        </Descriptions.Item>
        <Descriptions.Item label="风险分">{review.score}</Descriptions.Item>
        <Descriptions.Item label="结论" span={2}>
          {review.summary}
        </Descriptions.Item>
      </Descriptions>
      {review.decision === "approval" && (
        <Button
          type="primary"
          icon={<FileSearchOutlined />}
          onClick={() => routerHistory.push("/sql-security/console")}
        >
          去审核工作台生成审批单
        </Button>
      )}
      <RKTable<RuleHit>
        rowKey="id"
        size="small"
        columns={ruleColumns}
        dataSource={review.ruleHits}
        pagination={tablePagination}
        search={false}
        options={false}
        scroll={{ x: 900 }}
      />
    </Space>
  ) : (
    <Empty description="执行 SQL 后展示审核结论" />
  );

  const queryResultContent = queryResult.rows.length ? (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Space size={8} wrap>
        <Tag color="blue">{queryResult.sourceName}</Tag>
        <Tag>{queryResult.tableName}</Tag>
        <Tag>{queryResult.rows.length} 行</Tag>
      </Space>
      <RKTable<QueryResultRow>
        rowKey="key"
        size="small"
        columns={queryResultColumns}
        dataSource={queryResult.rows}
        pagination={tablePagination}
        search={false}
        options={false}
        scroll={{ x: "max-content" }}
      />
    </Space>
  ) : (
    <Empty description={queryResult.emptyText} />
  );

  return (
    <PageContainer className="sql-client-container" title={false}>
      <div className="sql-client-page">
        <div className="sql-client-layout">
          <Card
            className="sql-client-resource-card"
            title={
              <Space size={8}>
                <DatabaseOutlined />
                <span>数据源资源树</span>
              </Space>
            }
            extra={
              <Tooltip title="刷新资源树">
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setConnectionSources(readMockDataSourceConnections());
                    setResourceRefreshSeed((value) => value + 1);
                    message.success("资源树已刷新");
                  }}
                />
              </Tooltip>
            }
          >
            <Space
              className="sql-client-resource-content"
              direction="vertical"
              size={12}
              style={{ width: "100%" }}
            >
              <Select
                value={currentSource.id}
                options={sourceOptions}
                onChange={handleSourceChange}
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
              />
              <Tree
                className="sql-client-tree"
                blockNode
                defaultExpandAll
                selectedKeys={selectedTableKey ? [selectedTableKey] : []}
                treeData={treeData}
                onSelect={handleTreeSelect}
              />
            </Space>
          </Card>

          <Flex className="sql-client-main" vertical gap={16}>
            <Card
              title={
                <Space size={8} wrap>
                  <CodeOutlined />
                  <span>SQL 编辑器</span>
                  <Tag color="blue">PL/SQL 轻量体验</Tag>
                </Space>
              }
              extra={
                <Space size={8} wrap>
                  <Switch
                    size="small"
                    checked={maskingEnabled}
                    checkedChildren="脱敏"
                    unCheckedChildren="明文"
                    disabled={!currentUser.canViewPlain}
                    onChange={(checked) => {
                      setMaskingEnabled(checked);
                      resetRunState();
                    }}
                  />
                  <Button
                    icon={<CopyOutlined />}
                    onClick={async () => {
                      await copyText(sql);
                      message.success("已复制 SQL");
                    }}
                  >
                    复制
                  </Button>
                  <Button
                    icon={<FileSearchOutlined />}
                    onClick={() => fillTableSelectSql()}
                  >
                    生成查询
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={runSql}
                  >
                    执行
                  </Button>
                </Space>
              }
            >
              <TextArea
                className="sql-client-editor"
                value={sql}
                placeholder="从资源树选择表后生成查询，或直接输入需要审核执行的 SQL"
                autoSize={{ minRows: 8, maxRows: 12 }}
                onChange={(event) => {
                  setSql(event.target.value);
                  resetRunState();
                }}
              />
            </Card>

            <Card className="sql-client-result-card">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "structure",
                    label: "表结构详情",
                    children: tableDetailContent,
                  },
                  {
                    key: "review",
                    label: "审核结论",
                    children: reviewContent,
                  },
                  {
                    key: "results",
                    label: `查询结果（${queryResult.rows.length}）`,
                    children: queryResultContent,
                  },
                  {
                    key: "history",
                    label: (
                      <Space size={4}>
                        <HistoryOutlined />
                        执行历史
                      </Space>
                    ),
                    children: (
                      <RKTable<SqlClientHistoryRecord>
                        rowKey="id"
                        size="small"
                        columns={historyColumns}
                        dataSource={visibleHistoryRecords}
                        pagination={tablePagination}
                        search={false}
                        options={false}
                        locale={{ emptyText: "暂无执行历史" }}
                        scroll={{ x: "max-content" }}
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Flex>
        </div>
      </div>
    </PageContainer>
  );
};

export default SqlClient;
