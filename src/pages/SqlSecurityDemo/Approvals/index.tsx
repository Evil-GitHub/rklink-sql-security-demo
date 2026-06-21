import { PageContainer, type ProColumns } from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import { useLocation } from "@umijs/max";
import { App, Button, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  readApprovalTickets,
  subscribeApprovalTickets,
  writeApprovalTickets,
} from "../approvalStore";
import { appendAuditLog } from "../auditStore";
import { useCurrentDemoUserId } from "../currentUserStore";
import { appendExecutionRecord } from "../executionStore";
import {
  buildExecutionWindowRuleHit,
  buildSqlFingerprint,
  compactRuleHits,
  createId,
  isRuleStrategyEnabled,
  riskMeta,
  ticketStatusMeta,
  validateExecutionWindow,
  type ApprovalTicket,
  type TicketStatus,
} from "../mock";
import { readDemoUsersWithPermissions } from "../permissionStore";
import {
  getAccessRecordByPermissionCodes,
  getUserPermissionCodes,
} from "../routePermissions";
import { tablePagination } from "../tablePagination";

const { Text } = Typography;

type ApprovalStatusFilter = TicketStatus | "all";

const approvalStatusLabels: Record<ApprovalStatusFilter, string> = {
  all: "全部",
  pending: "待审批",
  approved: "已通过",
  rejected: "已驳回",
  executed: "已执行",
};

const approvalStatusFilters: ApprovalStatusFilter[] = [
  "all",
  "pending",
  "approved",
  "rejected",
  "executed",
];

const renderTicketChangeContext = (ticket: ApprovalTicket) => (
  <Space direction="vertical" size={0}>
    <Space size={4} wrap>
      {ticket.changeReasonCategory ? (
        <Tag color="blue">{ticket.changeReasonCategory}</Tag>
      ) : (
        <Text type="secondary">未填写</Text>
      )}
      {typeof ticket.estimatedImpactRows === "number" && (
        <Tag>{ticket.estimatedImpactRows} 行</Tag>
      )}
    </Space>
    <Text type="secondary" ellipsis>
      {ticket.changeReason || "-"}
    </Text>
  </Space>
);

