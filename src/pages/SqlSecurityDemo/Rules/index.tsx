import { PlusOutlined } from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";
import {
  DrawerForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import {
  RKConfirmAction,
  RKTable,
  createRKTableConditionRequestParamsFormatter,
  type RKTableConditionRequestParams,
  type RKTableRequestCondition,
} from "@rklink/components";
import type { TabsProps } from "antd";
import { App, Button, Space, Tabs, Tag, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { appendAuditLog } from "../auditStore";
import { readCurrentDemoUserId } from "../currentUserStore";
import {
  analyzeSql,
  createRuleStrategyConfig,
  dataSources,
  decisionMeta,
  demoUsers,
  deleteRuleStrategyConfigs,
  readRuleStrategies,
  riskMeta,
  sourceTypeLabel,
  sqlTemplates,
  subscribeRuleStrategiesChange,
  updateRuleStrategyConfig,
  type ReviewResult,
  type RuleAction,
  type RuleStrategy,
  type RuleStrategyPayload,
  type RuleStrategyScope,
  type RuleStrategyStatus,
  type RiskLevel,
} from "../mock";
import { tablePagination } from "../tablePagination";
import { readDemoUserAccounts } from "../userStore";

const { Text } = Typography;

type RuleFormValues = RuleStrategyPayload;

const ruleScopeLabelMap: Record<RuleStrategyScope, string> = {
  common: "公共规则",
  mysql: sourceTypeLabel.mysql,
  oracle: sourceTypeLabel.oracle,
  gaussdb: sourceTypeLabel.gaussdb,
  db2: sourceTypeLabel.db2,
};

const ruleScopeOptions = Object.entries(ruleScopeLabelMap).map(
  ([value, label]) => ({ label, value }),
);

const ruleScopeValueEnum = Object.fromEntries(
  Object.entries(ruleScopeLabelMap).map(([value, text]) => [value, { text }]),
);

const actionColorMap: Record<RuleAction, string> = {
  放行: "green",
  提示: "blue",
  脱敏: "cyan",
  审批: "gold",
  阻断: "red",
};

const statusColorMap: Record<RuleStrategyStatus, string> = {
  启用: "green",
  观察: "gold",
  停用: "default",
};

const actionOptions = Object.keys(actionColorMap).map((value) => ({
  label: value,
  value,
}));

const actionValueEnum = Object.fromEntries(
  Object.keys(actionColorMap).map((value) => [value, { text: value }]),
);

const riskOptions = Object.entries(riskMeta).map(([value, meta]) => ({
  label: meta.text,
  value,
}));

const riskValueEnum = Object.fromEntries(
  Object.entries(riskMeta).map(([value, meta]) => [value, { text: meta.text }]),
);

const statusOptions = Object.keys(statusColorMap).map((value) => ({
  label: value,
  value,
}));

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

const defaultRuleValues: RuleFormValues = {
  id: "",
  scope: "common",
  name: "",
  category: "自定义规则",
  sqlTypes: "ALL",
  trigger: "",
  risk: "medium",
  action: "提示",
  priority: 50,
  status: "启用",
  description: "",
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

const getNextCustomRuleId = (rules: RuleStrategy[]) => {
  let index = rules.length + 1;
  let id = `R-CUSTOM-${String(index).padStart(3, "0")}`;
  const usedIds = new Set(rules.map((rule) => rule.id));

  while (usedIds.has(id)) {
    index += 1;
    id = `R-CUSTOM-${String(index).padStart(3, "0")}`;
  }

  return id;
};

const Rules = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [rules, setRules] = useState<RuleStrategy[]>(() => readRuleStrategies());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleStrategy>();
  const currentUserName = useMemo(() => {
    const currentUserId = readCurrentDemoUserId();
    return (
      readDemoUserAccounts().find((user) => user.id === currentUserId)?.name ||
      "当前用户"
    );
  }, []);

  useEffect(
    () =>
      subscribeRuleStrategiesChange(() => {
        setRules(readRuleStrategies());
        actionRef.current?.reload();
      }),
    [],
  );

  const sampleResults: ReviewResult[] = useMemo(
    () =>
      sqlTemplates.map((template) => {
        const source =
          dataSources.find((item) => item.id === template.sourceId) ||
          dataSources[0];
        const user = template.name.includes("越权")
          ? demoUsers[0]
          : demoUsers[1];
        return analyzeSql(template.sql, source, user, user.maskingDefault);
      }),
    [rules],
  );

  const appendRuleAudit = (
    action: string,
    note: string,
    risk: RiskLevel = "medium",
  ) => {
    appendAuditLog({
      module: "规则策略",
      action,
      user: currentUserName,
      source: "规则中心",
      sqlType: "CONFIG",
      decision: "操作成功",
      risk,
      note,
    });
  };

  const reloadRules = () => {
    setRules(readRuleStrategies());
    actionRef.current?.reload();
  };

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
    const rows = rules.filter(
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

  const openCreateDrawer = () => {
    setEditingRule(undefined);
    setDrawerOpen(true);
  };

  const openEditDrawer = (rule: RuleStrategy) => {
    setEditingRule(rule);
    setDrawerOpen(true);
  };

  const toggleRuleStatus = (rule: RuleStrategy) => {
    const nextStatus = rule.status === "停用" ? "启用" : "停用";
    updateRuleStrategyConfig(rule.id, { ...rule, status: nextStatus });
    appendRuleAudit(
      "规则状态变更",
      `规则 ${rule.id} ${rule.name} 状态由 ${rule.status} 调整为 ${nextStatus}。`,
      nextStatus === "停用" ? "high" : "medium",
    );
    reloadRules();
    message.success("操作成功");
  };

  const deleteRule = async (rule: RuleStrategy) => {
    deleteRuleStrategyConfigs([rule.id]);
    appendRuleAudit(
      "规则删除",
      `删除规则 ${rule.id} ${rule.name}。`,
      "high",
    );
    reloadRules();
    return { code: 200 };
  };

  const handleSubmit = async (values: RuleFormValues) => {
    const normalizedId = String(values.id || "")
      .trim()
      .toUpperCase();

    if (!normalizedId) {
      message.warning("请输入规则编号");
      return false;
    }

    const duplicateRule = rules.some(
      (rule) => rule.id === normalizedId && rule.id !== editingRule?.id,
    );
    if (duplicateRule) {
      message.warning("规则编号已存在");
      return false;
    }

    const payload: RuleStrategyPayload = {
      ...values,
      id: normalizedId,
      priority: Number(values.priority || 50),
    };

    if (editingRule) {
      updateRuleStrategyConfig(editingRule.id, payload);
      appendRuleAudit(
        "规则更新",
        `更新规则 ${editingRule.id} ${editingRule.name}；风险 ${editingRule.risk} -> ${payload.risk}；处置 ${editingRule.action} -> ${payload.action}；状态 ${editingRule.status} -> ${payload.status}。`,
      );
    } else {
      createRuleStrategyConfig(payload);
      appendRuleAudit(
        "规则创建",
        `新增规则 ${payload.id} ${payload.name}；风险 ${payload.risk}；处置 ${payload.action}。`,
      );
    }

    setDrawerOpen(false);
    reloadRules();
    message.success("保存成功");
    return true;
  };

  const ruleColumns: ProColumns<RuleStrategy>[] = [
    {
      title: "规则编号",
      dataIndex: "id",
      width: 130,
      fixed: "left",
      render: (_, record) => <Text code>{record.id}</Text>,
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
    },
    {
      title: "规则类型",
      dataIndex: "category",
      width: 120,
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
    {
      title: "操作",
      valueType: "option",
      width: 190,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" type="link" onClick={() => openEditDrawer(record)}>
            编辑
          </Button>
          <Button size="small" type="link" onClick={() => toggleRuleStatus(record)}>
            {record.status === "停用" ? "启用" : "停用"}
          </Button>
          <RKConfirmAction
            size="small"
            request={() => deleteRule(record)}
            confirm={{
              title: "确认删除规则",
              content: `确认删除规则 ${record.id} ${record.name} 吗？`,
            }}
            successMessage="删除成功"
          >
            删除
          </RKConfirmAction>
        </Space>
      ),
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
      label: `规则策略（${rules.length}）`,
      children: (
        <RKTable<
          RuleStrategy,
          Record<string, unknown>,
          "text",
          RKTableConditionRequestParams
        >
          actionRef={actionRef}
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
          scroll={{ x: 2000 }}
          toolBarRender={() => [
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateDrawer}
            >
              新增规则
            </Button>,
          ]}
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
      <DrawerForm<RuleFormValues>
        key={editingRule?.id || "create"}
        title={editingRule ? "编辑规则" : "新增规则"}
        width={720}
        open={drawerOpen}
        initialValues={
          editingRule || {
            ...defaultRuleValues,
            id: getNextCustomRuleId(rules),
          }
        }
        drawerProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
        onOpenChange={(visible) => {
          setDrawerOpen(visible);
          if (!visible) setEditingRule(undefined);
        }}
        submitter={{
          searchConfig: {
            submitText: "保存",
            resetText: "取消",
          },
        }}
        onFinish={handleSubmit}
      >
        <ProFormText
          name="id"
          label="规则编号"
          fieldProps={{ disabled: Boolean(editingRule) }}
          rules={[{ required: true, message: "请输入规则编号" }]}
        />
        <ProFormText
          name="name"
          label="规则名称"
          rules={[{ required: true, message: "请输入规则名称" }]}
        />
        <ProFormSelect
          name="scope"
          label="适用范围"
          options={ruleScopeOptions}
          rules={[{ required: true, message: "请选择适用范围" }]}
        />
        <ProFormText
          name="category"
          label="规则类型"
          rules={[{ required: true, message: "请输入规则类型" }]}
        />
        <ProFormText
          name="sqlTypes"
          label="SQL 类型"
          rules={[{ required: true, message: "请输入 SQL 类型" }]}
        />
        <ProFormTextArea
          name="trigger"
          label="命中条件"
          fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }}
          rules={[{ required: true, message: "请输入命中条件" }]}
        />
        <ProFormSelect
          name="risk"
          label="风险等级"
          options={riskOptions}
          rules={[{ required: true, message: "请选择风险等级" }]}
        />
        <ProFormSelect
          name="action"
          label="处置策略"
          options={actionOptions}
          rules={[{ required: true, message: "请选择处置策略" }]}
        />
        <ProFormDigit
          name="priority"
          label="优先级"
          min={1}
          max={999}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: "请输入优先级" }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={statusOptions}
          rules={[{ required: true, message: "请选择状态" }]}
        />
        <ProFormTextArea
          name="description"
          label="策略说明"
          fieldProps={{ autoSize: { minRows: 3, maxRows: 6 } }}
          rules={[{ required: true, message: "请输入策略说明" }]}
        />
      </DrawerForm>
    </PageContainer>
  );
};

export default Rules;
