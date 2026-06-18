import {
  PageContainer,
  type ProColumns,
} from "@ant-design/pro-components";
import { RKTable } from "@rklink/components";
import {
  Button,
  Card,
  Col,
  Flex,
  Row,
  Statistic,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import {
  readAuditLogs,
  resetAuditLogs,
  subscribeAuditLogs,
} from "../auditStore";
import { riskMeta, type AuditLog } from "../mock";
import { tablePagination } from "../tablePagination";

const { Text } = Typography;

type DemoResetHooks = {
  resetAuditLogs?: () => void;
};

type DemoWindow = Window & {
  __RKLINK_SQL_SECURITY_DEMO__?: DemoResetHooks;
};

const Audit = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => readAuditLogs());

  useEffect(() => {
    return subscribeAuditLogs(() => {
      setAuditLogs(readAuditLogs());
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const demoWindow = window as DemoWindow;
    const resetDemoAuditLogs = () => {
      resetAuditLogs();
      setAuditLogs(readAuditLogs());
    };

    demoWindow.__RKLINK_SQL_SECURITY_DEMO__ = {
      ...demoWindow.__RKLINK_SQL_SECURITY_DEMO__,
      resetAuditLogs: resetDemoAuditLogs,
    };

    return () => {
      if (
        demoWindow.__RKLINK_SQL_SECURITY_DEMO__?.resetAuditLogs ===
        resetDemoAuditLogs
      ) {
        delete demoWindow.__RKLINK_SQL_SECURITY_DEMO__.resetAuditLogs;
      }
    };
  }, []);

  const refreshLogs = () => {
    setAuditLogs(readAuditLogs());
  };

  const columns: ProColumns<AuditLog>[] = [
    { title: "时间", dataIndex: "time", width: 170 },
    { title: "模块", dataIndex: "module", width: 120 },
    { title: "动作", dataIndex: "action", width: 120 },
    { title: "用户", dataIndex: "user", width: 150 },
    { title: "数据源", dataIndex: "source", width: 220, ellipsis: true },
    { title: "类型", dataIndex: "sqlType", width: 90 },
    { title: "处置", dataIndex: "decision", width: 110 },
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
    { title: "IP", dataIndex: "ip", width: 120 },
    { title: "请求号", dataIndex: "requestId", width: 140 },
    { title: "说明", dataIndex: "note", width: 260, ellipsis: true },
    {
      title: "SQL 摘要",
      dataIndex: "sql",
      width: 280,
      ellipsis: true,
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
      <Flex vertical gap={16}>
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="审计事件" value={auditLogs.length} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="严重风险"
                value={
                  auditLogs.filter((item) => item.risk === "critical").length
                }
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="审批事件"
                value={
                  auditLogs.filter((item) => item.module === "DML审批").length
                }
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic
                title="脱敏事件"
                value={
                  auditLogs.filter((item) => item.note.includes("脱敏")).length
                }
              />
            </Card>
          </Col>
        </Row>

        <Card
          title="审计事件列表"
          extra={<Button onClick={refreshLogs}>刷新</Button>}
        >
          <RKTable<AuditLog>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={auditLogs}
            pagination={tablePagination}
            search={false}
            options={false}
            scroll={{ x: "max-content" }}
          />
        </Card>
      </Flex>
    </PageContainer>
  );
};

export default Audit;
