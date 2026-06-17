import { PageContainer, type ProColumns } from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import { Tag, Typography } from "antd";
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
      ellipsis: true,
      render: (_, record) => <Text code>{record.sql}</Text>,
    },
    {
      title: "影响行数",
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
      title: "回滚方案",
      dataIndex: "rollbackStatus",
      width: 100,
      render: (_, record) => (
        <Tag color={record.rollbackStatus === "已登记" ? "blue" : "default"}>
          {record.rollbackStatus}
        </Tag>
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
        scroll={{ x: 1400 }}
      />
    </PageContainer>
  );
};

export default Executions;
