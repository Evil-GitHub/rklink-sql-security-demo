import {
  AuditOutlined,
  ClusterOutlined,
  DatabaseOutlined,
  FileProtectOutlined,
  FileSearchOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { PageContainer, ProCard } from "@ant-design/pro-components";
import { history } from "@umijs/max";
import { Button, Space, Statistic, Typography } from "antd";
import {
  assetCatalog,
  dataSources,
  ruleStrategies,
  sensitiveCatalog,
} from "./mock";
import "./index.less";

const { Text } = Typography;

const metricCards = [
  {
    title: "接入数据源",
    value: dataSources.length,
    icon: <DatabaseOutlined />,
    description: "生产连接统一纳管",
    tone: "cyan",
  },
  {
    title: "资产表",
    value: assetCatalog.length,
    suffix: "张",
    icon: <ClusterOutlined />,
    description: "核心业务表目录",
    tone: "blue",
  },
  {
    title: "敏感字段",
    value: sensitiveCatalog.length,
    suffix: "类",
    icon: <LockOutlined />,
    description: "脱敏规则已启用",
    tone: "gold",
  },
  {
    title: "规则策略",
    value: ruleStrategies.length,
    suffix: "条",
    icon: <SafetyCertificateOutlined />,
    description: "跨数据库审核策略",
    tone: "green",
  },
];

const moduleCards = [
  {
    title: "SQL 审核工作台",
    description:
      "输入 SQL 后完成类型识别、权限校验、风险定级、审批或阻断决策。",
    icon: <SafetyCertificateOutlined />,
    path: "/sql-security/console",
    tone: "cyan",
  },
  {
    title: "SQL 样例库",
    description: "集中维护演示 SQL，复制后到工作台审核执行。",
    icon: <FileSearchOutlined />,
    path: "/sql-security/sql-templates",
    tone: "blue",
  },
  {
    title: "数据库管理",
    description: "分开管理数据库连接、连通性检测与 JDBC 驱动下载。",
    icon: <DatabaseOutlined />,
    path: "/database/connections",
    tone: "green",
  },
  {
    title: "数据资产与脱敏",
    description: "展示生产资产目录、敏感字段识别和脱敏规则。",
    icon: <ClusterOutlined />,
    path: "/data-security/assets",
    tone: "gold",
  },
  {
    title: "用户管理",
    description: "维护演示账号、组织岗位、锁定状态和角色成员基础信息。",
    icon: <UserOutlined />,
    path: "/data-security/users",
    tone: "purple",
  },
  {
    title: "权限分配",
    description: "配置用户目标库、操作范围和是否允许查看原始数据。",
    icon: <UserSwitchOutlined />,
    path: "/data-security/permissions",
    tone: "gray",
  },
  {
    title: "SQL 规则策略",
    description: "查看内置规则库、演示 SQL 场景和处置策略。",
    icon: <LockOutlined />,
    path: "/data-security/rules",
    tone: "red",
  },
  {
    title: "DML 审批",
    description: "模拟审批通过、驳回、申请人执行与状态流转。",
    icon: <FileProtectOutlined />,
    path: "/sql-security/approval/list",
    tone: "orange",
  },
  {
    title: "审计日志",
    description: "追溯 SQL 执行、规则命中、审批意见、脱敏状态和风险事件。",
    icon: <AuditOutlined />,
    path: "/sql-security/audit",
    tone: "gray",
  },
];

const Overview = () => {
  return (
    <PageContainer header={{ title: false }}>
      <ProCard
        className="sql-security-overview"
        ghost
        direction="column"
        gutter={[0, 16]}
      >
        <ProCard ghost gutter={[16, 0]} wrap>
          {metricCards.map((metric) => (
            <ProCard
              key={metric.title}
              className="overview-metric-card"
              colSpan={{ xs: 12, lg: 6 }}
            >
              <div className="overview-metric-content">
                <span className={`overview-icon overview-icon-${metric.tone}`}>
                  {metric.icon}
                </span>
                <Statistic
                  title={metric.title}
                  value={metric.value}
                  suffix={metric.suffix}
                />
                <Text className="overview-metric-desc" type="secondary">
                  {metric.description}
                </Text>
              </div>
            </ProCard>
          ))}
        </ProCard>

        <ProCard ghost gutter={[16, 16]} wrap>
          {moduleCards.map((module) => (
            <ProCard
              key={module.title}
              className="overview-module-card"
              colSpan={{ xs: 24, md: 12, xl: 8 }}
              hoverable
            >
              <Space className="overview-module-head" align="start" size={12}>
                <span className={`overview-icon overview-icon-${module.tone}`}>
                  {module.icon}
                </span>
                <Space direction="vertical" size={4}>
                  <Text className="overview-module-title">{module.title}</Text>
                  <Text className="overview-module-desc" type="secondary">
                    {module.description}
                  </Text>
                </Space>
              </Space>
              <Button
                className="overview-module-action"
                type="link"
                onClick={() => history.push(module.path)}
              >
                进入模块
              </Button>
            </ProCard>
          ))}
        </ProCard>
      </ProCard>
    </PageContainer>
  );
};

export default Overview;
