import { PageContainer, type ProColumns } from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import { Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import {
  readExecutionRecords,
  subscribeExecutionRecords,
  type ExecutionRecord,
} from "../../executionStore";
import { tablePagination } from "../../tablePagination";

const { Text } = Typography;

const Executions = () => {
  const [records, setRecords] =
    useState<ExecutionRecord[]>(readExecutionRecords);

  useEffect(
    () =>
      subscribeExecutionRecords(() => {
        setRecords(readExecutionRecords());
      }),
    [],
  );

  const columns: ProColumns<ExecutionRecord>[] = [
    { title: "执行记录", dataIndex: "id", width: 120 },
    { title: "审批单", dataIndex: "ticketId", width: 130 },
    { title: "执行时间", dataIndex: "executedAt", width: 170 },
    { title: "执行人", dataIndex: "executor", width: 140 },
    { title: "数据源", dataIndex: "source", width: 220, ellipsis: true },
    {
      title: "SQL",
      dataIndex: "sql",
      // width: 300,
      // ellipsis: true,
      render: (_, record) => <Text code>{record.sql}</Text>,
    },
    {
      title: "变更原因",
      dataIndex: "changeReason",
      width: 260,
      ellipsis: true,
      render: (_, record) =>
        record.changeReason || <Text type="secondary">-</Text>,
    },
    {
      title: "审批预估",
      dataIndex: "estimatedImpactRows",
      width: 100,
      align: "right",
      render: (_, record) =>
        typeof record.estimatedImpactRows === "number"
          ? record.estimatedImpactRows
          : "-",
    },
    {
      title: "实际影响",
      dataIndex: "affectedRows",
      width: 100,
      align: "right",
    },
    {
      title: "结果",
      dataIndex: "result",
      width: 100,
      render: (_, record) => <Tag color="green">{record.result}</Tag>,
    },
    {
      title: "回滚状态",
      dataIndex: "rollbackStatus",
      width: 100,
      render: (_, record) => (
        <Tag color={record.rollbackStatus === "已登记" ? "blue" : "default"}>
          {record.rollbackStatus}
        </Tag>
      ),
    },
    {
      title: "回滚方案",
      dataIndex: "rollbackPlan",
      width: 280,
      ellipsis: true,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.rollbackPlan || <Text type="secondary">-</Text>}
        </Space>
      ),
    },
    {
      title: "SQL 指纹",
      dataIndex: "approvedSqlFingerprint",
      width: 150,
      render: (_, record) =>
        record.approvedSqlFingerprint ? (
          <Text code>{record.approvedSqlFingerprint}</Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  return (
    <PageContainer header={{ title: false }}>
      <RKTable<ExecutionRecord>
        rowKey="id"
        headerTitle="执行列表"
        size="small"
        columns={columns}
        dataSource={records}
        pagination={tablePagination}
        search={false}
        options={false}
        locale={{ emptyText: "审批通过并执行后，这里会生成执行记录" }}
        scroll={{ x: "max-content" }}
      />
    </PageContainer>
  );
};

export default Executions;
