import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileProtectOutlined,
  PlayCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
  type ProColumns,
  type ProFormInstance,
} from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import { history } from "@umijs/max";
import {
  App,
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { appendApprovalTicket } from "../approvalStore";
import { appendAuditLog } from "../auditStore";
import {
  useCurrentDemoUserId,
  writeCurrentDemoUserId,
} from "../currentUserStore";
import {
  analyzeSql,
  buildSqlFingerprint,
  buildQueryResultPreview,
  compactRuleHits,
  createId,
  dataSources,
  decisionMeta,
  riskMeta,
  sourceTypeLabel,
  type ApprovalTicket,
  type AuditLog,
  type QueryResultPreview,
  type QueryResultRow,
  type ReviewResult,
  type RuleHit,
} from "../mock";
import {
  readDemoUsersWithPermissions,
  subscribeUserPermissionChange,
} from "../permissionStore";
import {
  getAccessRecordByPermissionCodes,
  getUserPermissionCodes,
} from "../routePermissions";
import { tablePagination } from "../tablePagination";

const { Text } = Typography;

type SqlReviewFormValues = {
  sourceId: string;
  sql: string;
};

type ApprovalTicketFormValues = {
  approverId?: string;
  changeReasonCategory?: string;
  changeReason?: string;
  estimatedImpactRows?: number;
  rollbackPlan?: string;
};

const changeReasonCategoryOptions = [
  "生产数据修正",
  "风险事件归档",
  "账务复核",
  "薪酬更正",
  "客户资料修正",
  "应急处置",
].map((value) => ({ label: value, value }));

const getDefaultMaskingEnabled = (user: {
  canViewPlain: boolean;
  maskingDefault: boolean;
}) => !user.canViewPlain || user.maskingDefault;

const getSuggestedImpactRows = (review?: ReviewResult) => {
  if (!review) return 1;
  if (review.risk === "high") return 128;
  if (review.risk === "medium") return 10;
  return 1;
};

const getDefaultRollbackPlan = (review?: ReviewResult) => {
  if (!review || review.tableName === "-") {
    return "执行前确认原值并保留回滚 SQL。";
  }

  return `执行前备份 ${review.tableName} 命中记录；如需回滚，按备份主键恢复原值。`;
};

const emptyQueryResult: QueryResultPreview = {
  tableName: "-",
  sourceName: "-",
  columns: [],
  rows: [],
  emptyText: "仅 SELECT 查询会展示结果",
};

const Console = () => {
  const { message } = App.useApp();
  const formRef = useRef<ProFormInstance<SqlReviewFormValues>>();
  const currentUserId = useCurrentDemoUserId();
  const [users, setUsers] = useState(() => readDemoUsersWithPermissions());
  const [sourceId, setSourceId] = useState("mysql-prod");
  const [sql, setSql] = useState("");
  const [maskingEnabled, setMaskingEnabled] = useState(true);
  const [review, setReview] = useState<ReviewResult>();
  const [queryResult, setQueryResult] =
    useState<QueryResultPreview>(emptyQueryResult);
  const [generatedApprovalTicket, setGeneratedApprovalTicket] =
    useState<ApprovalTicket>();
  const [pendingApprovalReview, setPendingApprovalReview] =
    useState<ReviewResult>();
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const currentUser = useMemo(
    () => users.find((item) => item.id === currentUserId) || users[0],
    [currentUserId, users],
  );
  const currentSource = useMemo(
    () => dataSources.find((item) => item.id === sourceId) || dataSources[0],
    [sourceId],
  );
  const availableSources = useMemo(
    () =>
      dataSources.filter((source) =>
        currentUser.allowedSources.includes(source.id),
      ),
    [currentUser.allowedSources],
  );
  const approvalUserOptions = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.status === "在职" &&
            user.id !== currentUser.id &&
            getAccessRecordByPermissionCodes(getUserPermissionCodes(user))[
              "approval:update"
            ],
        )
        .map((user) => ({
          label: `${user.name} / ${user.role} / ${user.department}`,
          value: user.id,
        })),
    [currentUser.id, users],
  );
  const sourceOptions = useMemo(
    () =>
      availableSources.map((source) => ({
        label: `${source.name} / ${sourceTypeLabel[source.dbType]} / ${
          source.environment
        }`,
        value: source.id,
      })),
    [availableSources],
  );

  const resetReviewState = () => {
    setReview(undefined);
    setQueryResult(emptyQueryResult);
    setGeneratedApprovalTicket(undefined);
    setPendingApprovalReview(undefined);
    setApprovalModalOpen(false);
  };

  useEffect(
    () =>
      subscribeUserPermissionChange(() => {
        setUsers(readDemoUsersWithPermissions());
      }),
    [],
  );

  useEffect(() => {
    const nextSource =
      dataSources.find((source) =>
        currentUser.allowedSources.includes(source.id),
      ) || dataSources[0];

    if (!currentUser.allowedSources.includes(sourceId)) {
      setSourceId(nextSource.id);
    }

    setMaskingEnabled(getDefaultMaskingEnabled(currentUser));
    resetReviewState();
  }, [currentUser.id, currentUser.canViewPlain, currentUser.maskingDefault]);

  useEffect(() => {
    formRef.current?.setFieldsValue({ sourceId, sql });
  }, [sourceId, sql]);

  const handleUserChange = (nextUserId: string) => {
    const nextUser = users.find((user) => user.id === nextUserId) || users[0];
    const nextSource =
      dataSources.find((source) =>
        nextUser.allowedSources.includes(source.id),
      ) || dataSources[0];

    writeCurrentDemoUserId(nextUser.id);
    setSourceId(nextSource.id);
    setMaskingEnabled(getDefaultMaskingEnabled(nextUser));
    resetReviewState();
  };

  const handleSourceChange = (nextSourceId: string) => {
    setSourceId(nextSourceId);
    resetReviewState();
  };

  const pushAudit = (entry: Omit<AuditLog, "id" | "time">) => {
    appendAuditLog(entry);
  };

  const runReview = () => {
    const formValues = formRef.current?.getFieldsValue();
    const nextSourceId = formValues?.sourceId || sourceId;
    const nextSql = String(formValues?.sql || sql || "");
    const selectedSource =
      dataSources.find((item) => item.id === nextSourceId) || currentSource;

    if (!nextSql.trim()) {
      message.warning("请输入 SQL");
      return;
    }

    setSourceId(nextSourceId);
    setSql(nextSql);

    const nextReview = analyzeSql(
      nextSql,
      selectedSource,
      currentUser,
      maskingEnabled,
    );
    setReview(nextReview);
    setGeneratedApprovalTicket(undefined);
    setQueryResult(
      buildQueryResultPreview(nextReview, currentUser.resultLimit),
    );

    if (nextReview.decision === "approval") {
      if (!approvalUserOptions.length) {
        message.error("当前没有具备审批处理权限的用户，请先配置审批人权限");
        return;
      }

      setPendingApprovalReview(nextReview);
      setApprovalModalOpen(true);
      message.info("请选择审批人后生成 DML 审批单");
    } else if (nextReview.decision === "blocked") {
      message.error("SQL 已被阻断");
      pushAudit({
        module: "SQL审核工作台",
        action: "SQL阻断",
        user: currentUser.name,
        source: selectedSource.name,
        sqlType: nextReview.sqlType.toUpperCase(),
        decision: decisionMeta[nextReview.decision].text,
        risk: nextReview.risk,
        note: nextReview.summary,
        sql: nextReview.sql,
        ruleHits: compactRuleHits(nextReview.ruleHits),
      });
    } else {
      message.success(
        nextReview.maskingApplied
          ? "查询已执行，结果已动态脱敏"
          : "SQL 审核通过",
      );
      pushAudit({
        module: "SQL审核工作台",
        action: "SQL执行",
        user: currentUser.name,
        source: selectedSource.name,
        sqlType: nextReview.sqlType.toUpperCase(),
        decision: decisionMeta[nextReview.decision].text,
        risk: nextReview.risk,
        note: nextReview.summary,
        sql: nextReview.sql,
        ruleHits: compactRuleHits(nextReview.ruleHits),
      });
    }
  };

  const submitApprovalTicket = async (values: ApprovalTicketFormValues) => {
    if (!pendingApprovalReview) return false;

    const approver = users.find((user) => user.id === values.approverId);
    if (!approver) {
      message.warning("请选择审批人");
      return false;
    }

    const changeReason = String(values.changeReason || "").trim();
    const rollbackPlan = String(values.rollbackPlan || "").trim();
    const estimatedImpactRows = Number(
      values.estimatedImpactRows || getSuggestedImpactRows(pendingApprovalReview),
    );

    if (!values.changeReasonCategory || !changeReason || !rollbackPlan) {
      message.warning("请补充变更原因、预计影响和回滚方案");
      return false;
    }

    const approvalTicket: ApprovalTicket = {
      id: createId("APR"),
      review: pendingApprovalReview,
      status: "pending",
      applicant: currentUser.name,
      applicantId: currentUser.id,
      createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      approverId: approver.id,
      approver: approver.name,
      changeReasonCategory: values.changeReasonCategory,
      changeReason,
      estimatedImpactRows,
      rollbackPlan,
      approvedSqlFingerprint: buildSqlFingerprint(pendingApprovalReview.sql),
    };

    appendApprovalTicket(approvalTicket);
    setGeneratedApprovalTicket(approvalTicket);
    setPendingApprovalReview(undefined);
    setApprovalModalOpen(false);
    message.success("已生成 DML 审批单");

    pushAudit({
      module: "SQL审核工作台",
      action: "提交审批",
      user: currentUser.name,
      source: pendingApprovalReview.source.name,
      sqlType: pendingApprovalReview.sqlType.toUpperCase(),
      decision: decisionMeta[pendingApprovalReview.decision].text,
      risk: pendingApprovalReview.risk,
      note: `已提交给 ${approver.name} 审批；预计影响 ${estimatedImpactRows} 行；SQL 指纹 ${approvalTicket.approvedSqlFingerprint}；原因：${changeReason}；${pendingApprovalReview.summary}`,
      sql: pendingApprovalReview.sql,
      ruleHits: compactRuleHits(pendingApprovalReview.ruleHits),
    });

    return true;
  };

  const ruleColumns: ProColumns<RuleHit>[] = [
    { title: "规则编号", dataIndex: "id", width: 120 },
    { title: "规则名称", dataIndex: "name", width: 160 },
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
    { title: "说明", dataIndex: "description" },
  ];

  const queryResultColumns: ProColumns<QueryResultRow>[] =
    queryResult.columns.map((column) => ({
      title: column.title,
      dataIndex: column.dataIndex,
      width: column.width,
      align: column.align,
      ellipsis: true,
    }));

  const reviewConclusion = !review ? (
    <Empty description="输入 SQL 后点击执行审核" />
  ) : (
    <Space direction="vertical" size={12}>
      <Space wrap>
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
        {review.maskingApplied ? (
          <Tag color="cyan">动态脱敏</Tag>
        ) : (
          <Tag>原样返回</Tag>
        )}
      </Space>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="SQL 类型">
          {review.sqlType.toUpperCase()}
        </Descriptions.Item>
        <Descriptions.Item label="目标库">
          <Space size={8} wrap>
            <Text>{review.source.name}</Text>
            <Tag>{sourceTypeLabel[review.source.dbType]}</Tag>
            <Text type="secondary">{review.source.databaseName}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="目标表">
          {review.tableName}
        </Descriptions.Item>
        <Descriptions.Item label="结论">{review.summary}</Descriptions.Item>
        {review.executionWindowCheck && (
          <Descriptions.Item label="执行窗口">
            <Space size={8} wrap>
              <Tag
                color={
                  review.executionWindowCheck.allowed ? "green" : "volcano"
                }
              >
                {review.executionWindowCheck.allowed ? "窗口内" : "窗口外"}
              </Tag>
              <Text>{review.executionWindowCheck.window}</Text>
              <Text type="secondary">
                {review.executionWindowCheck.evaluatedAt}
              </Text>
            </Space>
          </Descriptions.Item>
        )}
        {generatedApprovalTicket && review.decision === "approval" && (
          <Descriptions.Item label="审批单">
            <Space size={8} wrap>
              <Text code>{generatedApprovalTicket.id}</Text>
              <Tag color="blue">审批人：{generatedApprovalTicket.approver}</Tag>
              <Button
                size="small"
                type="link"
                icon={<FileProtectOutlined />}
                onClick={() =>
                  history.push(
                    `/sql-security/approval/list?ticketId=${generatedApprovalTicket.id}`,
                  )
                }
              >
                查看审批单
              </Button>
            </Space>
          </Descriptions.Item>
        )}
        {!generatedApprovalTicket && review.decision === "approval" && (
          <Descriptions.Item label="审批人">
            <Button
              size="small"
              type="primary"
              icon={<FileProtectOutlined />}
              onClick={() => {
                setPendingApprovalReview(review);
                setApprovalModalOpen(true);
              }}
            >
              选择审批人并生成审批单
            </Button>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Space>
  );

  const ruleHitContent = (
    <RKTable<RuleHit>
      rowKey="id"
      size="small"
      columns={ruleColumns}
      dataSource={review?.ruleHits || []}
      pagination={tablePagination}
      search={false}
      options={false}
      locale={{ emptyText: "暂无规则命中" }}
      scroll={{ x: 900 }}
    />
  );

  const queryResultContent =
    queryResult.rows.length === 0 ? (
      <Empty description={queryResult.emptyText} />
    ) : (
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space size={8} wrap>
          <Tag color="blue">{queryResult.sourceName}</Tag>
          <Tag>{queryResult.tableName}</Tag>
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
    );

  const consoleTitle = (
    <Space size={16} wrap>
      <Text strong>SQL 审核工作台</Text>
      <Space size={8} wrap>
        <Switch
          size="small"
          checked={maskingEnabled}
          checkedChildren="脱敏"
          unCheckedChildren="明文"
          disabled={!currentUser.canViewPlain}
          onChange={(checked) => {
            setMaskingEnabled(checked);
            resetReviewState();
          }}
        />
        <Tag color={currentUser.canViewPlain ? "gold" : "cyan"}>
          {currentUser.canViewPlain && !maskingEnabled
            ? "明文视图"
            : "强制脱敏"}
        </Tag>
        <Tag color={currentUser.sensitiveAuditEnabled ? "blue" : "default"}>
          {currentUser.sensitiveAuditEnabled ? "敏感审计" : "普通审计"}
        </Tag>
      </Space>
    </Space>
  );

  return (
    <PageContainer header={{ title: false }}>
      <Flex vertical gap={16}>
        <Card
          title={consoleTitle}
          extra={
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={runReview}
            >
              执行审核
            </Button>
          }
        >
          <ProForm<SqlReviewFormValues>
            formRef={formRef}
            layout="vertical"
            submitter={false}
            initialValues={{ sourceId, sql }}
            onValuesChange={(changedValues) => {
              if (changedValues.sourceId) {
                handleSourceChange(changedValues.sourceId);
              }
              if (Object.prototype.hasOwnProperty.call(changedValues, "sql")) {
                setSql(changedValues.sql || "");
              }
            }}
          >
            <ProFormSelect
              name="sourceId"
              label="目标库"
              options={sourceOptions}
              width="lg"
              fieldProps={{
                allowClear: false,
                optionFilterProp: "label",
                showSearch: true,
              }}
            />
            <ProFormTextArea
              name="sql"
              label="SQL"
              placeholder="请输入需要审核的 SQL"
              fieldProps={{
                autoSize: { minRows: 7, maxRows: 10 },
              }}
            />
          </ProForm>
        </Card>

        <Card>
          <Tabs
            items={[
              {
                key: "review",
                label: "审核结论",
                children: reviewConclusion,
              },
              {
                key: "rules",
                label: `规则命中（${review?.ruleHits.length || 0}）`,
                children: ruleHitContent,
              },
              {
                key: "results",
                label: `查询结果（${queryResult.rows.length}）`,
                children: queryResultContent,
              },
            ]}
          />
        </Card>
      </Flex>

      <ModalForm<ApprovalTicketFormValues>
        key={pendingApprovalReview?.id || "approval-ticket"}
        title="生成 DML 审批单"
        width={640}
        open={approvalModalOpen}
        initialValues={{
          changeReasonCategory: "生产数据修正",
          estimatedImpactRows: getSuggestedImpactRows(pendingApprovalReview),
          rollbackPlan: getDefaultRollbackPlan(pendingApprovalReview),
        }}
        onOpenChange={setApprovalModalOpen}
        modalProps={{
          destroyOnHidden: true,
          maskClosable: false,
        }}
        submitter={{
          searchConfig: {
            submitText: "生成审批单",
            resetText: "取消",
          },
        }}
        onFinish={submitApprovalTicket}
      >
        <ProFormSelect
          name="approverId"
          label="审批人"
          options={approvalUserOptions}
          fieldProps={{
            optionFilterProp: "label",
            showSearch: true,
          }}
          rules={[{ required: true, message: "请选择审批人" }]}
        />
        <ProFormSelect
          name="changeReasonCategory"
          label="变更原因类别"
          options={changeReasonCategoryOptions}
          fieldProps={{
            optionFilterProp: "label",
            showSearch: true,
          }}
          rules={[{ required: true, message: "请选择变更原因类别" }]}
        />
        <ProFormTextArea
          name="changeReason"
          label="变更原因"
          placeholder="说明业务背景、工单来源或修正目标"
          fieldProps={{
            autoSize: { minRows: 2, maxRows: 4 },
            maxLength: 200,
            showCount: true,
          }}
          rules={[{ required: true, message: "请输入变更原因" }]}
        />
        <ProFormDigit
          name="estimatedImpactRows"
          label="预计影响行数"
          min={1}
          max={1000000}
          fieldProps={{ precision: 0 }}
          rules={[{ required: true, message: "请输入预计影响行数" }]}
        />
        <ProFormTextArea
          name="rollbackPlan"
          label="回滚方案"
          placeholder="填写回滚 SQL、备份恢复方式或明确的撤销步骤"
          fieldProps={{
            autoSize: { minRows: 3, maxRows: 6 },
            maxLength: 500,
            showCount: true,
          }}
          rules={[{ required: true, message: "请输入回滚方案" }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default Console;
