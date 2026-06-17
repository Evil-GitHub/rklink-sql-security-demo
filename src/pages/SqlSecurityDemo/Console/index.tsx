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
  buildQueryResultPreview,
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

const getDefaultMaskingEnabled = (user: {
  canViewPlain: boolean;
  maskingDefault: boolean;
}) => !user.canViewPlain || user.maskingDefault;

const emptyQueryResult: QueryResultPreview = {
  tableName: "-",
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
    if (!sql.trim()) {
      message.warning("请输入 SQL");
      return;
    }

    const nextReview = analyzeSql(
      sql,
      currentSource,
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
        source: currentSource.name,
        sqlType: nextReview.sqlType.toUpperCase(),
        decision: decisionMeta[nextReview.decision].text,
        risk: nextReview.risk,
        note: nextReview.summary,
        sql: nextReview.sql,
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
        source: currentSource.name,
        sqlType: nextReview.sqlType.toUpperCase(),
        decision: decisionMeta[nextReview.decision].text,
        risk: nextReview.risk,
        note: nextReview.summary,
        sql: nextReview.sql,
      });
    }
  };

  const submitApprovalTicket = async (values: { approverId?: string }) => {
    if (!pendingApprovalReview) return false;

    const approver = users.find((user) => user.id === values.approverId);
    if (!approver) {
      message.warning("请选择审批人");
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
      source: currentSource.name,
      sqlType: pendingApprovalReview.sqlType.toUpperCase(),
      decision: decisionMeta[pendingApprovalReview.decision].text,
      risk: pendingApprovalReview.risk,
      note: `已提交给 ${approver.name} 审批；${pendingApprovalReview.summary}`,
      sql: pendingApprovalReview.sql,
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
        <Descriptions.Item label="目标库表">
          {review.tableName}
        </Descriptions.Item>
        <Descriptions.Item label="结论">{review.summary}</Descriptions.Item>
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

      <ModalForm<{ approverId: string }>
        title="选择审批人"
        width={520}
        open={approvalModalOpen}
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
      </ModalForm>
    </PageContainer>
  );
};

export default Console;