const Approvals = () => {
  const { message } = App.useApp();
  const location = useLocation();
  const currentUserId = useCurrentDemoUserId();
  const users = useMemo(() => readDemoUsersWithPermissions(), []);
  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) || users[0],
    [currentUserId, users],
  );
  const currentUserCanApprove = Boolean(
    getAccessRecordByPermissionCodes(getUserPermissionCodes(currentUser))[
      "approval:update"
    ],
  );
  const [tickets, setTickets] = useState<ApprovalTicket[]>(readApprovalTickets);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatusFilter>("all");
  const highlightTicketId = useMemo(
    () => new URLSearchParams(location.search).get("ticketId") || undefined,
    [location.search],
  );
  const approvalListTitle = highlightTicketId ? (
    <Space size={8} wrap>
      <span>审批单列表</span>
      <Tag color="blue">当前：{highlightTicketId}</Tag>
    </Space>
  ) : (
    "审批单列表"
  );
  const filteredTickets = useMemo(
    () =>
      statusFilter === "all"
        ? tickets
        : tickets.filter((ticket) => ticket.status === statusFilter),
    [statusFilter, tickets],
  );
  const approvalStatusTabItems = useMemo(
    () =>
      approvalStatusFilters.map((status) => ({
        key: status,
        label: `${approvalStatusLabels[status]}（${
          status === "all"
            ? tickets.length
            : tickets.filter((ticket) => ticket.status === status).length
        }）`,
      })),
    [tickets],
  );

  useEffect(
    () =>
      subscribeApprovalTickets(() => {
        setTickets(readApprovalTickets());
      }),
    [],
  );

  const isTicketApplicant = (ticket: ApprovalTicket) =>
    ticket.applicantId
      ? ticket.applicantId === currentUser.id
      : ticket.applicant === currentUser.name;

  const canApproveTicket = (ticket: ApprovalTicket) =>
    currentUserCanApprove &&
    (!ticket.approverId || ticket.approverId === currentUser.id);

  const canExecuteTicket = (ticket: ApprovalTicket) =>
    ticket.status === "approved" && isTicketApplicant(ticket);

  const remindTicket = (ticket: ApprovalTicket) => {
    if (!ticket.approver) {
      message.warning("审批单未指定审批人");
      return;
    }

    appendAuditLog({
      module: "DML审批",
      action: "审批催办",
      user: currentUser.name,
      source: ticket.review.source.name,
      sqlType: ticket.review.sqlType.toUpperCase(),
      decision: ticketStatusMeta[ticket.status].text,
      risk: ticket.review.risk,
      note: `已催办 ${ticket.approver} 处理审批单 ${ticket.id}。`,
      sql: ticket.review.sql,
      ruleHits: compactRuleHits(ticket.review.ruleHits),
    });
    message.success(`已催办 ${ticket.approver}`);
  };

  const updateTicket = (
    ticketId: string,
    status: TicketStatus,
    opinion: string,
  ) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (ticket && !canApproveTicket(ticket)) {
      message.warning("当前账号不是该审批单的审批人");
      return;
    }

    const nextTickets = tickets.map((ticket) =>
      ticket.id === ticketId
        ? {
            ...ticket,
            status,
            approverId: ticket.approverId || currentUser.id,
            approver: ticket.approver || currentUser.name,
            opinion,
          }
        : ticket,
    );

    setTickets(nextTickets);
    writeApprovalTickets(nextTickets);

    if (ticket) {
      appendAuditLog({
        module: "DML审批",
        action:
          status === "approved"
            ? "审批通过"
            : status === "rejected"
            ? "审批驳回"
            : "审批状态更新",
        user: currentUser.name,
        source: ticket.review.source.name,
        sqlType: ticket.review.sqlType.toUpperCase(),
        decision: ticketStatusMeta[status].text,
        risk: ticket.review.risk,
        note: opinion,
        sql: ticket.review.sql,
        ruleHits: compactRuleHits(ticket.review.ruleHits),
      });
    }
  };

  const executeTicket = (ticketId: string) => {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) return;
    if (!canExecuteTicket(ticket)) {
      message.warning("当前账号不是该审批单的申请人");
      return;
    }
    const currentSqlFingerprint = buildSqlFingerprint(ticket.review.sql);
    const approvedSqlFingerprint =
      ticket.approvedSqlFingerprint || currentSqlFingerprint;

    if (approvedSqlFingerprint !== currentSqlFingerprint) {
      appendAuditLog({
        module: "DML审批",
        action: "执行前校验失败",
        user: currentUser.name,
        source: ticket.review.source.name,
        sqlType: ticket.review.sqlType.toUpperCase(),
        decision: "阻断",
        risk: "critical",
        note: `审批单 ${ticketId} SQL 指纹不一致，审批指纹 ${approvedSqlFingerprint}，当前指纹 ${currentSqlFingerprint}。`,
        sql: ticket.review.sql,
        ruleHits: compactRuleHits(ticket.review.ruleHits),
      });
      message.error("执行前 SQL 指纹校验失败，已阻断执行");
      return;
    }

    const executionWindowCheck = validateExecutionWindow(
      currentUser,
      ticket.review.sqlType,
    );
    if (
      executionWindowCheck.checked &&
      !executionWindowCheck.allowed &&
      isRuleStrategyEnabled("R-COM-026")
    ) {
      const windowRuleHit = buildExecutionWindowRuleHit(executionWindowCheck);

      appendAuditLog({
        module: "DML审批",
        action: "执行窗口阻断",
        user: currentUser.name,
        source: ticket.review.source.name,
        sqlType: ticket.review.sqlType.toUpperCase(),
        decision: "阻断",
        risk: "critical",
        note: `审批单 ${ticketId} 执行前窗口校验失败：${windowRuleHit.description}`,
        sql: ticket.review.sql,
        ruleHits: [windowRuleHit],
      });
      message.error("当前不在授权执行窗口内，已阻断执行");
      return;
    }

    const affectedRows =
      ticket.estimatedImpactRows || (ticket.review.risk === "high" ? 128 : 1);

    const nextTickets = tickets.map((item) =>
      item.id === ticketId
        ? {
            ...item,
            status: "executed" as TicketStatus,
            opinion: `审批通过后执行前 SQL 指纹校验一致（${currentSqlFingerprint}），DML 已执行。`,
          }
        : item,
    );
    setTickets(nextTickets);
    writeApprovalTickets(nextTickets);

    appendExecutionRecord({
      id: createId("EXE"),
      ticketId,
      executedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      executor: currentUser.name,
      source: ticket.review.source.name,
      sql: ticket.review.sql,
      affectedRows,
      result: "执行成功",
      rollbackStatus: ticket.rollbackPlan ? "已登记" : "无需回滚",
      changeReason: ticket.changeReason,
      estimatedImpactRows: ticket.estimatedImpactRows,
      rollbackPlan: ticket.rollbackPlan,
      approvedSqlFingerprint: currentSqlFingerprint,
    });
    appendAuditLog({
      module: "DML审批",
      action: "DML执行",
      user: currentUser.name,
      source: ticket.review.source.name,
      sqlType: ticket.review.sqlType.toUpperCase(),
      decision: "执行成功",
      risk: ticket.review.risk,
      note: `审批单 ${ticketId} 已执行，SQL 指纹 ${currentSqlFingerprint}，影响行数 ${affectedRows}，回滚方案${
        ticket.rollbackPlan ? "已登记" : "无需登记"
      }。`,
      sql: ticket.review.sql,
      ruleHits: compactRuleHits(ticket.review.ruleHits),
    });
    message.success("DML 已执行并写入审计日志");
  };

  const columns: ProColumns<ApprovalTicket>[] = [
    { title: "审批单", dataIndex: "id", width: 180 },
    { title: "申请人", dataIndex: "applicant", width: 150 },
    {
      title: "处理人",
      dataIndex: "approver",
      width: 150,
      render: (_, record) =>
        record.approver || <Text type="secondary">未指定</Text>,
    },
    {
      title: "处理进度",
      dataIndex: "approver",
      width: 210,
      ellipsis: true,
      render: (_, record) => {
        if (record.status === "pending") {
          return `待 ${record.approver || "指定审批人"} 处理`;
        }
        if (record.status === "approved") {
          return `审批通过，待 ${record.applicant} 执行`;
        }
        return ticketStatusMeta[record.status].text;
      },
    },
    { title: "创建时间", dataIndex: "createdAt", width: 170 },
    {
      title: "SQL 摘要",
      dataIndex: ["review", "sql"],
      width: 300,
      ellipsis: true,
      render: (_, record) => <Text code>{record.review.sql}</Text>,
    },
    {
      title: "变更说明",
      dataIndex: "changeReason",
      width: 280,
      ellipsis: true,
      render: (_, record) => renderTicketChangeContext(record),
    },
    {
      title: "回滚方案",
      dataIndex: "rollbackPlan",
      width: 260,
      ellipsis: true,
      render: (_, record) =>
        record.rollbackPlan || <Text type="secondary">-</Text>,
    },
    {
      title: "SQL 指纹",
      dataIndex: "approvedSqlFingerprint",
      width: 150,
      render: (_, record) => (
        <Text code>
          {record.approvedSqlFingerprint ||
            buildSqlFingerprint(record.review.sql)}
        </Text>
      ),
    },
    {
      title: "风险",
      dataIndex: ["review", "risk"],
      width: 100,
      render: (_, record) => (
        <Tag color={riskMeta[record.review.risk].color}>
          {riskMeta[record.review.risk].text}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_, record) => (
        <Tag color={ticketStatusMeta[record.status].color}>
          {ticketStatusMeta[record.status].text}
        </Tag>
      ),
    },
    { title: "审批意见", dataIndex: "opinion", width: 220, ellipsis: true },
    {
      title: "操作",
      key: "action",
      width: 190,
      fixed: "right",
      render: (_, ticket) => (
        <Space size={4}>
          {ticket.status === "pending" && canApproveTicket(ticket) && (
            <>
              <Button
                size="small"
                type="link"
                onClick={() =>
                  updateTicket(ticket.id, "approved", "风险可控，同意执行。")
                }
              >
                通过
              </Button>
              <Button
                size="small"
                type="link"
                danger
                onClick={() =>
                  updateTicket(ticket.id, "rejected", "变更原因不足，驳回。")
                }
              >
                驳回
              </Button>
            </>
          )}
          {ticket.status === "pending" && !canApproveTicket(ticket) && (
            <Button
              size="small"
              type="link"
              onClick={() => remindTicket(ticket)}
            >
              催办
            </Button>
          )}
          {ticket.status === "approved" && canExecuteTicket(ticket) && (
            <Button
              size="small"
              type="link"
              onClick={() => executeTicket(ticket.id)}
            >
              执行
            </Button>
          )}
          {ticket.status === "approved" && !canExecuteTicket(ticket) && (
            <Text type="secondary">无</Text>
          )}
          {ticket.status !== "pending" && ticket.status !== "approved" && (
            <Text type="secondary">无</Text>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <RKTable<ApprovalTicket>
        rowKey="id"
        headerTitle={approvalListTitle}
        size="small"
        columns={columns}
        dataSource={filteredTickets}
        pagination={tablePagination}
        search={false}
        options={false}
        scroll={{ x: "max-content" }}
        toolbar={{
          menu: {
            type: "tab",
            activeKey: statusFilter,
            items: approvalStatusTabItems,
            onChange: (activeKey) =>
              setStatusFilter((activeKey || "all") as ApprovalStatusFilter),
          },
        }}
      />
    </PageContainer>
  );
};

export default Approvals;
