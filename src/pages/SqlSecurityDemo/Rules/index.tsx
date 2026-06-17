import { PageContainer, type ProColumns } from "@ant-design/pro-components";
import {
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from "@rklink/components";
import type { TabsProps } from "antd";
import { Tabs, Tag, Typography } from "antd";
import {
  analyzeSql,
  dataSources,
  decisionMeta,
  demoUsers,
  riskMeta,
  ruleStrategies,
  sourceTypeLabel,
  sqlTemplates,
  type ReviewResult,
  type RuleStrategy,
  type RuleStrategyScope,
} from "../mock";
import { tablePagination } from "../tablePagination";

const { Text } = Typography;

const ruleScopeLabelMap: Record<RuleStrategyScope, string> = {
  common: "公共规则",
  mysql: sourceTypeLabel.mysql,
  oracle: sourceTypeLabel.oracle,
  gaussdb: sourceTypeLabel.gaussdb,
  db2: sourceTypeLabel.db2,
};

const ruleScopeValueEnum = Object.fromEntries(
  Object.entries(ruleScopeLabelMap).map(([value, text]) => [value, { text }]),
);

const actionColorMap: Record<string, string> = {
  放行: "green",
  提示: "blue",
  脱敏: "cyan",
  审批: "gold",
  阻断: "red",
};

const statusColorMap: Record<RuleStrategy["status"], string> = {
  启用: "green",
  观察: "gold",
  停用: "default",
};

const actionValueEnum = Object.fromEntries(
  Object.keys(actionColorMap).map((value) => [value, { text: value }]),
);

const riskValueEnum = Object.fromEntries(
  Object.entries(riskMeta).map(([value, meta]) => [value, { text: meta.text }]),
);

const statusValueEnum = Object.fromEntries(
  Object.keys(statusColorMap).map((value) => [value, { text: value }]),
);

const RULE_LIST_CONDITIONS = {
  id: "like",
  name: "like",
  scope: "eq",
  category: "like",
  risk: "eq",
  action: "eq",
  status: "eq",
} as const;

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

const Rules = () => {
  const sampleResults: ReviewResult[] = sqlTemplates.map((template) => {
    const source =
      dataSources.find((item) => item.id === template.sourceId) ||
      dataSources[0];
    const user = template.name.includes("越权") ? demoUsers[0] : demoUsers[1];
    return analyzeSql(template.sql, source, user, user.maskingDefault);
  });

  const queryRuleStrategies = async (params: RKTableConditionRequestParams) => {
    const pageNum = Number(params.pageNum || 1);
    const pageSize = Number(params.pageSize || 10);
    const conditions = params.conditions || [];
    const id = getConditionValue(conditions, "id");
    const name = getConditionValue(conditions, "name");
    const scope = getConditionValue(conditions, "scope");
    const category = getConditionValue(conditions, "category");
    const risk = getConditionValue(conditions, "risk");
    const action = getConditionValue(conditions, "action");
    const status = getConditionValue(conditions, "status");
    const rows = ruleStrategies.filter(
      (rule) =>
        filterText(rule.id, id) &&
        filterText(rule.name, name) &&
        (!scope || rule.scope === scope) &&
        filterText(rule.category, category) &&
        (!risk || rule.risk === risk) &&
        (!action || rule.action === action) &&
        (!status || rule.status === status),
    );
    const start = (pageNum - 1) * pageSize;

    return {
      code: 200,
      data: rows.slice(start, start + pageSize),
      total: rows.length,
    };
  };

  const ruleColumns: ProColumns<RuleStrategy>[] = [
    {
      title: "规则编号",
      dataIndex: "id",
      width: 120,
      fixed: "left",
      render: (_, record) => <Text code>{record.id}</Text>,
      hideInSearch: true,
    },
    {
      title: "适用范围",
      dataIndex: "scope",
      valueEnum: ruleScopeValueEnum,
      width: 120,
      render: (_, record) => <Tag>{ruleScopeLabelMap[record.scope]}</Tag>,
    },
    {
      title: "规则名称",
      dataIndex: "name",
      width: 250,
      fixed: "left",
      hideInSearch: true,
    },
    {
      title: "规则类型",
      dataIndex: "category",
      width: 120,
      hideInSearch: true,
    },
    {
      title: "SQL 类型",
      dataIndex: "sqlTypes",
      width: 200,
      search: false,
    },
    {
      title: "命中条件",
      dataIndex: "trigger",
      width: 350,
      ellipsis: true,
      search: false,
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
      title: "处置",
      dataIndex: "action",
      valueEnum: actionValueEnum,
      width: 90,
      hideInSearch: true,

      render: (_, record) => (
        <Tag color={actionColorMap[record.action]}>{record.action}</Tag>
      ),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 80,
      search: false,
    },
    {
      title: "状态",
      dataIndex: "status",
      valueEnum: statusValueEnum,
      width: 90,
      render: (_, record) => (
        <Tag color={statusColorMap[record.status]}>{record.status}</Tag>
      ),
    },
    {
      title: "策略说明",
      dataIndex: "description",
      width: 360,
      ellipsis: true,
      search: false,
    },
  ];

  const sampleColumns: ProColumns<ReviewResult>[] = [
    {
      title: "SQL 场景",
      dataIndex: "sql",
      render: (_, record) => <Text code>{record.sql}</Text>,
    },
    {
      title: "数据源",
      dataIndex: ["source", "name"],
      ellipsis: true,
    },
    {
      title: "类型",
      dataIndex: ["source", "dbType"],
      render: (_, record) => sourceTypeLabel[record.source.dbType],
    },
    {
      title: "风险",
      dataIndex: "risk",
      render: (_, record) => (
        <Tag color={riskMeta[record.risk].color}>
          {riskMeta[record.risk].text}
        </Tag>
      ),
    },
    {
      title: "处置",
      dataIndex: "decision",
      render: (_, record) => (
        <Tag color={decisionMeta[record.decision].color}>
          {decisionMeta[record.decision].text}
        </Tag>
      ),
    },
    {
      title: "命中规则数",
      dataIndex: "ruleHits",
      align: "right",
      render: (_, record) => record.ruleHits.length,
    },
    { title: "结论", dataIndex: "summary", ellipsis: true },
  ];

  const pageTabItems: TabsProps["items"] = [
    {
      key: "rules",
      label: `规则策略（${ruleStrategies.length}）`,
      children: (
        <RKTable<
          RuleStrategy,
          Record<string, unknown>,
          "text",
          RKTableConditionRequestParams
        >
          headerTitle="规则策略列表"
          rowKey="id"
          size="small"
          columns={ruleColumns}
          requestApi={queryRuleStrategies}
          requestParamsFormatter={createRKTableConditionRequestParamsFormatter(
            RULE_LIST_CONDITIONS,
          )}
          defaultPageSize={10}
          search={{ labelWidth: 90 }}
          options={false}
          scroll={{ x: 1760 }}
        />
      ),
    },
    {
      key: "samples",
      label: `场景命中效果（${sampleResults.length}）`,
      children: (
        <RKTable<ReviewResult>
          headerTitle="场景命中效果"
          rowKey="id"
          size="small"
          columns={sampleColumns}
          dataSource={sampleResults}
          pagination={tablePagination}
          search={false}
          options={false}
          scroll={{ x: "max-content" }}
        />
      ),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <Tabs defaultActiveKey="rules" items={pageTabItems} />
    </PageContainer>
  );
};

export default Rules;
