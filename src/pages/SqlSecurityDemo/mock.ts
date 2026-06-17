export type DbKind = "mysql" | "oracle" | "gaussdb" | "db2";
export type SqlType = "select" | "insert" | "update" | "delete" | "unknown";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Decision = "pass" | "approval" | "blocked";
export type RuleAction = "放行" | "提示" | "脱敏" | "审批" | "阻断";
export type TicketStatus = "pending" | "approved" | "rejected" | "executed";
export type ConnectionStatus = "online" | "warning" | "offline";
export type DriverStatus = "downloaded" | "available" | "upgrade";
export type PlatformFunction =
  | "overview"
  | "console"
  | "sqlTemplates"
  | "database"
  | "assets"
  | "permissions"
  | "rules"
  | "approval"
  | "audit";

export type DatabaseDriverPackage = {
  id: string;
  dbType: DbKind;
  name: string;
  version: string;
  driverIdentifier: string;
  driverClassName: string;
  originalFileName: string;
  fileName: string;
  size: string;
  vendor: string;
  license: string;
  checksum: string;
  compatibleVersions: string;
  builtIn: boolean;
  defaultDriver: boolean;
  status: DriverStatus;
  releaseDate: string;
  dialect: string;
  downloadUrl: string;
};

export type DemoDataSource = {
  id: string;
  name: string;
  dbType: DbKind;
  environment: "生产" | "测试" | "开发";
  connectionMode: "HOST_PORT" | "URL";
  clusterEnabled: boolean;
  automaticScanning: boolean;
  databaseName: string;
  host: string;
  jdbcUrl: string;
  username: string;
  driverId: string;
  connectionStatus: ConnectionStatus;
  lastTestAt: string;
  accountPolicy: string;
  dialect: string;
  schemas: string[];
  authorizedTables: string[];
  owner: string;
  schemaCount: number;
  tableCount: number;
  sensitiveLevel: "低" | "中" | "高";
};

export type DemoUser = {
  id: string;
  account: string;
  name: string;
  department: string;
  employeeNo: string;
  position: string;
  role: string;
  status: "在职" | "锁定";
  lastLoginAt: string;
  platformPermissions: PlatformFunction[];
  dataScope: string;
  fieldScope: string;
  maskingDefault: boolean;
  canViewPlain: boolean;
  sensitiveAuditEnabled: boolean;
  exportApprovalRequired: boolean;
  dmlApprovalMode: string;
  resultLimit: number;
  executionWindow: string;
  allowedSources: string[];
  operations: SqlType[];
};

export type RuleHit = {
  id: string;
  name: string;
  risk: RiskLevel;
  action: RuleAction;
  description: string;
};

export type RuleStrategyScope = 'common' | DbKind;
export type RuleStrategyStatus = '启用' | '观察' | '停用';

export type RuleStrategy = {
  id: string;
  scope: RuleStrategyScope;
  name: string;
  category: string;
  sqlTypes: string;
  trigger: string;
  risk: RiskLevel;
  action: RuleAction;
  priority: number;
  status: RuleStrategyStatus;
  description: string;
};

export type ReviewResult = {
  id: string;
  sql: string;
  sqlType: SqlType;
  source: DemoDataSource;
  user: DemoUser;
  tableName: string;
  decision: Decision;
  risk: RiskLevel;
  score: number;
  ruleHits: RuleHit[];
  maskingApplied: boolean;
  summary: string;
};

export type CustomerRow = {
  id: number;
  name: string;
  idCard: string;
  mobile: string;
  address: string;
  accountBalance: string;
  owner: string;
};

export type QueryResultValue = string | number;

export type QueryResultRow = Record<string, QueryResultValue>;

export type QueryResultColumn = {
  title: string;
  dataIndex: string;
  width?: number;
  align?: "left" | "right" | "center";
};

export type QueryResultPreview = {
  tableName: string;
  columns: QueryResultColumn[];
  rows: QueryResultRow[];
  emptyText: string;
};

export type ApprovalTicket = {
  id: string;
  review: ReviewResult;
  status: TicketStatus;
  applicant: string;
  applicantId?: string;
  createdAt: string;
  approverId?: string;
  approver?: string;
  opinion?: string;
};

export type AuditLog = {
  id: string;
  time: string;
  module?: string;
  action?: string;
  user: string;
  source: string;
  sqlType: string;
  decision: string;
  risk: RiskLevel;
  note: string;
  ip?: string;
  requestId?: string;
  sql?: string;
};

export type AssetCatalogRow = {
  key: string;
  domain: string;
  source: string;
  dbType: DbKind;
  schema: string;
  tableName: string;
  rows: string;
  sensitivity: "低" | "中" | "高";
  owner: string;
};

export type SensitiveCatalogRow = {
  key: string;
  field: string;
  type: string;
  level: "一般" | "重要" | "核心";
  maskRule: string;
  example: string;
  status: "启用" | "待确认";
};

export const sourceTypeLabel: Record<DbKind, string> = {
  mysql: "MySQL",
  oracle: "Oracle",
  gaussdb: "GaussDB",
  db2: "DB2",
};

export const riskMeta: Record<RiskLevel, { text: string; color: string }> = {
  low: { text: "低风险", color: "green" },
  medium: { text: "中风险", color: "gold" },
  high: { text: "高风险", color: "orange" },
  critical: { text: "严重风险", color: "red" },
};

export const decisionMeta: Record<Decision, { text: string; color: string }> = {
  pass: { text: "放行执行", color: "green" },
  approval: { text: "进入审批", color: "gold" },
  blocked: { text: "直接阻断", color: "red" },
};

export const ticketStatusMeta: Record<
  TicketStatus,
  { text: string; color: string }
> = {
  pending: { text: "待审批", color: "gold" },
  approved: { text: "已通过", color: "green" },
  rejected: { text: "已驳回", color: "red" },
  executed: { text: "已执行", color: "blue" },
};

export const connectionStatusMeta: Record<
  ConnectionStatus,
  { text: string; color: string }
> = {
  online: { text: "连通", color: "green" },
  warning: { text: "需复核", color: "gold" },
  offline: { text: "断开", color: "red" },
};

export const driverStatusMeta: Record<
  DriverStatus,
  { text: string; color: string }
> = {
  downloaded: { text: "已下载", color: "green" },
  available: { text: "可下载", color: "blue" },
  upgrade: { text: "有更新", color: "gold" },
};

export const platformFunctionLabel: Record<PlatformFunction, string> = {
  overview: "总览",
  console: "SQL审核",
  sqlTemplates: "SQL样例",
  database: "数据库管理",
  assets: "资产脱敏",
  permissions: "权限分配",
  rules: "规则策略",
  approval: "DML审批",
  audit: "审计日志",
};

export const driverPackages: DatabaseDriverPackage[] = [
  {
    id: "driver-mysql-8033",
    dbType: "mysql",
    name: "MySQL Connector/J",
    version: "8.0.33",
    driverIdentifier: "mysql-connector-j",
    driverClassName: "com.mysql.cj.jdbc.Driver",
    originalFileName: "mysql-connector-j-8.0.33.jar",
    fileName: "mysql-connector-j-8.0.33.jar",
    size: "2.4 MB",
    vendor: "Oracle",
    license: "GPLv2 + FOSS Exception",
    checksum: "SHA256: 6b31c6e2e9d2",
    compatibleVersions: "MySQL 5.7 / 8.0",
    builtIn: true,
    defaultDriver: true,
    status: "downloaded",
    releaseDate: "2026-05-18",
    dialect: "LIMIT 分页，反引号对象名",
    downloadUrl: "/mock-downloads/mysql-connector-j-8.0.33.jar",
  },
  {
    id: "driver-oracle-2310",
    dbType: "oracle",
    name: "Oracle JDBC Driver",
    version: "23.1.0.0",
    driverIdentifier: "oracle-ojdbc11",
    driverClassName: "oracle.jdbc.OracleDriver",
    originalFileName: "ojdbc11-23.1.0.0.jar",
    fileName: "ojdbc11-23.1.0.0.jar",
    size: "6.8 MB",
    vendor: "Oracle",
    license: "OTN",
    checksum: "SHA256: bf98a45e7c13",
    compatibleVersions: "Oracle 11g / 12c / 19c / 23c",
    builtIn: true,
    defaultDriver: true,
    status: "available",
    releaseDate: "2026-04-30",
    dialect: "ROWNUM / FETCH FIRST 分页",
    downloadUrl: "/mock-downloads/ojdbc11-23.1.0.0.jar",
  },
  {
    id: "driver-gaussdb-510",
    dbType: "gaussdb",
    name: "GaussDB JDBC Driver",
    version: "5.1.0",
    driverIdentifier: "gaussdb-jdbc",
    driverClassName: "com.huawei.gaussdb.jdbc.Driver",
    originalFileName: "gaussdb-jdbc-5.1.0.jar",
    fileName: "gaussdb-jdbc-5.1.0.jar",
    size: "1.2 MB",
    vendor: "Huawei",
    license: "Commercial",
    checksum: "SHA256: 57d16fe8238a",
    compatibleVersions: "GaussDB 3.x / 5.x",
    builtIn: true,
    defaultDriver: true,
    status: "downloaded",
    releaseDate: "2026-05-20",
    dialect: "兼容 PostgreSQL，双引号对象名",
    downloadUrl: "/mock-downloads/gaussdb-jdbc-5.1.0.jar",
  },
  {
    id: "driver-db2-1158",
    dbType: "db2",
    name: "IBM Data Server Driver",
    version: "11.5.8.0",
    driverIdentifier: "db2-jcc",
    driverClassName: "com.ibm.db2.jcc.DB2Driver",
    originalFileName: "db2jcc4-11.5.8.jar",
    fileName: "db2jcc4-11.5.8.jar",
    size: "4.1 MB",
    vendor: "IBM",
    license: "Commercial",
    checksum: "SHA256: 0b8e1d9f715f",
    compatibleVersions: "DB2 LUW 10.5 / 11.1 / 11.5",
    builtIn: true,
    defaultDriver: true,
    status: "available",
    releaseDate: "2026-04-08",
    dialect: "FETCH FIRST 分页，Schema 大写对象规范",
    downloadUrl: "/mock-downloads/db2jcc4-11.5.8.jar",
  },
];

export const dataSources: DemoDataSource[] = [
  {
    id: "mysql-prod",
    name: "客户中心-MySQL生产库",
    dbType: "mysql",
    environment: "生产",
    connectionMode: "HOST_PORT",
    clusterEnabled: false,
    automaticScanning: true,
    databaseName: "crm_core",
    host: "10.12.8.21:3306",
    jdbcUrl: "jdbc:mysql://10.12.8.21:3306/crm_core?useSSL=true",
    username: "rklink_crm_ro",
    driverId: "driver-mysql-8033",
    connectionStatus: "online",
    lastTestAt: "2026-06-12 09:18:32",
    accountPolicy: "最小只读账号，生产 DML 需审批授权",
    dialect: "LIMIT 分页，反引号对象名",
    schemas: ["crm_core", "crm_order", "crm_risk"],
    authorizedTables: ["customer_info", "order_info", "risk_event"],
    owner: "客户中心",
    schemaCount: 6,
    tableCount: 128,
    sensitiveLevel: "高",
  },
  {
    id: "oracle-core",
    name: "核心账务-Oracle生产库",
    dbType: "oracle",
    environment: "生产",
    connectionMode: "HOST_PORT",
    clusterEnabled: false,
    automaticScanning: true,
    databaseName: "COREPDB",
    host: "10.12.9.11:1521",
    jdbcUrl: "jdbc:oracle:thin:@//10.12.9.11:1521/COREPDB",
    username: "rklink_core_audit",
    driverId: "driver-oracle-2310",
    connectionStatus: "warning",
    lastTestAt: "2026-06-12 08:51:09",
    accountPolicy: "核心账务专用账号，需双人复核",
    dialect: "ROWNUM / FETCH FIRST 分页",
    schemas: ["CORE_ACCOUNT", "CORE_CUSTOMER", "CORE_LOAN"],
    authorizedTables: ["customer_info", "account_ledger", "loan_contract"],
    owner: "核心账务",
    schemaCount: 12,
    tableCount: 386,
    sensitiveLevel: "高",
  },
  {
    id: "gaussdb-risk",
    name: "实时风控-GaussDB生产库",
    dbType: "gaussdb",
    environment: "生产",
    connectionMode: "HOST_PORT",
    clusterEnabled: false,
    automaticScanning: true,
    databaseName: "risk_rt",
    host: "10.30.6.17:8000",
    jdbcUrl: "jdbc:gaussdb://10.30.6.17:8000/risk_rt",
    username: "rklink_risk_ro",
    driverId: "driver-gaussdb-510",
    connectionStatus: "online",
    lastTestAt: "2026-06-12 09:11:27",
    accountPolicy: "风控生产只读账号，高风险 DML 单独授权",
    dialect: "兼容 PostgreSQL，双引号对象名",
    schemas: ["risk_rt", "risk_model", "risk_archive"],
    authorizedTables: ["risk_event", "customer_info", "device_fingerprint"],
    owner: "风险控制",
    schemaCount: 5,
    tableCount: 96,
    sensitiveLevel: "高",
  },
  {
    id: "db2-payroll",
    name: "人事薪酬-DB2生产库",
    dbType: "db2",
    environment: "生产",
    connectionMode: "HOST_PORT",
    clusterEnabled: false,
    automaticScanning: false,
    databaseName: "PAYROLL",
    host: "10.50.7.12:50000",
    jdbcUrl: "jdbc:db2://10.50.7.12:50000/PAYROLL",
    username: "rklink_hr_mask",
    driverId: "driver-db2-1158",
    connectionStatus: "online",
    lastTestAt: "2026-06-12 09:23:53",
    accountPolicy: "薪酬字段强制脱敏，主管审批后可执行指定变更",
    dialect: "FETCH FIRST 分页，Schema 大写对象规范",
    schemas: ["HR_SALARY", "HR_PROFILE", "HR_AUDIT"],
    authorizedTables: [
      "employee_salary",
      "employee_profile",
      "department_info",
    ],
    owner: "人力资源",
    schemaCount: 3,
    tableCount: 58,
    sensitiveLevel: "高",
  },
];

export const demoUsers: DemoUser[] = [
  {
    id: "dev",
    account: "zhangming.dev",
    name: "开发用户 张明",
    department: "数字银行研发部",
    employeeNo: "RD1027",
    position: "后端开发工程师",
    role: "研发变更申请人",
    status: "在职",
    lastLoginAt: "2026-06-14 18:42:09",
    platformPermissions: ["overview", "console", "sqlTemplates", "approval"],
    dataScope: "研发授权库：客户中心、实时风控；仅可访问脱敏后的生产副本视图",
    fieldScope: "普通字段可查，姓名/证件/手机号/地址按规则脱敏，账户余额不可明文",
    maskingDefault: true,
    canViewPlain: false,
    sensitiveAuditEnabled: true,
    exportApprovalRequired: true,
    dmlApprovalMode: "普通审批；高风险自动升级",
    resultLimit: 200,
    executionWindow: "工作日 09:00-18:00",
    allowedSources: ["mysql-prod", "gaussdb-risk"],
    operations: ["select", "insert", "update", "delete"],
  },
  {
    id: "ops",
    account: "lina.ops",
    name: "运维用户 李娜",
    department: "基础平台运维部",
    employeeNo: "OPS031",
    position: "生产变更工程师",
    role: "生产变更运维",
    status: "在职",
    lastLoginAt: "2026-06-15 09:12:44",
    platformPermissions: [
      "overview",
      "console",
      "sqlTemplates",
      "database",
      "approval",
      "audit",
    ],
    dataScope: "生产库运维授权范围；可对已登记维护窗口内的数据源提交变更",
    fieldScope: "敏感字段默认脱敏，核心薪酬和证件字段不可明文",
    maskingDefault: true,
    canViewPlain: false,
    sensitiveAuditEnabled: true,
    exportApprovalRequired: true,
    dmlApprovalMode: "生产 DML 严格审批",
    resultLimit: 500,
    executionWindow: "变更窗口 20:00-23:00",
    allowedSources: [
      "mysql-prod",
      "oracle-core",
      "gaussdb-risk",
      "db2-payroll",
    ],
    operations: ["select", "insert", "update", "delete"],
  },
  {
    id: "dba",
    account: "wangqiang.dba",
    name: "DBA 管理员 王强",
    department: "数据库平台组",
    employeeNo: "DBA008",
    position: "数据库管理员",
    role: "数据库管理员",
    status: "在职",
    lastLoginAt: "2026-06-15 08:58:31",
    platformPermissions: [
      "overview",
      "console",
      "sqlTemplates",
      "database",
      "assets",
      "permissions",
      "rules",
      "approval",
      "audit",
    ],
    dataScope: "全部生产数据源、驱动、连接与库表元数据",
    fieldScope: "明文授权字段可查，高敏对象访问仍记录强审计",
    maskingDefault: false,
    canViewPlain: true,
    sensitiveAuditEnabled: true,
    exportApprovalRequired: true,
    dmlApprovalMode: "高危语句审批或阻断",
    resultLimit: 1000,
    executionWindow: "受控维护窗口",
    allowedSources: dataSources.map((source) => source.id),
    operations: ["select", "insert", "update", "delete"],
  },
  {
    id: "auditor",
    account: "chenjing.audit",
    name: "审计用户 陈静",
    department: "信息安全与合规部",
    employeeNo: "SEC014",
    position: "安全审计专员",
    role: "安全审计员",
    status: "在职",
    lastLoginAt: "2026-06-14 20:17:26",
    platformPermissions: ["overview", "assets", "rules", "approval", "audit"],
    dataScope: "全部数据源审计视图、规则命中、审批记录和敏感资产目录",
    fieldScope: "仅审计字段、脱敏样例和风险摘要，不返回业务明文",
    maskingDefault: true,
    canViewPlain: false,
    sensitiveAuditEnabled: true,
    exportApprovalRequired: true,
    dmlApprovalMode: "不可提交 DML",
    resultLimit: 1000,
    executionWindow: "全天候审计查询",
    allowedSources: dataSources.map((source) => source.id),
    operations: ["select"],
  },
  {
    id: "hr",
    account: "zhouqian.hr",
    name: "人事用户 周倩",
    department: "人力资源薪酬组",
    employeeNo: "HR022",
    position: "薪酬专员",
    role: "薪酬专员",
    status: "在职",
    lastLoginAt: "2026-06-13 17:05:18",
    platformPermissions: ["overview", "console", "sqlTemplates", "approval", "audit"],
    dataScope: "DB2 人事薪酬库；仅限薪酬发放和调整流程关联表",
    fieldScope: "部门内员工信息可查，薪酬/银行卡字段强制脱敏",
    maskingDefault: true,
    canViewPlain: false,
    sensitiveAuditEnabled: true,
    exportApprovalRequired: true,
    dmlApprovalMode: "薪酬字段变更需主管审批",
    resultLimit: 200,
    executionWindow: "工作日 09:00-18:00",
    allowedSources: ["db2-payroll"],
    operations: ["select", "update"],
  },
  {
    id: "risk",
    account: "liuwei.risk",
    name: "风控用户 刘伟",
    department: "风险控制模型组",
    employeeNo: "RISK046",
    position: "风控数据分析师",
    role: "风控分析师",
    status: "在职",
    lastLoginAt: "2026-06-15 10:21:03",
    platformPermissions: ["overview", "console", "sqlTemplates", "audit"],
    dataScope: "实时风控 GaussDB、客户中心订单与风险事件只读范围",
    fieldScope: "设备指纹、手机号、证件号默认脱敏；模型评分和风险标签可查",
    maskingDefault: true,
    canViewPlain: false,
    sensitiveAuditEnabled: true,
    exportApprovalRequired: true,
    dmlApprovalMode: "不可提交 DML",
    resultLimit: 300,
    executionWindow: "工作日 09:00-18:00",
    allowedSources: ["gaussdb-risk", "mysql-prod"],
    operations: ["select"],
  },
  {
    id: "finance",
    account: "sunhao.finance",
    name: "账务用户 孙浩",
    department: "核心账务运营部",
    employeeNo: "FIN019",
    position: "账务复核员",
    role: "核心账务复核",
    status: "在职",
    lastLoginAt: "2026-06-15 09:47:56",
    platformPermissions: ["overview", "console", "sqlTemplates", "approval", "audit"],
    dataScope: "Oracle 核心账务库；账户流水、贷款合同和还款计划复核范围",
    fieldScope: "客户号、账户号可查，证件号、手机号、地址和余额明细脱敏",
    maskingDefault: true,
    canViewPlain: false,
    sensitiveAuditEnabled: true,
    exportApprovalRequired: true,
    dmlApprovalMode: "核心账务变更需双人复核",
    resultLimit: 500,
    executionWindow: "受控维护窗口",
    allowedSources: ["oracle-core"],
    operations: ["select", "update"],
  },
];

export const sqlTemplates = [
  {
    name: "敏感字段查询",
    sourceId: "mysql-prod",
    sql: "select name, id_card, mobile, address, account_balance from customer_info where city = '北京' limit 20;",
  },
  {
    name: "普通订单查询",
    sourceId: "mysql-prod",
    sql: "select order_id, customer_id, amount, status from order_info where created_at >= '2026-06-01' limit 10;",
  },
  {
    name: "DML 带条件变更",
    sourceId: "gaussdb-risk",
    sql: "update customer_info set mobile = '13900008888' where id = 1001;",
  },
  {
    name: "生产高风险变更",
    sourceId: "gaussdb-risk",
    sql: "update risk_event set event_status = 'CLOSED' where risk_level = 'LOW' and event_date < '2026-06-01';",
  },
  {
    name: "高危无 WHERE",
    sourceId: "oracle-core",
    sql: "delete from customer_info;",
  },
  {
    name: "越权薪酬查询",
    sourceId: "db2-payroll",
    sql: "select employee_name, mobile, bank_card, salary_amount from employee_salary where department_id = 12 fetch first 20 rows only;",
  },
  {
    name: "禁止类语句",
    sourceId: "db2-payroll",
    sql: "truncate table employee_profile;",
  },
  {
    name: "方言不匹配",
    sourceId: "oracle-core",
    sql: "select * from customer_info limit 10;",
  },
  {
    name: "恒真条件拦截",
    sourceId: "mysql-prod",
    sql: "select * from customer_info where 1=1;",
  },
  {
    name: "全模糊查询提示",
    sourceId: "mysql-prod",
    sql: "select order_id, customer_id, amount from order_info where status like '%成功%' and created_at >= '2026-06-01' limit 10;",
  },
  {
    name: "函数条件索引失效",
    sourceId: "mysql-prod",
    sql: "select order_id, customer_id from order_info where date(created_at) = '2026-06-01' limit 10;",
  },
  {
    name: "DML LIMIT 不稳定变更",
    sourceId: "mysql-prod",
    sql: "update customer_info set mobile = '13900008888' where city = '北京' limit 10;",
  },
  {
    name: "事务控制拦截",
    sourceId: "mysql-prod",
    sql: "begin;",
  },
  {
    name: "Oracle DBLINK 访问",
    sourceId: "oracle-core",
    sql: "select customer_id, account_no from customer_info@CORE_LINK where rownum <= 10;",
  },
];

export const customerRows: CustomerRow[] = [
  {
    id: 1001,
    name: "张三",
    idCard: "110101199001011234",
    mobile: "13812345678",
    address: "北京市朝阳区望京街道数据安全园 8 号",
    accountBalance: "86,240.50",
    owner: "华北客户中心",
  },
  {
    id: 1002,
    name: "李佳敏",
    idCard: "310101198812126789",
    mobile: "18699881234",
    address: "上海市浦东新区世纪大道 100 号",
    accountBalance: "41,580.00",
    owner: "华东客户中心",
  },
  {
    id: 1003,
    name: "王昊",
    idCard: "440301199506063456",
    mobile: "15900990012",
    address: "广东省深圳市南山区科技园中区 12 栋",
    accountBalance: "19,450.25",
    owner: "华南客户中心",
  },
  {
    id: 1004,
    name: "赵雨婷",
    idCard: "510104199203224321",
    mobile: "17766554433",
    address: "四川省成都市高新区天府三街 199 号",
    accountBalance: "103,820.10",
    owner: "西南客户中心",
  },
  {
    id: 1005,
    name: "陈立",
    idCard: "330106198705181098",
    mobile: "13987654321",
    address: "浙江省杭州市西湖区文三路 478 号",
    accountBalance: "7,906.80",
    owner: "华东客户中心",
  },
  {
    id: 1006,
    name: "刘欣然",
    idCard: "120101199912120987",
    mobile: "15122334455",
    address: "天津市和平区南京路 88 号",
    accountBalance: "56,301.60",
    owner: "华北客户中心",
  },
  {
    id: 1007,
    name: "孙嘉伟",
    idCard: "420102199104305678",
    mobile: "18866778899",
    address: "湖北省武汉市江汉区建设大道 568 号",
    accountBalance: "22,760.00",
    owner: "华中客户中心",
  },
  {
    id: 1008,
    name: "何思琪",
    idCard: "610102199707076543",
    mobile: "13011223344",
    address: "陕西省西安市雁塔区科技路 39 号",
    accountBalance: "64,009.35",
    owner: "西北客户中心",
  },
];

type QueryDataset = {
  columns: QueryResultColumn[];
  rows: QueryResultRow[];
};

const moneyColumnKeys = new Set([
  "amount",
  "account_balance",
  "balance",
  "debit_amount",
  "credit_amount",
  "salary_amount",
]);

const queryDatasetColumns = {
  customer_info: [
    { title: "客户ID", dataIndex: "customer_id", width: 120 },
    { title: "姓名", dataIndex: "name", width: 110 },
    { title: "身份证号", dataIndex: "id_card", width: 190 },
    { title: "手机号", dataIndex: "mobile", width: 140 },
    { title: "地址", dataIndex: "address", width: 260 },
    {
      title: "账户余额",
      dataIndex: "account_balance",
      width: 120,
      align: "right",
    },
    { title: "城市", dataIndex: "city", width: 90 },
    { title: "客户状态", dataIndex: "status", width: 100 },
    { title: "归属机构", dataIndex: "owner", width: 140 },
    { title: "开户时间", dataIndex: "created_at", width: 170 },
  ],
  order_info: [
    { title: "订单号", dataIndex: "order_id", width: 150 },
    { title: "客户ID", dataIndex: "customer_id", width: 120 },
    { title: "订单金额", dataIndex: "amount", width: 120, align: "right" },
    { title: "状态", dataIndex: "status", width: 110 },
    { title: "支付渠道", dataIndex: "pay_channel", width: 120 },
    { title: "商户名称", dataIndex: "merchant_name", width: 180 },
    { title: "创建时间", dataIndex: "created_at", width: 170 },
  ],
  risk_event: [
    { title: "事件ID", dataIndex: "event_id", width: 150 },
    { title: "客户ID", dataIndex: "customer_id", width: 120 },
    { title: "风险等级", dataIndex: "risk_level", width: 100 },
    { title: "事件状态", dataIndex: "event_status", width: 110 },
    { title: "场景", dataIndex: "scene", width: 160 },
    { title: "风险分", dataIndex: "score", width: 90, align: "right" },
    { title: "事件日期", dataIndex: "event_date", width: 120 },
    { title: "处理人", dataIndex: "handler", width: 120 },
  ],
  account_ledger: [
    { title: "流水号", dataIndex: "ledger_id", width: 150 },
    { title: "账号", dataIndex: "account_no", width: 170 },
    { title: "客户ID", dataIndex: "customer_id", width: 120 },
    { title: "借方金额", dataIndex: "debit_amount", width: 120, align: "right" },
    { title: "贷方金额", dataIndex: "credit_amount", width: 120, align: "right" },
    { title: "余额", dataIndex: "balance", width: 120, align: "right" },
    { title: "交易时间", dataIndex: "trade_time", width: 170 },
    { title: "摘要", dataIndex: "summary", width: 180 },
    { title: "渠道", dataIndex: "channel", width: 110 },
  ],
  device_fingerprint: [
    { title: "设备ID", dataIndex: "device_id", width: 150 },
    { title: "客户ID", dataIndex: "customer_id", width: 120 },
    { title: "设备指纹", dataIndex: "device_fingerprint", width: 230 },
    { title: "首次出现", dataIndex: "first_seen_at", width: 170 },
    { title: "最近访问", dataIndex: "last_seen_at", width: 170 },
    { title: "风险标签", dataIndex: "risk_tag", width: 120 },
    { title: "IP归属", dataIndex: "ip_city", width: 120 },
  ],
  employee_salary: [
    { title: "员工ID", dataIndex: "employee_id", width: 120 },
    { title: "员工姓名", dataIndex: "employee_name", width: 120 },
    { title: "手机号", dataIndex: "mobile", width: 140 },
    { title: "银行卡号", dataIndex: "bank_card", width: 190 },
    { title: "薪资金额", dataIndex: "salary_amount", width: 120, align: "right" },
    { title: "部门ID", dataIndex: "department_id", width: 100 },
    { title: "薪资月份", dataIndex: "salary_month", width: 120 },
  ],
  employee_profile: [
    { title: "员工ID", dataIndex: "employee_id", width: 120 },
    { title: "员工姓名", dataIndex: "employee_name", width: 120 },
    { title: "部门ID", dataIndex: "department_id", width: 100 },
    { title: "岗位", dataIndex: "position", width: 150 },
    { title: "手机号", dataIndex: "mobile", width: 140 },
    { title: "入职日期", dataIndex: "hire_date", width: 120 },
    { title: "状态", dataIndex: "status", width: 100 },
  ],
  loan_contract: [
    { title: "合同号", dataIndex: "contract_no", width: 170 },
    { title: "客户ID", dataIndex: "customer_id", width: 120 },
    { title: "贷款产品", dataIndex: "product_name", width: 160 },
    { title: "合同金额", dataIndex: "amount", width: 120, align: "right" },
    { title: "合同状态", dataIndex: "status", width: 110 },
    { title: "签约日期", dataIndex: "signed_date", width: 120 },
    { title: "经办机构", dataIndex: "branch_name", width: 180 },
  ],
} satisfies Record<string, QueryResultColumn[]>;

const queryDatasets: Record<string, QueryDataset> = {
  customer_info: {
    columns: queryDatasetColumns.customer_info,
    rows: [
      {
        customer_id: "C1001",
        name: "张三",
        id_card: "110101199001011234",
        mobile: "13812345678",
        address: "北京市朝阳区望京街道数据安全园 8 号",
        account_balance: "86,240.50",
        city: "北京",
        status: "正常",
        owner: "华北客户中心",
        created_at: "2026-06-04 09:18:20",
      },
      {
        customer_id: "C1002",
        name: "李佳敏",
        id_card: "310101198812126789",
        mobile: "18699881234",
        address: "上海市浦东新区世纪大道 100 号",
        account_balance: "41,580.00",
        city: "上海",
        status: "正常",
        owner: "华东客户中心",
        created_at: "2026-06-03 14:22:08",
      },
      {
        customer_id: "C1003",
        name: "王昊",
        id_card: "440301199506063456",
        mobile: "15900990012",
        address: "广东省深圳市南山区科技园中区 12 栋",
        account_balance: "19,450.25",
        city: "深圳",
        status: "观察",
        owner: "华南客户中心",
        created_at: "2026-06-01 11:06:42",
      },
      {
        customer_id: "C1004",
        name: "赵雨婷",
        id_card: "110105199203224321",
        mobile: "17766554433",
        address: "北京市海淀区中关村南大街 66 号",
        account_balance: "103,820.10",
        city: "北京",
        status: "正常",
        owner: "华北客户中心",
        created_at: "2026-05-29 16:31:55",
      },
      {
        customer_id: "C1005",
        name: "陈立",
        id_card: "330106198705181098",
        mobile: "13987654321",
        address: "浙江省杭州市西湖区文三路 478 号",
        account_balance: "7,906.80",
        city: "杭州",
        status: "正常",
        owner: "华东客户中心",
        created_at: "2026-05-26 10:12:31",
      },
      {
        customer_id: "C1006",
        name: "刘欣然",
        id_card: "110108199912120987",
        mobile: "15122334455",
        address: "北京市丰台区丽泽路 18 号",
        account_balance: "56,301.60",
        city: "北京",
        status: "冻结",
        owner: "华北客户中心",
        created_at: "2026-05-22 13:45:09",
      },
    ],
  },
  order_info: {
    columns: queryDatasetColumns.order_info,
    rows: [
      {
        order_id: "ORD202606010017",
        customer_id: "C1001",
        amount: "1,268.00",
        status: "支付成功",
        pay_channel: "手机银行",
        merchant_name: "北京云栖数码旗舰店",
        created_at: "2026-06-01 09:12:36",
      },
      {
        order_id: "ORD202606010083",
        customer_id: "C1004",
        amount: "3,580.40",
        status: "支付成功",
        pay_channel: "银联快捷",
        merchant_name: "京北家电广场",
        created_at: "2026-06-01 16:48:05",
      },
      {
        order_id: "ORD202606020041",
        customer_id: "C1002",
        amount: "229.90",
        status: "待支付",
        pay_channel: "微信支付",
        merchant_name: "便利蜂世纪大道店",
        created_at: "2026-06-02 12:04:18",
      },
      {
        order_id: "ORD202606030126",
        customer_id: "C1003",
        amount: "8,900.00",
        status: "支付成功",
        pay_channel: "企业网银",
        merchant_name: "深圳智造设备有限公司",
        created_at: "2026-06-03 10:27:44",
      },
      {
        order_id: "ORD202606050052",
        customer_id: "C1005",
        amount: "459.60",
        status: "已退款",
        pay_channel: "支付宝",
        merchant_name: "杭州湖滨生活超市",
        created_at: "2026-06-05 18:33:19",
      },
      {
        order_id: "ORD202605290018",
        customer_id: "C1006",
        amount: "2,016.30",
        status: "支付成功",
        pay_channel: "手机银行",
        merchant_name: "北京朝阳汽车服务中心",
        created_at: "2026-05-29 08:41:23",
      },
    ],
  },
  risk_event: {
    columns: queryDatasetColumns.risk_event,
    rows: [
      {
        event_id: "RISK202606010021",
        customer_id: "C1003",
        risk_level: "HIGH",
        event_status: "OPEN",
        scene: "异地大额转账",
        score: 92,
        event_date: "2026-06-01",
        handler: "风控专员 刘洋",
      },
      {
        event_id: "RISK202605280114",
        customer_id: "C1006",
        risk_level: "LOW",
        event_status: "CLOSED",
        scene: "设备切换提醒",
        score: 38,
        event_date: "2026-05-28",
        handler: "风控专员 何旭",
      },
      {
        event_id: "RISK202605300067",
        customer_id: "C1001",
        risk_level: "LOW",
        event_status: "OPEN",
        scene: "登录地异常",
        score: 42,
        event_date: "2026-05-30",
        handler: "风控专员 何旭",
      },
      {
        event_id: "RISK202606030049",
        customer_id: "C1004",
        risk_level: "MEDIUM",
        event_status: "REVIEWING",
        scene: "夜间高频交易",
        score: 66,
        event_date: "2026-06-03",
        handler: "风控主管 陈蕾",
      },
    ],
  },
  account_ledger: {
    columns: queryDatasetColumns.account_ledger,
    rows: [
      {
        ledger_id: "LED202606010001",
        account_no: "6222021001000876543",
        customer_id: "C1001",
        debit_amount: "0.00",
        credit_amount: "1,268.00",
        balance: "86,240.50",
        trade_time: "2026-06-01 09:12:39",
        summary: "订单支付",
        channel: "手机银行",
      },
      {
        ledger_id: "LED202606010086",
        account_no: "6222021001000811029",
        customer_id: "C1004",
        debit_amount: "0.00",
        credit_amount: "3,580.40",
        balance: "103,820.10",
        trade_time: "2026-06-01 16:48:08",
        summary: "快捷支付",
        channel: "银联快捷",
      },
      {
        ledger_id: "LED202606030122",
        account_no: "6222021001000754316",
        customer_id: "C1003",
        debit_amount: "8,900.00",
        credit_amount: "0.00",
        balance: "19,450.25",
        trade_time: "2026-06-03 10:27:48",
        summary: "企业网银入账",
        channel: "企业网银",
      },
    ],
  },
  device_fingerprint: {
    columns: queryDatasetColumns.device_fingerprint,
    rows: [
      {
        device_id: "DEV-8F31C92A",
        customer_id: "C1003",
        device_fingerprint: "fp_7d9c5b2e4a18f003c92b11e6ad57",
        first_seen_at: "2026-05-12 08:14:03",
        last_seen_at: "2026-06-03 10:20:41",
        risk_tag: "异地设备",
        ip_city: "深圳",
      },
      {
        device_id: "DEV-1A09D77C",
        customer_id: "C1001",
        device_fingerprint: "fp_3aa78d1e91c0b65a7c20f4b8e821",
        first_seen_at: "2026-04-20 19:08:22",
        last_seen_at: "2026-06-01 09:11:58",
        risk_tag: "常用设备",
        ip_city: "北京",
      },
      {
        device_id: "DEV-5C81E34F",
        customer_id: "C1006",
        device_fingerprint: "fp_d4b77123fd6e901c4a2e8c5b09af",
        first_seen_at: "2026-05-28 21:40:10",
        last_seen_at: "2026-05-29 08:39:15",
        risk_tag: "新设备",
        ip_city: "天津",
      },
    ],
  },
  employee_salary: {
    columns: queryDatasetColumns.employee_salary,
    rows: [
      {
        employee_id: "E12001",
        employee_name: "周倩",
        mobile: "13910112233",
        bank_card: "6228480012345678912",
        salary_amount: "28,600.00",
        department_id: 12,
        salary_month: "2026-05",
      },
      {
        employee_id: "E12007",
        employee_name: "沈航",
        mobile: "13622334455",
        bank_card: "6217002930101123456",
        salary_amount: "31,200.00",
        department_id: 12,
        salary_month: "2026-05",
      },
      {
        employee_id: "E13012",
        employee_name: "顾敏",
        mobile: "15866778899",
        bank_card: "6222620198765432108",
        salary_amount: "24,900.00",
        department_id: 13,
        salary_month: "2026-05",
      },
    ],
  },
  employee_profile: {
    columns: queryDatasetColumns.employee_profile,
    rows: [
      {
        employee_id: "E12001",
        employee_name: "周倩",
        department_id: 12,
        position: "薪酬专员",
        mobile: "13910112233",
        hire_date: "2021-03-15",
        status: "在职",
      },
      {
        employee_id: "E12007",
        employee_name: "沈航",
        department_id: 12,
        position: "绩效分析师",
        mobile: "13622334455",
        hire_date: "2020-09-01",
        status: "在职",
      },
      {
        employee_id: "E13012",
        employee_name: "顾敏",
        department_id: 13,
        position: "招聘主管",
        mobile: "15866778899",
        hire_date: "2019-11-18",
        status: "在职",
      },
    ],
  },
  loan_contract: {
    columns: queryDatasetColumns.loan_contract,
    rows: [
      {
        contract_no: "LN202605180087",
        customer_id: "C1001",
        product_name: "个人经营贷",
        amount: "300,000.00",
        status: "正常",
        signed_date: "2026-05-18",
        branch_name: "北京朝阳支行",
      },
      {
        contract_no: "LN202604260042",
        customer_id: "C1004",
        product_name: "消费分期",
        amount: "86,000.00",
        status: "正常",
        signed_date: "2026-04-26",
        branch_name: "北京海淀支行",
      },
      {
        contract_no: "LN202603110019",
        customer_id: "C1003",
        product_name: "小微周转贷",
        amount: "520,000.00",
        status: "关注",
        signed_date: "2026-03-11",
        branch_name: "深圳南山支行",
      },
    ],
  },
};

export const baseRules = [
  "识别 select / insert / update / delete，其他语句进入阻断策略。",
  "update / delete 未带 where 条件时判定为严重风险。",
  "生产库 DML 按环境、影响范围、敏感表命中情况自动提升风险等级。",
  "审批通过后执行前二次校验 SQL 摘要，防止审批后篡改。",
  "DML 语句必须生成审批单，审批通过后方可执行。",
  "命中姓名、身份证号、手机号、地址等敏感字段时触发动态脱敏。",
  "命中银行卡号、薪酬、合同编号、设备指纹时进入核心敏感访问审计。",
  "访问未授权数据源、库表或操作类型时直接拒绝。",
  "数据库方言与所选数据源不匹配时阻断，避免跨库误执行。",
  "禁止 drop、truncate、alter 等结构变更语句直接提交。",
  "审计日志记录规则命中、风险等级、处置结果、审批意见和脱敏状态。",
  "同一用户短时间多次命中高风险规则时，可联动告警策略。",
];

export const ruleStrategies: RuleStrategy[] = [
  {
    id: "R-COM-001",
    scope: "common",
    name: "SQL 类型白名单",
    category: "语法准入",
    sqlTypes: "ALL",
    trigger: "非 SELECT / INSERT / UPDATE / DELETE 或含多语句提交",
    risk: "critical",
    action: "阻断",
    priority: 100,
    status: "启用",
    description: "只允许受控查询与 DML，未知语句、批量拼接语句默认不进入执行链路。",
  },
  {
    id: "R-COM-002",
    scope: "common",
    name: "数据源访问授权",
    category: "权限控制",
    sqlTypes: "ALL",
    trigger: "用户未绑定当前数据库连接或环境权限",
    risk: "critical",
    action: "阻断",
    priority: 98,
    status: "启用",
    description: "先校验用户、角色、环境和数据源授权关系，未授权访问直接拒绝。",
  },
  {
    id: "R-COM-003",
    scope: "common",
    name: "操作类型授权",
    category: "权限控制",
    sqlTypes: "SELECT / DML",
    trigger: "角色不具备对应 SELECT、INSERT、UPDATE、DELETE 权限",
    risk: "critical",
    action: "阻断",
    priority: 96,
    status: "启用",
    description: "研发、运维、DBA、审计等角色按操作类型分权，防止查询账号提交变更。",
  },
  {
    id: "R-COM-004",
    scope: "common",
    name: "授权表范围校验",
    category: "数据范围",
    sqlTypes: "SELECT / DML",
    trigger: "解析到的库表不在连接授权表范围内",
    risk: "high",
    action: "审批",
    priority: 92,
    status: "启用",
    description: "跨库、跨 Schema、跨表访问需要进入审批或被策略阻断。",
  },
  {
    id: "R-COM-005",
    scope: "common",
    name: "UPDATE / DELETE 必须带 WHERE",
    category: "变更保护",
    sqlTypes: "UPDATE / DELETE",
    trigger: "UPDATE 或 DELETE 未识别到 WHERE 条件",
    risk: "critical",
    action: "阻断",
    priority: 90,
    status: "启用",
    description: "防止全表更新、全表删除等高危误操作。",
  },
  {
    id: "R-COM-006",
    scope: "common",
    name: "生产库 DML 审批",
    category: "审批流",
    sqlTypes: "INSERT / UPDATE / DELETE",
    trigger: "生产环境提交 DML，或影响行数预估超过阈值",
    risk: "high",
    action: "审批",
    priority: 88,
    status: "启用",
    description: "生产变更必须生成审批单，审批通过后执行前再次校验 SQL 摘要。",
  },
  {
    id: "R-COM-007",
    scope: "common",
    name: "敏感字段动态脱敏",
    category: "数据保护",
    sqlTypes: "SELECT",
    trigger: "命中姓名、证件号、手机号、地址、银行卡、薪酬等敏感字段",
    risk: "medium",
    action: "脱敏",
    priority: 82,
    status: "启用",
    description: "按用户明文权限、字段分级和脱敏模板决定返回明文或脱敏结果。",
  },
  {
    id: "R-COM-008",
    scope: "common",
    name: "高危结构变更拦截",
    category: "高危语句",
    sqlTypes: "DDL",
    trigger: "DROP / TRUNCATE / ALTER / RENAME 等结构变更",
    risk: "critical",
    action: "阻断",
    priority: 80,
    status: "启用",
    description: "结构变更不走普通 SQL 审核通道，需进入独立变更流程。",
  },
  {
    id: "R-COM-009",
    scope: "common",
    name: "SELECT * 规范提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "查询字段使用 * 或返回列数超过阈值",
    risk: "medium",
    action: "提示",
    priority: 70,
    status: "观察",
    description: "提示用户明确列清单，降低敏感字段暴露面和大结果集风险。",
  },
  {
    id: "R-COM-010",
    scope: "common",
    name: "SQL 注入特征拦截",
    category: "安全检测",
    sqlTypes: "ALL",
    trigger: "出现 OR 1=1、UNION SELECT、注释截断、堆叠语句等注入特征",
    risk: "critical",
    action: "阻断",
    priority: 94,
    status: "启用",
    description: "对常见注入 payload、异常注释和拼接语句进行阻断，降低绕过审核风险。",
  },
  {
    id: "R-COM-011",
    scope: "common",
    name: "大结果集查询限制",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "未限制分页或预估返回行数超过阈值",
    risk: "medium",
    action: "审批",
    priority: 78,
    status: "启用",
    description: "避免一次性拉取全量数据，生产库大结果集查询需审批并记录用途。",
  },
  {
    id: "R-COM-012",
    scope: "common",
    name: "事务控制语句拦截",
    category: "会话控制",
    sqlTypes: "TRANSACTION",
    trigger: "BEGIN、COMMIT、ROLLBACK、SAVEPOINT、SET AUTOCOMMIT 等事务控制语句",
    risk: "high",
    action: "阻断",
    priority: 76,
    status: "启用",
    description: "审核平台统一托管执行事务，禁止用户在 SQL 中自行控制事务边界。",
  },
  {
    id: "R-COM-013",
    scope: "common",
    name: "复杂 JOIN 查询提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "JOIN 表数量超过阈值，或出现笛卡尔积风险",
    risk: "medium",
    action: "提示",
    priority: 68,
    status: "观察",
    description: "提示用户确认关联条件与执行计划，避免生产库慢查询和误扫全表。",
  },
  {
    id: "R-COM-014",
    scope: "common",
    name: "时间范围强校验",
    category: "查询规范",
    sqlTypes: "SELECT / DML",
    trigger: "访问流水、日志、审计、历史表但未限定日期或分区范围",
    risk: "high",
    action: "审批",
    priority: 74,
    status: "启用",
    description: "对大体量时间序列表要求带时间窗口，缺失范围时升级审批。",
  },
  {
    id: "R-COM-015",
    scope: "common",
    name: "重复高风险提交告警",
    category: "行为审计",
    sqlTypes: "ALL",
    trigger: "同一用户短时间多次提交高风险或被阻断 SQL",
    risk: "high",
    action: "审批",
    priority: 66,
    status: "观察",
    description: "联动审计日志识别异常尝试，必要时暂停用户 SQL 提交权限。",
  },
  {
    id: "R-COM-016",
    scope: "common",
    name: "WHERE 恒真条件拦截",
    category: "DML规范",
    sqlTypes: "SELECT / DML",
    trigger: "WHERE 条件出现 1=1、TRUE、恒等字符串比较等恒真表达式",
    risk: "critical",
    action: "阻断",
    priority: 95,
    status: "启用",
    description: "对照审核规则中“禁止 where 条件中出现 1=1”，防止绕过条件校验或误扫全表。",
  },
  {
    id: "R-COM-017",
    scope: "common",
    name: "LIKE 全模糊或左模糊提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "LIKE '%xxx%' 或 LIKE '%xxx' 等无法使用普通索引的匹配方式",
    risk: "medium",
    action: "提示",
    priority: 69,
    status: "启用",
    description: "对照审核规则中“禁止使用全模糊搜索或左模糊搜索”，提示用户改用前缀匹配或专用索引。",
  },
  {
    id: "R-COM-018",
    scope: "common",
    name: "HAVING 子句使用提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "查询语句包含 HAVING，尤其是可提前下推到 WHERE 的条件",
    risk: "medium",
    action: "提示",
    priority: 67,
    status: "启用",
    description: "对照审核规则中“避免使用 having 子句”，提示减少聚合后过滤带来的排序和统计开销。",
  },
  {
    id: "R-COM-019",
    scope: "common",
    name: "条件字段函数或表达式提示",
    category: "索引失效",
    sqlTypes: "SELECT / DML",
    trigger: "WHERE 条件中对字段使用函数、算术表达式或隐式转换",
    risk: "medium",
    action: "提示",
    priority: 65,
    status: "启用",
    description: "对照审核规则中“条件字段使用函数/表达式”，提示避免索引失效和全表扫描。",
  },
  {
    id: "R-COM-020",
    scope: "common",
    name: "UPDATE / DELETE LIMIT 或 ORDER BY 审批",
    category: "DML规范",
    sqlTypes: "UPDATE / DELETE",
    trigger: "UPDATE / DELETE 使用 LIMIT 或 ORDER BY，导致变更目标不稳定或排序开销",
    risk: "high",
    action: "审批",
    priority: 89,
    status: "启用",
    description: "对照审核规则中“DELETE/UPDATE 语句不能有 LIMIT/ORDER BY”，生产变更需审批确认。",
  },
  {
    id: "R-COM-021",
    scope: "common",
    name: "IN NULL 条件拦截",
    category: "DML规范",
    sqlTypes: "SELECT / DML",
    trigger: "出现 IN (NULL) 或 NOT IN (NULL)",
    risk: "high",
    action: "阻断",
    priority: 87,
    status: "启用",
    description: "对照审核规则中“避免 IN(NULL) 或 NOT IN(NULL)”，避免条件永远非真导致结果异常。",
  },
  {
    id: "R-COM-022",
    scope: "common",
    name: "UNION 去重提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "使用 UNION 而非 UNION ALL，产生排序去重开销",
    risk: "medium",
    action: "提示",
    priority: 63,
    status: "启用",
    description: "对照审核规则中“建议使用 UNION ALL 替代 UNION”，在允许重复时建议改写。",
  },
  {
    id: "R-COM-023",
    scope: "common",
    name: "存储过程与触发器控制",
    category: "高危语句",
    sqlTypes: "CALL / DDL",
    trigger: "CALL、EXEC、CREATE PROCEDURE、CREATE TRIGGER 等过程化逻辑",
    risk: "high",
    action: "审批",
    priority: 79,
    status: "启用",
    description: "对照审核规则中“避免使用存储过程/触发器”，内部逻辑不可从单条 SQL 完整评估。",
  },
  {
    id: "R-COM-024",
    scope: "common",
    name: "视图创建与访问控制",
    category: "高危语句",
    sqlTypes: "SELECT / DDL",
    trigger: "CREATE VIEW 或访问命名为 view 的复杂视图对象",
    risk: "high",
    action: "审批",
    priority: 77,
    status: "启用",
    description: "对照审核规则中“禁止使用视图/禁止创建视图”，视图依赖复杂且基表变更后维护成本高。",
  },
  {
    id: "R-COM-025",
    scope: "common",
    name: "大表 COUNT 规范提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "对大表使用 COUNT(*) 或 COUNT(列) 做全量统计",
    risk: "medium",
    action: "提示",
    priority: 61,
    status: "观察",
    description: "对照审核规则中的 COUNT 规范，提示确认统计口径、索引和数据量。",
  },
  {
    id: "R-MYSQL-001",
    scope: "mysql",
    name: "MySQL 方言校验",
    category: "方言检查",
    sqlTypes: "SELECT / DML",
    trigger: "出现 ROWNUM、TOP、FETCH FIRST 等非 MySQL 分页语法",
    risk: "critical",
    action: "阻断",
    priority: 86,
    status: "启用",
    description: "MySQL 连接仅允许 LIMIT / OFFSET、反引号对象名等 MySQL 兼容写法。",
  },
  {
    id: "R-MYSQL-002",
    scope: "mysql",
    name: "跨库对象访问控制",
    category: "数据范围",
    sqlTypes: "SELECT / DML",
    trigger: "SQL 中出现 database.table 且 database 不在授权范围",
    risk: "high",
    action: "审批",
    priority: 84,
    status: "启用",
    description: "控制 MySQL 同实例跨库访问，避免绕过当前连接的 Schema 授权。",
  },
  {
    id: "R-MYSQL-003",
    scope: "mysql",
    name: "LOAD DATA / OUTFILE 禁用",
    category: "高危语句",
    sqlTypes: "IMPORT / EXPORT",
    trigger: "LOAD DATA、SELECT ... INTO OUTFILE、LOAD_FILE()",
    risk: "critical",
    action: "阻断",
    priority: 82,
    status: "启用",
    description: "禁止通过 SQL 通道导入导出服务器文件或批量落盘数据。",
  },
  {
    id: "R-MYSQL-004",
    scope: "mysql",
    name: "ON DUPLICATE KEY UPDATE 审批",
    category: "变更保护",
    sqlTypes: "INSERT",
    trigger: "INSERT 语句包含 ON DUPLICATE KEY UPDATE",
    risk: "high",
    action: "审批",
    priority: 78,
    status: "启用",
    description: "该语法可能实际产生更新行为，生产环境按 DML 更新规则审批。",
  },
  {
    id: "R-MYSQL-005",
    scope: "mysql",
    name: "关闭安全更新拦截",
    category: "会话变量",
    sqlTypes: "SET",
    trigger: "SET SQL_SAFE_UPDATES = 0 或关闭 sql_log_bin",
    risk: "critical",
    action: "阻断",
    priority: 76,
    status: "启用",
    description: "禁止在审核通道内关闭安全更新、复制日志等关键保护开关。",
  },
  {
    id: "R-MYSQL-006",
    scope: "mysql",
    name: "系统库访问审批",
    category: "数据范围",
    sqlTypes: "SELECT",
    trigger: "访问 mysql、performance_schema、information_schema 等系统库",
    risk: "high",
    action: "审批",
    priority: 74,
    status: "启用",
    description: "系统库可能暴露账号、权限、表结构和运行状态，默认需审批后查看。",
  },
  {
    id: "R-MYSQL-007",
    scope: "mysql",
    name: "锁表语句拦截",
    category: "会话控制",
    sqlTypes: "LOCK",
    trigger: "LOCK TABLES、FLUSH TABLES WITH READ LOCK、GET_LOCK()",
    risk: "critical",
    action: "阻断",
    priority: 72,
    status: "启用",
    description: "禁止通过审核通道执行可能阻塞业务写入的显式锁表操作。",
  },
  {
    id: "R-MYSQL-008",
    scope: "mysql",
    name: "UPDATE LIMIT 无排序提示",
    category: "变更保护",
    sqlTypes: "UPDATE / DELETE",
    trigger: "DML 使用 LIMIT 但缺少 ORDER BY 或唯一键条件",
    risk: "high",
    action: "审批",
    priority: 70,
    status: "启用",
    description: "避免不稳定执行计划导致变更目标不确定，生产环境需审批确认。",
  },
  {
    id: "R-MYSQL-009",
    scope: "mysql",
    name: "存储过程调用控制",
    category: "高危语句",
    sqlTypes: "CALL",
    trigger: "CALL 存储过程、函数或触发器相关对象",
    risk: "high",
    action: "审批",
    priority: 68,
    status: "启用",
    description: "存储过程内部逻辑不可从单条 SQL 完整评估，需审批并补充影响说明。",
  },
  {
    id: "R-ORA-001",
    scope: "oracle",
    name: "Oracle 方言校验",
    category: "方言检查",
    sqlTypes: "SELECT / DML",
    trigger: "出现 LIMIT、反引号对象名、MySQL 函数等非 Oracle 语法",
    risk: "critical",
    action: "阻断",
    priority: 86,
    status: "启用",
    description: "Oracle 连接按 ROWNUM / FETCH FIRST / 双引号对象名等规则校验语法。",
  },
  {
    id: "R-ORA-002",
    scope: "oracle",
    name: "DBLINK 访问审批",
    category: "数据范围",
    sqlTypes: "SELECT / DML",
    trigger: "SQL 中出现 @DBLINK 或跨库同义词访问",
    risk: "high",
    action: "审批",
    priority: 84,
    status: "启用",
    description: "跨库链路可能越过当前连接授权范围，需审批并记录远端对象。",
  },
  {
    id: "R-ORA-003",
    scope: "oracle",
    name: "MERGE INTO 生产审批",
    category: "变更保护",
    sqlTypes: "MERGE",
    trigger: "MERGE INTO 目标表为生产库或敏感表",
    risk: "high",
    action: "审批",
    priority: 82,
    status: "启用",
    description: "MERGE 同时具备插入和更新语义，按高风险 DML 进行审批。",
  },
  {
    id: "R-ORA-004",
    scope: "oracle",
    name: "系统包调用拦截",
    category: "高危语句",
    sqlTypes: "CALL / SELECT",
    trigger: "DBMS_、UTL_、SYS.、EXECUTE IMMEDIATE 等系统能力调用",
    risk: "critical",
    action: "阻断",
    priority: 80,
    status: "启用",
    description: "禁止通过审核通道执行文件、网络、调度、动态 SQL 等系统级能力。",
  },
  {
    id: "R-ORA-005",
    scope: "oracle",
    name: "分区全量变更保护",
    category: "变更保护",
    sqlTypes: "UPDATE / DELETE",
    trigger: "目标表为分区表且未限定分区键或时间范围",
    risk: "high",
    action: "审批",
    priority: 74,
    status: "观察",
    description: "对大表、分区表变更进行额外提示和审批升级。",
  },
  {
    id: "R-ORA-006",
    scope: "oracle",
    name: "SELECT FOR UPDATE 审批",
    category: "锁控制",
    sqlTypes: "SELECT",
    trigger: "查询语句包含 FOR UPDATE 或 NOWAIT 锁定语义",
    risk: "high",
    action: "审批",
    priority: 72,
    status: "启用",
    description: "防止查询链路产生行锁等待，生产库锁定查询需审批确认窗口。",
  },
  {
    id: "R-ORA-007",
    scope: "oracle",
    name: "递归查询深度提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "CONNECT BY、递归 CTE 缺少层级或结果集限制",
    risk: "medium",
    action: "提示",
    priority: 70,
    status: "观察",
    description: "提示用户限定 LEVEL、日期或节点范围，避免递归查询失控。",
  },
  {
    id: "R-ORA-008",
    scope: "oracle",
    name: "ALTER SESSION 拦截",
    category: "会话控制",
    sqlTypes: "SESSION",
    trigger: "ALTER SESSION、SET ROLE、切换 CURRENT_SCHEMA 等会话级修改",
    risk: "critical",
    action: "阻断",
    priority: 68,
    status: "启用",
    description: "禁止用户在审核通道修改会话上下文，避免绕过 Schema、角色和审计策略。",
  },
  {
    id: "R-ORA-009",
    scope: "oracle",
    name: "高并行 Hint 审批",
    category: "性能保护",
    sqlTypes: "SELECT / DML",
    trigger: "SQL Hint 中出现 PARALLEL 或 FULL 大表扫描指令",
    risk: "high",
    action: "审批",
    priority: 66,
    status: "启用",
    description: "对可能抢占生产资源的执行计划 Hint 进行审批和资源窗口控制。",
  },
  {
    id: "R-GAUSS-001",
    scope: "gaussdb",
    name: "GaussDB 方言校验",
    category: "方言检查",
    sqlTypes: "SELECT / DML",
    trigger: "出现 ROWNUM、TOP、Oracle Hint 或不兼容函数",
    risk: "critical",
    action: "阻断",
    priority: 86,
    status: "启用",
    description: "按 GaussDB / PostgreSQL 兼容语法校验 LIMIT、双引号对象名和函数调用。",
  },
  {
    id: "R-GAUSS-002",
    scope: "gaussdb",
    name: "COPY 高危能力拦截",
    category: "高危语句",
    sqlTypes: "COPY",
    trigger: "COPY FROM / TO 文件、PROGRAM 或 STDOUT 大量导出",
    risk: "critical",
    action: "阻断",
    priority: 84,
    status: "启用",
    description: "阻断通过数据库服务器文件系统或程序通道导入导出数据。",
  },
  {
    id: "R-GAUSS-003",
    scope: "gaussdb",
    name: "扩展与函数创建禁用",
    category: "高危语句",
    sqlTypes: "DDL",
    trigger: "CREATE EXTENSION、CREATE FUNCTION、LANGUAGE plpythonu 等",
    risk: "critical",
    action: "阻断",
    priority: 82,
    status: "启用",
    description: "禁止在 SQL 审核通道创建可执行扩展、函数和不受信过程语言。",
  },
  {
    id: "R-GAUSS-004",
    scope: "gaussdb",
    name: "RETURNING 敏感字段审计",
    category: "数据保护",
    sqlTypes: "INSERT / UPDATE / DELETE",
    trigger: "DML RETURNING 返回敏感字段或返回列过多",
    risk: "high",
    action: "审批",
    priority: 78,
    status: "启用",
    description: "DML 返回数据也纳入敏感字段识别和审批控制。",
  },
  {
    id: "R-GAUSS-005",
    scope: "gaussdb",
    name: "维护命令审批",
    category: "运维保护",
    sqlTypes: "MAINTAIN",
    trigger: "VACUUM、ANALYZE、REINDEX、CLUSTER 等维护命令",
    risk: "medium",
    action: "审批",
    priority: 72,
    status: "观察",
    description: "维护命令可能影响性能或锁表，需记录窗口和审批意见。",
  },
  {
    id: "R-GAUSS-006",
    scope: "gaussdb",
    name: "SELECT FOR UPDATE 审批",
    category: "锁控制",
    sqlTypes: "SELECT",
    trigger: "SELECT FOR UPDATE / FOR SHARE 锁定行数据",
    risk: "high",
    action: "审批",
    priority: 70,
    status: "启用",
    description: "控制查询语句产生锁等待，避免影响风控实时链路写入。",
  },
  {
    id: "R-GAUSS-007",
    scope: "gaussdb",
    name: "系统 Catalog 访问提示",
    category: "数据范围",
    sqlTypes: "SELECT",
    trigger: "访问 pg_catalog、information_schema、pg_stat 等系统视图",
    risk: "medium",
    action: "提示",
    priority: 68,
    status: "启用",
    description: "系统视图访问需要记录审计，涉及权限、连接和 SQL 文本时升级审批。",
  },
  {
    id: "R-GAUSS-008",
    scope: "gaussdb",
    name: "批量 UPSERT 审批",
    category: "变更保护",
    sqlTypes: "INSERT",
    trigger: "INSERT ... ON CONFLICT DO UPDATE 且目标为生产表",
    risk: "high",
    action: "审批",
    priority: 66,
    status: "启用",
    description: "UPSERT 可能同时产生新增和更新，按高风险 DML 进行审批。",
  },
  {
    id: "R-GAUSS-009",
    scope: "gaussdb",
    name: "分布式执行资源提示",
    category: "性能保护",
    sqlTypes: "SELECT",
    trigger: "包含跨分片聚合、大表排序或窗口函数且无过滤条件",
    risk: "medium",
    action: "提示",
    priority: 64,
    status: "观察",
    description: "提示用户确认执行计划，避免分布式节点资源被大查询占满。",
  },
  {
    id: "R-DB2-001",
    scope: "db2",
    name: "DB2 方言校验",
    category: "方言检查",
    sqlTypes: "SELECT / DML",
    trigger: "出现 LIMIT、TOP、反引号对象名等非 DB2 语法",
    risk: "critical",
    action: "阻断",
    priority: 86,
    status: "启用",
    description: "DB2 连接按 FETCH FIRST、OPTIMIZE FOR、Schema 大写对象规范校验。",
  },
  {
    id: "R-DB2-002",
    scope: "db2",
    name: "LOAD / IMPORT / EXPORT 禁用",
    category: "高危语句",
    sqlTypes: "UTILITY",
    trigger: "LOAD、IMPORT、EXPORT、ADMIN_CMD 等工具类命令",
    risk: "critical",
    action: "阻断",
    priority: 84,
    status: "启用",
    description: "阻断绕过应用权限的大批量导入导出和管理命令。",
  },
  {
    id: "R-DB2-003",
    scope: "db2",
    name: "WITH UR 脏读提示",
    category: "查询规范",
    sqlTypes: "SELECT",
    trigger: "SELECT 末尾使用 WITH UR 隔离级别",
    risk: "medium",
    action: "提示",
    priority: 78,
    status: "启用",
    description: "提示用户脏读可能造成数据不一致，敏感查询仍记录审计。",
  },
  {
    id: "R-DB2-004",
    scope: "db2",
    name: "薪酬字段强制脱敏",
    category: "数据保护",
    sqlTypes: "SELECT",
    trigger: "命中 salary_amount、bank_card、employee_salary 等薪酬对象",
    risk: "high",
    action: "脱敏",
    priority: 76,
    status: "启用",
    description: "DB2 人事薪酬场景默认强制脱敏，明文查看需单独授权。",
  },
  {
    id: "R-DB2-005",
    scope: "db2",
    name: "序列与标识列重置拦截",
    category: "高危语句",
    sqlTypes: "DDL",
    trigger: "ALTER SEQUENCE、RESTART WITH、ALTER TABLE ... ALTER COLUMN",
    risk: "critical",
    action: "阻断",
    priority: 74,
    status: "启用",
    description: "禁止通过普通 SQL 通道重置序列、标识列或破坏主键生成策略。",
  },
  {
    id: "R-DB2-006",
    scope: "db2",
    name: "WITH RS / RR 锁级别审批",
    category: "锁控制",
    sqlTypes: "SELECT",
    trigger: "查询使用 WITH RS、WITH RR 或显式高隔离级别",
    risk: "high",
    action: "审批",
    priority: 72,
    status: "启用",
    description: "高隔离级别可能扩大锁范围，生产库需审批后执行。",
  },
  {
    id: "R-DB2-007",
    scope: "db2",
    name: "SYSCAT / SYSIBM 访问提示",
    category: "数据范围",
    sqlTypes: "SELECT",
    trigger: "访问 SYSCAT、SYSIBM、SYSSTAT 等系统对象",
    risk: "medium",
    action: "提示",
    priority: 70,
    status: "启用",
    description: "系统目录访问需要记录用途，涉及权限或对象定义时进入审批。",
  },
  {
    id: "R-DB2-008",
    scope: "db2",
    name: "游标保持语义审批",
    category: "会话控制",
    sqlTypes: "SELECT / CURSOR",
    trigger: "WITH HOLD、DECLARE CURSOR、可保持游标语句",
    risk: "medium",
    action: "审批",
    priority: 68,
    status: "观察",
    description: "长游标可能占用连接和锁资源，需记录执行窗口和释放策略。",
  },
  {
    id: "R-DB2-009",
    scope: "db2",
    name: "MQT / 物化查询表变更拦截",
    category: "高危语句",
    sqlTypes: "DDL",
    trigger: "CREATE / ALTER / REFRESH MATERIALIZED QUERY TABLE",
    risk: "critical",
    action: "阻断",
    priority: 66,
    status: "启用",
    description: "物化查询表维护可能影响性能和数据一致性，需走独立变更流程。",
  },
];

export const assetCatalog: AssetCatalogRow[] = [
  {
    key: "asset-1",
    domain: "客户域",
    source: "客户中心-MySQL生产库",
    dbType: "mysql",
    schema: "crm_core",
    tableName: "customer_info",
    rows: "28,643,912",
    sensitivity: "高",
    owner: "客户中心 / CRM 数据组",
  },
  {
    key: "asset-2",
    domain: "交易域",
    source: "客户中心-MySQL生产库",
    dbType: "mysql",
    schema: "crm_order",
    tableName: "order_info",
    rows: "94,208,776",
    sensitivity: "中",
    owner: "支付结算部 / 订单平台组",
  },
  {
    key: "asset-3",
    domain: "风控域",
    source: "实时风控-GaussDB生产库",
    dbType: "gaussdb",
    schema: "risk_rt",
    tableName: "risk_event",
    rows: "39,517,604",
    sensitivity: "高",
    owner: "风险控制部 / 实时策略组",
  },
  {
    key: "asset-4",
    domain: "账务域",
    source: "核心账务-Oracle生产库",
    dbType: "oracle",
    schema: "core_account",
    tableName: "account_ledger",
    rows: "73,028,441",
    sensitivity: "高",
    owner: "核心账务部 / 总账清算组",
  },
  {
    key: "asset-5",
    domain: "风控域",
    source: "实时风控-GaussDB生产库",
    dbType: "gaussdb",
    schema: "risk_model",
    tableName: "device_fingerprint",
    rows: "46,214,305",
    sensitivity: "高",
    owner: "风险控制部 / 设备画像组",
  },
  {
    key: "asset-6",
    domain: "人事域",
    source: "人事薪酬-DB2生产库",
    dbType: "db2",
    schema: "HR_SALARY",
    tableName: "employee_salary",
    rows: "86,420",
    sensitivity: "高",
    owner: "人力资源部 / 薪酬福利组",
  },
  {
    key: "asset-7",
    domain: "人事域",
    source: "人事薪酬-DB2生产库",
    dbType: "db2",
    schema: "HR_PROFILE",
    tableName: "employee_profile",
    rows: "124,386",
    sensitivity: "中",
    owner: "人力资源部 / 员工档案组",
  },
  {
    key: "asset-8",
    domain: "授信域",
    source: "核心账务-Oracle生产库",
    dbType: "oracle",
    schema: "CORE_LOAN",
    tableName: "loan_contract",
    rows: "12,736,908",
    sensitivity: "高",
    owner: "零售信贷部 / 合同管理组",
  },
  {
    key: "asset-9",
    domain: "组织域",
    source: "人事薪酬-DB2生产库",
    dbType: "db2",
    schema: "HR_PROFILE",
    tableName: "department_info",
    rows: "3,216",
    sensitivity: "低",
    owner: "人力资源部 / 组织发展组",
  },
];

export const sensitiveCatalog: SensitiveCatalogRow[] = [
  {
    key: "sens-1",
    field: "customer_info.name / employee_salary.employee_name",
    type: "姓名",
    level: "重要",
    maskRule: "保留首字，其余替换为 *",
    example: "张三 -> 张*",
    status: "启用",
  },
  {
    key: "sens-2",
    field: "customer_info.id_card",
    type: "身份证号",
    level: "核心",
    maskRule: "保留前 3 位和后 4 位",
    example: "110101199001011234 -> 110***********1234",
    status: "启用",
  },
  {
    key: "sens-3",
    field: "customer_info.mobile / employee_salary.mobile",
    type: "手机号",
    level: "重要",
    maskRule: "保留前 3 位和后 4 位",
    example: "13812345678 -> 138****5678",
    status: "启用",
  },
  {
    key: "sens-4",
    field: "customer_info.address",
    type: "地址",
    level: "重要",
    maskRule: "保留省市区，其余替换为 *",
    example: "北京市朝阳区望京街道数据安全园 8 号 -> 北京市朝阳区望****",
    status: "启用",
  },
  {
    key: "sens-5",
    field: "employee_salary.bank_card",
    type: "银行卡号",
    level: "核心",
    maskRule: "保留前 4 位和后 4 位",
    example: "6228480012345678912 -> 6228 **** **** 8912",
    status: "启用",
  },
  {
    key: "sens-6",
    field: "employee_salary.salary_amount",
    type: "薪酬金额",
    level: "核心",
    maskRule: "普通角色按金额位数脱敏，薪酬专岗按授权展示",
    example: "28,600.00 -> 28,*00.00",
    status: "启用",
  },
  {
    key: "sens-7",
    field: "device_fingerprint.device_fingerprint",
    type: "设备指纹",
    level: "核心",
    maskRule: "哈希截断展示",
    example: "fp_7d9c5b2e4a18f003c92b11e6ad57 -> fp_7d9c5********ad57",
    status: "启用",
  },
  {
    key: "sens-8",
    field: "account_ledger.account_no",
    type: "银行账号",
    level: "核心",
    maskRule: "保留前 4 位和后 4 位",
    example: "6222021001000876543 -> 6222********6543",
    status: "启用",
  },
  {
    key: "sens-9",
    field: "loan_contract.contract_no",
    type: "授信合同号",
    level: "重要",
    maskRule: "保留业务前缀和后 4 位",
    example: "LN202605180087 -> LN2026****0087",
    status: "启用",
  },
];

export const seedAuditLogs: AuditLog[] = [
  {
    id: "AUD-SEED-012",
    time: "2026-06-15 10:36:02",
    module: "SQL审核工作台",
    action: "SQL执行",
    user: "风控用户 刘伟",
    source: "实时风控-GaussDB生产库",
    sqlType: "SELECT",
    decision: "放行执行",
    risk: "medium",
    note: "查询设备指纹命中核心敏感字段，结果已按哈希截断规则脱敏。",
    ip: "10.12.6.41",
    requestId: "REQ-SEED-012",
    sql: "select device_id, customer_id, device_fingerprint from device_fingerprint where risk_tag = '异地设备' limit 20;",
  },
  {
    id: "AUD-SEED-011",
    time: "2026-06-15 10:22:46",
    module: "DML审批",
    action: "DML执行",
    user: "DBA 管理员 王强",
    source: "实时风控-GaussDB生产库",
    sqlType: "UPDATE",
    decision: "执行成功",
    risk: "high",
    note: "审批单 APR-SEED-002 执行前校验一致，影响行数 128，回滚方案已登记。",
    ip: "10.12.5.19",
    requestId: "REQ-SEED-011",
    sql: "update risk_event set event_status = 'CLOSED' where risk_level = 'LOW' and event_date < '2026-06-01';",
  },
  {
    id: "AUD-SEED-010",
    time: "2026-06-15 10:18:31",
    module: "DML审批",
    action: "审批通过",
    user: "DBA 管理员 王强",
    source: "实时风控-GaussDB生产库",
    sqlType: "UPDATE",
    decision: "已通过",
    risk: "high",
    note: "已确认变更窗口、影响行数预估和回滚 SQL，同意执行。",
    ip: "10.12.5.19",
    requestId: "REQ-SEED-010",
    sql: "update risk_event set event_status = 'CLOSED' where risk_level = 'LOW' and event_date < '2026-06-01';",
  },
  {
    id: "AUD-SEED-009",
    time: "2026-06-15 10:12:09",
    module: "SQL审核工作台",
    action: "提交审批",
    user: "运维用户 李娜",
    source: "实时风控-GaussDB生产库",
    sqlType: "UPDATE",
    decision: "进入审批",
    risk: "high",
    note: "生产库 DML 命中审批策略，已提交 DBA 复核。",
    ip: "10.12.5.16",
    requestId: "REQ-SEED-009",
    sql: "update risk_event set event_status = 'CLOSED' where risk_level = 'LOW' and event_date < '2026-06-01';",
  },
  {
    id: "AUD-SEED-008",
    time: "2026-06-15 09:58:44",
    module: "SQL审核工作台",
    action: "SQL阻断",
    user: "开发用户 张明",
    source: "客户中心-MySQL生产库",
    sqlType: "SELECT",
    decision: "直接阻断",
    risk: "critical",
    note: "WHERE 恒真条件命中注入特征，SQL 已阻断。",
    ip: "10.12.4.21",
    requestId: "REQ-SEED-008",
    sql: "select * from customer_info where 1=1;",
  },
  {
    id: "AUD-SEED-007",
    time: "2026-06-15 09:47:18",
    module: "SQL审核工作台",
    action: "SQL阻断",
    user: "账务用户 孙浩",
    source: "核心账务-Oracle生产库",
    sqlType: "SELECT",
    decision: "直接阻断",
    risk: "critical",
    note: "Oracle 连接检测到 LIMIT 方言冲突，避免跨库误执行。",
    ip: "10.12.3.77",
    requestId: "REQ-SEED-007",
    sql: "select * from customer_info limit 10;",
  },
  {
    id: "AUD-SEED-006",
    time: "2026-06-14 17:21:33",
    module: "SQL审核工作台",
    action: "SQL执行",
    user: "人事用户 周倩",
    source: "人事薪酬-DB2生产库",
    sqlType: "SELECT",
    decision: "放行执行",
    risk: "high",
    note: "薪酬表查询命中银行卡和薪资字段，结果已强制脱敏。",
    ip: "10.12.8.64",
    requestId: "REQ-SEED-006",
    sql: "select employee_name, mobile, bank_card, salary_amount from employee_salary where department_id = 12 fetch first 20 rows only;",
  },
  {
    id: "AUD-SEED-005",
    time: "2026-06-14 16:08:25",
    module: "权限分配",
    action: "角色调整",
    user: "DBA 管理员 王强",
    source: "权限中心",
    sqlType: "CONFIG",
    decision: "操作成功",
    risk: "low",
    note: "为核心账务复核角色补充 Oracle 数据源范围和 UPDATE 操作权限。",
    ip: "10.12.5.19",
    requestId: "REQ-SEED-005",
  },
  {
    id: "AUD-SEED-004",
    time: "2026-06-14 15:42:16",
    module: "数据库管理",
    action: "连接测试",
    user: "运维用户 李娜",
    source: "核心账务-Oracle生产库",
    sqlType: "CONNECT",
    decision: "连通",
    risk: "medium",
    note: "模拟 JDBC 握手耗时 86ms，连接状态由需复核更新为连通。",
    ip: "10.12.5.16",
    requestId: "REQ-SEED-004",
  },
  {
    id: "AUD-SEED-003",
    time: "2026-06-11 10:03:17",
    module: "DML审批",
    action: "提交审批",
    user: "运维用户 李娜",
    source: "实时风控-GaussDB生产库",
    sqlType: "UPDATE",
    decision: "进入审批",
    risk: "high",
    note: "生产库 DML 命中高风险变更规则。",
    ip: "10.12.5.16",
    requestId: "REQ-SEED-003",
    sql: "update customer_info set mobile = '13900008888' where id = 1001;",
  },
  {
    id: "AUD-SEED-002",
    time: "2026-06-11 09:28:41",
    module: "SQL审核工作台",
    action: "SQL阻断",
    user: "开发用户 张明",
    source: "客户中心-MySQL生产库",
    sqlType: "DELETE",
    decision: "直接阻断",
    risk: "critical",
    note: "delete 缺少 where 条件，疑似全表变更。",
    ip: "10.12.4.21",
    requestId: "REQ-SEED-002",
    sql: "delete from customer_info;",
  },
  {
    id: "AUD-SEED-001",
    time: "2026-06-11 09:12:05",
    module: "审计日志",
    action: "敏感查询审计",
    user: "审计用户 陈静",
    source: "核心账务-Oracle生产库",
    sqlType: "SELECT",
    decision: "放行执行",
    risk: "medium",
    note: "查询账务流水命中敏感对象，结果已脱敏。",
    ip: "10.12.3.84",
    requestId: "REQ-SEED-001",
    sql: "select account_no, debit_amount, credit_amount, balance from account_ledger where trade_time >= '2026-06-01' fetch first 20 rows only;",
  },
];

const sensitiveColumns = [
  "name",
  "employee_name",
  "id_card",
  "mobile",
  "address",
  "idcard",
  "account_no",
  "account_balance",
  "bank_card",
  "salary",
  "salary_amount",
  "device_fingerprint",
  "loan_contract",
];

const normalizeSql = (sql: string) => sql.trim().replace(/\s+/g, " ");

const getSqlType = (sql: string): SqlType => {
  const firstWord = normalizeSql(sql).split(" ")[0]?.toLowerCase();
  if (["select", "insert", "update", "delete"].includes(firstWord)) {
    return firstWord as SqlType;
  }
  return "unknown";
};

const cleanIdentifier = (value = "") =>
  value
    .replace(/[;,\s]/g, "")
    .replace(/[`"[\]]/g, "")
    .split(".")
    .pop()
    ?.toLowerCase() || "-";

const extractTableName = (sql: string, sqlType: SqlType) => {
  const normalized = normalizeSql(sql).toLowerCase();
  const patterns: Partial<Record<SqlType, RegExp>> = {
    select: /\bfrom\s+([`"\[\]\w.]+)/,
    update: /\bupdate\s+([`"\[\]\w.]+)/,
    delete: /\bfrom\s+([`"\[\]\w.]+)/,
    insert: /\binto\s+([`"\[\]\w.]+)/,
  };
  const match = normalized.match(
    patterns[sqlType] || /\bfrom\s+([`"\[\]\w.]+)/,
  );
  return cleanIdentifier(match?.[1]);
};

const containsSensitiveColumn = (sql: string) => {
  const lowerSql = sql.toLowerCase();
  return (
    sensitiveColumns.some((column) => lowerSql.includes(column)) ||
    lowerSql.includes("*")
  );
};

const hasWhere = (sql: string) => /\bwhere\b/i.test(sql);

const hasDialectMismatch = (sql: string, source: DemoDataSource) => {
  const lowerSql = sql.toLowerCase();
  if (source.dbType === "oracle") return /\blimit\b/i.test(lowerSql);
  if (source.dbType === "gaussdb")
    return /\brownum\b/i.test(lowerSql) || /\btop\s+\d+/i.test(lowerSql);
  if (source.dbType === "db2")
    return /\blimit\b/i.test(lowerSql) || /\btop\s+\d+/i.test(lowerSql);
  if (source.dbType === "mysql")
    return /\btop\s+\d+/i.test(lowerSql) || /\brownum\b/i.test(lowerSql);
  return false;
};

const ruleStrategyMap = new Map(ruleStrategies.map((rule) => [rule.id, rule]));

const buildRule = (
  id: string,
  name: string,
  risk: RiskLevel,
  action: RuleAction,
  description: string,
): RuleHit => ({ id, name, risk, action, description });

const buildStrategyRule = (id: string, description?: string): RuleHit => {
  const rule = ruleStrategyMap.get(id);

  if (!rule) {
    return buildRule(id, id, "medium", "提示", description || "规则未配置。");
  }

  return buildRule(
    rule.id,
    rule.name,
    rule.risk,
    rule.action,
    description || rule.description,
  );
};

const riskScoreDelta: Record<RiskLevel, number> = {
  low: 5,
  medium: 25,
  high: 55,
  critical: 90,
};

const getRiskByScore = (score: number): RiskLevel => {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
};

const hasStackedStatements = (sql: string) =>
  /;\s*\S/.test(sql.trim().replace(/;+$/, ""));

const hasAlwaysTrueWhere = (sql: string) =>
  /\bwhere\b[\s\S]*(?:\b1\s*=\s*1\b|\btrue\b|(['"])([^'"]+)\1\s*=\s*\1\2\1)/i.test(
    sql,
  );

const hasSqlInjectionPattern = (sql: string) =>
  /\bor\s+1\s*=\s*1\b|\bunion\s+select\b|--|\/\*|\*\//i.test(sql);

const hasUnboundedSelect = (sql: string, sqlType: SqlType) =>
  sqlType === "select" &&
  !/\blimit\b|\bfetch\s+first\b|\brownum\b|\btop\s+\d+\b/i.test(sql);

const hasFullFuzzyLike = (sql: string) =>
  /\blike\s+['"]%[^'"]*['"]/i.test(sql);

const hasFunctionOrExpressionCondition = (sql: string) =>
  /\bwhere\b[\s\S]*(?:\b\w+\s*\([^)]*\)\s*(?:=|<|>|between|like)|\w+\s*[+\-*/]\s*\w+\s*(?:=|<|>))/i.test(
    sql,
  );

const hasUpdateDeleteLimitOrOrder = (sql: string, sqlType: SqlType) =>
  (sqlType === "update" || sqlType === "delete") &&
  (/\blimit\b|\border\s+by\b/i.test(sql));

const hasInNullCondition = (sql: string) =>
  /\b(?:not\s+)?in\s*\(\s*null\s*\)/i.test(sql);

const hasUnionWithoutAll = (sql: string) =>
  /\bunion\b(?!\s+all\b)/i.test(sql);

const hasProcedureOrTrigger = (sql: string) =>
  /\b(call|exec|execute)\b|\bcreate\s+(?:or\s+replace\s+)?(?:procedure|trigger)\b/i.test(
    sql,
  );

const hasViewUsage = (sql: string) =>
  /\bcreate\s+(?:or\s+replace\s+)?view\b|\bfrom\s+[`"\[]?\w*view\w*[`"\]]?\b/i.test(
    sql,
  );

const hasCountScan = (sql: string) => /\bcount\s*\(\s*(?:\*|\w+)\s*\)/i.test(sql);

const hasTimeSeriesObjectWithoutRange = (sql: string) =>
  /\b(log|audit|history|event|ledger|order_info|risk_event)\b/i.test(sql) &&
  !/\b(created_at|event_date|date|time|partition|dt)\b[\s\S]*(=|>|<|between|>=|<=)/i.test(
    sql,
  );

const dialectRuleId: Record<DbKind, string> = {
  mysql: "R-MYSQL-001",
  oracle: "R-ORA-001",
  gaussdb: "R-GAUSS-001",
  db2: "R-DB2-001",
};

export const isDml = (sqlType: SqlType) =>
  ["insert", "update", "delete"].includes(sqlType);

let idSequence = 0;

export const createId = (prefix: string) => {
  idSequence = (idSequence + 1) % 46656;

  return `${prefix}-${Date.now()
    .toString(36)
    .toUpperCase()}-${idSequence
    .toString(36)
    .toUpperCase()
    .padStart(3, "0")}`;
};

export const analyzeSql = (
  sql: string,
  source: DemoDataSource,
  user: DemoUser,
  maskingEnabled: boolean,
): ReviewResult => {
  const sqlType = getSqlType(sql);
  const tableName = extractTableName(sql, sqlType);
  const lowerSql = sql.toLowerCase();
  const ruleHits: RuleHit[] = [];
  const matchedRuleIds = new Set<string>();
  let score = 10;

  const hitRule = (
    ruleId: string,
    description?: string,
    scoreDelta?: number,
  ) => {
    if (matchedRuleIds.has(ruleId)) return;

    const strategy = ruleStrategyMap.get(ruleId);
    ruleHits.push(buildStrategyRule(ruleId, description));
    matchedRuleIds.add(ruleId);
    score += scoreDelta ?? (strategy ? riskScoreDelta[strategy.risk] : 25);
  };

  if (sqlType === "unknown" || hasStackedStatements(sql)) {
    hitRule(
      "R-COM-001",
      hasStackedStatements(sql)
        ? "检测到多语句或堆叠提交，普通审核通道不允许执行。"
        : "仅演示 SELECT 与 INSERT/UPDATE/DELETE，其他语句默认阻断。",
    );
  }

  if (!user.allowedSources.includes(source.id)) {
    hitRule("R-COM-002", `${user.name} 未被授权访问 ${source.name}。`);
  }

  if (sqlType !== "unknown" && !user.operations.includes(sqlType)) {
    hitRule(
      "R-COM-003",
      `${user.role} 不具备 ${sqlType.toUpperCase()} 操作权限。`,
    );
  }

  if (tableName !== "-" && !source.authorizedTables.includes(tableName)) {
    hitRule("R-COM-004", `${tableName} 不在当前数据源授权表清单中。`);
  }

  if (hasSqlInjectionPattern(sql)) {
    hitRule("R-COM-010");
  }

  if (hasAlwaysTrueWhere(sql)) {
    hitRule("R-COM-016");
  }

  if ((sqlType === "update" || sqlType === "delete") && !hasWhere(sql)) {
    hitRule("R-COM-005", "UPDATE/DELETE 未带 WHERE，疑似全表变更。");
  }

  if (isDml(sqlType) && hasWhere(sql)) {
    hitRule(
      "R-COM-006",
      `${source.environment}环境 DML 需提交审批，审批通过后方可执行。`,
      source.environment === "生产" ? 55 : 35,
    );
  }

  if (sqlType === "select" && /\bselect\s+\*/i.test(sql)) {
    hitRule("R-COM-009");
  }

  if (containsSensitiveColumn(sql) && sqlType === "select") {
    hitRule(
      "R-COM-007",
      maskingEnabled
        ? "命中姓名、身份证号、手机号、地址等字段，返回结果将动态脱敏。"
        : "当前用户具备明文查看权限，本次查询仍记录敏感访问审计。",
      maskingEnabled ? 20 : 45,
    );
  }

  if (hasDialectMismatch(sql, source)) {
    hitRule(
      dialectRuleId[source.dbType],
      `${source.name} 使用 ${source.dialect}，当前 SQL 存在方言冲突。`,
    );
  }

  if (/\b(drop|truncate|alter)\b/i.test(sql)) {
    hitRule("R-COM-008", "DROP、TRUNCATE、ALTER 等语句不在演示放行范围内。");
  }

  if (hasUnboundedSelect(sql, sqlType)) {
    hitRule("R-COM-011");
  }

  if (/\b(begin|commit|rollback|savepoint|set\s+autocommit)\b/i.test(sql)) {
    hitRule("R-COM-012");
  }

  if (sqlType === "select" && (lowerSql.match(/\bjoin\b/g) || []).length >= 3) {
    hitRule("R-COM-013");
  }

  if (hasTimeSeriesObjectWithoutRange(sql)) {
    hitRule("R-COM-014");
  }

  if (hasFullFuzzyLike(sql)) {
    hitRule("R-COM-017");
  }

  if (/\bhaving\b/i.test(sql)) {
    hitRule("R-COM-018");
  }

  if (hasFunctionOrExpressionCondition(sql)) {
    hitRule("R-COM-019");
  }

  if (hasUpdateDeleteLimitOrOrder(sql, sqlType)) {
    hitRule("R-COM-020");
  }

  if (hasInNullCondition(sql)) {
    hitRule("R-COM-021");
  }

  if (hasUnionWithoutAll(sql)) {
    hitRule("R-COM-022");
  }

  if (hasProcedureOrTrigger(sql)) {
    hitRule("R-COM-023");
  }

  if (hasViewUsage(sql)) {
    hitRule("R-COM-024");
  }

  if (hasCountScan(sql)) {
    hitRule("R-COM-025");
  }

  if (source.dbType === "mysql") {
    if (/\bload\s+data\b|\binto\s+outfile\b|\bload_file\s*\(/i.test(sql)) {
      hitRule("R-MYSQL-003");
    }

    if (/\bon\s+duplicate\s+key\s+update\b/i.test(sql)) {
      hitRule("R-MYSQL-004");
    }

    if (/\bset\s+sql_safe_updates\s*=\s*0\b|\bsql_log_bin\s*=\s*0\b/i.test(sql)) {
      hitRule("R-MYSQL-005");
    }

    if (/\b(mysql|performance_schema|information_schema)\./i.test(sql)) {
      hitRule("R-MYSQL-006");
    }

    if (/\block\s+tables\b|\bflush\s+tables\s+with\s+read\s+lock\b|\bget_lock\s*\(/i.test(sql)) {
      hitRule("R-MYSQL-007");
    }

    if (hasUpdateDeleteLimitOrOrder(sql, sqlType) && /\blimit\b/i.test(sql)) {
      hitRule("R-MYSQL-008");
    }

    if (/\bcall\b/i.test(sql)) {
      hitRule("R-MYSQL-009");
    }
  }

  if (source.dbType === "oracle") {
    if (/@\w+/i.test(sql)) {
      hitRule("R-ORA-002");
    }

    if (/\bmerge\s+into\b/i.test(sql)) {
      hitRule("R-ORA-003");
    }

    if (/\b(dbms_|utl_|sys\.|execute\s+immediate)\b/i.test(sql)) {
      hitRule("R-ORA-004");
    }

    if (/\bfor\s+update\b|\bnowait\b/i.test(sql)) {
      hitRule("R-ORA-006");
    }

    if (/\bconnect\s+by\b|\bwith\s+recursive\b/i.test(sql)) {
      hitRule("R-ORA-007");
    }

    if (/\balter\s+session\b|\bset\s+role\b|\bcurrent_schema\b/i.test(sql)) {
      hitRule("R-ORA-008");
    }

    if (/\/\*\+[\s\S]*(parallel|full)\b/i.test(sql)) {
      hitRule("R-ORA-009");
    }
  }

  if (source.dbType === "gaussdb") {
    if (/\bcopy\b[\s\S]*(from|to|program|stdout)\b/i.test(sql)) {
      hitRule("R-GAUSS-002");
    }

    if (/\bcreate\s+(extension|function)\b|\blanguage\s+plpythonu\b/i.test(sql)) {
      hitRule("R-GAUSS-003");
    }

    if (/\breturning\b/i.test(sql) && containsSensitiveColumn(sql)) {
      hitRule("R-GAUSS-004");
    }

    if (/\b(vacuum|analyze|reindex|cluster)\b/i.test(sql)) {
      hitRule("R-GAUSS-005");
    }

    if (/\bfor\s+(update|share)\b/i.test(sql)) {
      hitRule("R-GAUSS-006");
    }

    if (/\b(pg_catalog|information_schema|pg_stat)\b/i.test(sql)) {
      hitRule("R-GAUSS-007");
    }

    if (/\bon\s+conflict\s+do\s+update\b/i.test(sql)) {
      hitRule("R-GAUSS-008");
    }
  }

  if (source.dbType === "db2") {
    if (/\b(load|import|export|admin_cmd)\b/i.test(sql)) {
      hitRule("R-DB2-002");
    }

    if (/\bwith\s+ur\b/i.test(sql)) {
      hitRule("R-DB2-003");
    }

    if (/\b(employee_salary|salary_amount|bank_card)\b/i.test(sql)) {
      hitRule("R-DB2-004");
    }

    if (/\balter\s+sequence\b|\brestart\s+with\b|\balter\s+table\b[\s\S]*\balter\s+column\b/i.test(sql)) {
      hitRule("R-DB2-005");
    }

    if (/\bwith\s+(rs|rr)\b/i.test(sql)) {
      hitRule("R-DB2-006");
    }

    if (/\b(syscat|sysibm|sysstat)\b/i.test(sql)) {
      hitRule("R-DB2-007");
    }

    if (/\bwith\s+hold\b|\bdeclare\s+cursor\b/i.test(sql)) {
      hitRule("R-DB2-008");
    }

    if (/\bmaterialized\s+query\s+table\b|\brefresh\s+table\b/i.test(sql)) {
      hitRule("R-DB2-009");
    }
  }

  const risk = getRiskByScore(Math.min(score, 100));
  const hasBlockRule = ruleHits.some((rule) => rule.action === "阻断");
  const needsApproval =
    ruleHits.some((rule) => rule.action === "审批") || isDml(sqlType);
  const decision: Decision = hasBlockRule
    ? "blocked"
    : needsApproval
    ? "approval"
    : "pass";
  const maskingApplied =
    sqlType === "select" && maskingEnabled && containsSensitiveColumn(sql);

  const summary =
    decision === "blocked"
      ? "命中阻断规则，SQL 不允许执行。"
      : decision === "approval"
      ? "SQL 进入审批流程，审批通过后才允许执行。"
      : maskingApplied
      ? "SQL 已通过审核，查询结果将按策略动态脱敏。"
      : "SQL 已通过审核，可直接执行。";

  if (ruleHits.length === 0) {
    ruleHits.push(
      buildRule(
        "R-000",
        "基础权限与语法检查通过",
        "low",
        "放行",
        "未命中风险规则。",
      ),
    );
  }

  return {
    id: createId("REV"),
    sql,
    sqlType,
    source,
    user,
    tableName,
    decision,
    risk,
    score: Math.min(score, 100),
    ruleHits,
    maskingApplied,
    summary,
  };
};

const maskName = (value: string) =>
  `${value.slice(0, 1)}${"*".repeat(Math.max(value.length - 1, 1))}`;
const maskIdCard = (value: string) =>
  `${value.slice(0, 3)}***********${value.slice(-4)}`;
const maskMobile = (value: string) =>
  `${value.slice(0, 3)}****${value.slice(-4)}`;
const maskAddress = (value: string) => `${value.slice(0, 7)}****`;
const maskBankCard = (value: string) =>
  `${value.slice(0, 4)} **** **** ${value.slice(-4)}`;
const maskAccountNo = (value: string) =>
  `${value.slice(0, 4)}********${value.slice(-4)}`;
const maskMoney = (value: string) => value.replace(/\d(?=\d{2})/g, "*");
const maskFingerprint = (value: string) =>
  `${value.slice(0, 8)}********${value.slice(-4)}`;

const splitSelectColumns = (value: string) => {
  const columns: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(depth - 1, 0);

    if (char === "," && depth === 0) {
      columns.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) columns.push(current.trim());
  return columns;
};

const normalizeColumnKey = (value: string) => {
  const withoutAlias = value
    .replace(/\s+as\s+[`"\[]?\w+[`"\]]?$/i, "")
    .replace(/\s+[`"\[]?\w+[`"\]]?$/i, "");
  return cleanIdentifier(withoutAlias).replace(/[^\w]/g, "_");
};

const getSelectedColumns = (sql: string, dataset: QueryDataset) => {
  const selectMatch = normalizeSql(sql).match(/\bselect\s+(.+?)\s+from\b/i);
  const selectClause = selectMatch?.[1] || "*";
  const datasetColumnsByKey = new Map(
    dataset.columns.map((column) => [column.dataIndex, column]),
  );

  if (selectClause.includes("*")) return dataset.columns;

  const selectedColumns = splitSelectColumns(selectClause).map((column) => {
    const dataIndex = normalizeColumnKey(column);
    const matchedColumn = datasetColumnsByKey.get(dataIndex);
    const fallbackColumn: QueryResultColumn = {
      title: dataIndex.replace(/_/g, " ").toUpperCase(),
      dataIndex,
      width: moneyColumnKeys.has(dataIndex) ? 120 : 140,
      align: moneyColumnKeys.has(dataIndex) ? "right" : "left",
    };

    return matchedColumn || fallbackColumn;
  });

  return selectedColumns.filter(
    (column, index, columns) =>
      columns.findIndex((item) => item.dataIndex === column.dataIndex) ===
      index,
  );
};

const getRowValue = (row: QueryResultRow, field: string) => row[field];

const sameSqlValue = (rowValue: QueryResultValue, expectedValue: string) => {
  const normalizedRowValue = String(rowValue);
  const normalizedExpectedValue = expectedValue.replace(/;$/, "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedExpectedValue)) {
    return normalizedRowValue.slice(0, 10) === normalizedExpectedValue;
  }

  return normalizedRowValue.toLowerCase() === normalizedExpectedValue.toLowerCase();
};

const compareSqlValue = (
  rowValue: QueryResultValue,
  operator: string,
  expectedValue: string,
) => {
  const normalizedRowValue = String(rowValue);
  const normalizedExpectedValue = expectedValue.replace(/;$/, "");
  const comparableRowValue = /^\d{4}-\d{2}-\d{2}$/.test(normalizedExpectedValue)
    ? normalizedRowValue.slice(0, 10)
    : normalizedRowValue;

  if (operator === ">=") return comparableRowValue >= normalizedExpectedValue;
  if (operator === "<=") return comparableRowValue <= normalizedExpectedValue;
  if (operator === ">") return comparableRowValue > normalizedExpectedValue;
  return comparableRowValue < normalizedExpectedValue;
};

const applyWherePreview = (rows: QueryResultRow[], sql: string) => {
  let nextRows = rows;

  for (const match of sql.matchAll(
    /\bdate\s*\(\s*(\w+)\s*\)\s*=\s*['"]([^'"]+)['"]/gi,
  )) {
    const [, field, expectedValue] = match;
    nextRows = nextRows.filter((row) => {
      const rowValue = getRowValue(row, field);
      return rowValue === undefined || sameSqlValue(rowValue, expectedValue);
    });
  }

  for (const match of sql.matchAll(/\b(\w+)\b\s+like\s+['"]([^'"]+)['"]/gi)) {
    const [, field, rawPattern] = match;
    const pattern = rawPattern.replace(/%/g, "").toLowerCase();
    nextRows = nextRows.filter((row) => {
      const rowValue = getRowValue(row, field);
      return (
        rowValue === undefined ||
        String(rowValue).toLowerCase().includes(pattern)
      );
    });
  }

  for (const match of sql.matchAll(
    /\b(\w+)\b\s*(>=|<=|>|<)\s*['"]?([^'"\s;)]+)['"]?/gi,
  )) {
    const [, field, operator, expectedValue] = match;
    nextRows = nextRows.filter((row) => {
      const rowValue = getRowValue(row, field);
      return (
        rowValue === undefined ||
        compareSqlValue(rowValue, operator, expectedValue)
      );
    });
  }

  for (const match of sql.matchAll(/\b(\w+)\b\s*=\s*['"]?([^'"\s;)]+)['"]?/gi)) {
    const [, field, expectedValue] = match;
    nextRows = nextRows.filter((row) => {
      const rowValue = getRowValue(row, field);
      return rowValue === undefined || sameSqlValue(rowValue, expectedValue);
    });
  }

  return nextRows;
};

const extractPreviewLimit = (sql: string) => {
  const limitMatch = sql.match(/\blimit\s+(\d+)/i);
  const fetchMatch = sql.match(/\bfetch\s+first\s+(\d+)\s+rows?\s+only\b/i);
  const rownumMatch = sql.match(/\brownum\s*<=\s*(\d+)/i);
  const topMatch = sql.match(/\btop\s+(\d+)/i);
  const rawLimit =
    limitMatch?.[1] || fetchMatch?.[1] || rownumMatch?.[1] || topMatch?.[1];

  return rawLimit ? Number(rawLimit) : undefined;
};

const maskQueryRows = (
  rows: QueryResultRow[],
  maskingApplied: boolean,
): QueryResultRow[] => {
  if (!maskingApplied) return rows;

  return rows.map<QueryResultRow>((row) => ({
    ...row,
    name: typeof row.name === "string" ? maskName(row.name) : row.name,
    employee_name:
      typeof row.employee_name === "string"
        ? maskName(row.employee_name)
        : row.employee_name,
    id_card:
      typeof row.id_card === "string" ? maskIdCard(row.id_card) : row.id_card,
    mobile:
      typeof row.mobile === "string" ? maskMobile(row.mobile) : row.mobile,
    address:
      typeof row.address === "string" ? maskAddress(row.address) : row.address,
    bank_card:
      typeof row.bank_card === "string"
        ? maskBankCard(row.bank_card)
        : row.bank_card,
    account_no:
      typeof row.account_no === "string"
        ? maskAccountNo(row.account_no)
        : row.account_no,
    account_balance:
      typeof row.account_balance === "string"
        ? maskMoney(row.account_balance)
        : row.account_balance,
    salary_amount:
      typeof row.salary_amount === "string"
        ? maskMoney(row.salary_amount)
        : row.salary_amount,
    device_fingerprint:
      typeof row.device_fingerprint === "string"
        ? maskFingerprint(row.device_fingerprint)
        : row.device_fingerprint,
  }));
};

export const buildQueryResultPreview = (
  review: ReviewResult | undefined,
  rowLimit: number,
): QueryResultPreview => {
  if (!review || review.sqlType !== "select") {
    return {
      tableName: review?.tableName || "-",
      columns: [],
      rows: [],
      emptyText: "仅 SELECT 查询会展示结果",
    };
  }

  if (review.decision !== "pass") {
    return {
      tableName: review.tableName,
      columns: [],
      rows: [],
      emptyText: "SQL 未放行执行，暂无查询结果",
    };
  }

  const dataset = queryDatasets[review.tableName];

  if (!dataset) {
    return {
      tableName: review.tableName,
      columns: [],
      rows: [],
      emptyText: `暂无 ${review.tableName} 的演示数据`,
    };
  }

  const selectedColumns = getSelectedColumns(review.sql, dataset);
  const sqlLimit = extractPreviewLimit(review.sql);
  const effectiveLimit = Math.min(sqlLimit || rowLimit, rowLimit);
  const rows = maskQueryRows(
    applyWherePreview(dataset.rows, review.sql).slice(0, effectiveLimit),
    review.maskingApplied,
  ).map((row, index) =>
    selectedColumns.reduce<QueryResultRow>(
      (result, column) => ({
        ...result,
        [column.dataIndex]: row[column.dataIndex] ?? "",
      }),
      { key: `${review.tableName}-${index}` },
    ),
  );

  return {
    tableName: review.tableName,
    columns: selectedColumns,
    rows,
    emptyText: rows.length ? "" : "当前 SQL 条件未匹配到数据",
  };
};

export const maskRows = (
  rows: CustomerRow[],
  maskingApplied: boolean,
): CustomerRow[] => {
  if (!maskingApplied) return rows;
  return rows.map((row) => ({
    ...row,
    name: maskName(row.name),
    idCard: maskIdCard(row.idCard),
    mobile: maskMobile(row.mobile),
    address: maskAddress(row.address),
  }));
};

export const seedApprovalTickets = (): ApprovalTicket[] => {
  const opsUser = demoUsers[1];
  const dbaUser = demoUsers[2];
  const hrUser = demoUsers[4];
  const financeUser = demoUsers[6];
  const mysql = dataSources[0];
  const oracle = dataSources[1];
  const gaussdb = dataSources[2];
  const db2 = dataSources[3];
  const salaryUpdateSql =
    "update employee_salary set salary_amount = '28600.00' where employee_id = 'E12001';";
  const ledgerUpdateSql =
    "update account_ledger set summary = '人工复核补记' where ledger_id = 'LED202606010001';";
  const mysqlRejectedSql =
    "update customer_info set mobile = '13900008888' where city = '北京' limit 10;";

  return [
    {
      id: "APR-SEED-001",
      review: analyzeSql(sqlTemplates[2].sql, gaussdb, opsUser, true),
      status: "pending",
      applicant: opsUser.name,
      applicantId: opsUser.id,
      createdAt: "2026-06-11 09:42:18",
      approverId: dbaUser.id,
      approver: dbaUser.name,
    },
    {
      id: "APR-SEED-002",
      review: analyzeSql(sqlTemplates[3].sql, gaussdb, dbaUser, false),
      status: "approved",
      applicant: dbaUser.name,
      applicantId: dbaUser.id,
      createdAt: "2026-06-11 10:15:06",
      approverId: dbaUser.id,
      approver: dbaUser.name,
      opinion: "风险可控，已确认回滚方案。",
    },
    {
      id: "APR-SEED-003",
      review: analyzeSql(salaryUpdateSql, db2, hrUser, true),
      status: "executed",
      applicant: hrUser.name,
      applicantId: hrUser.id,
      createdAt: "2026-06-14 16:36:20",
      approverId: dbaUser.id,
      approver: dbaUser.name,
      opinion: "审批通过后执行前校验一致，DML 已执行。",
    },
    {
      id: "APR-SEED-004",
      review: analyzeSql(mysqlRejectedSql, mysql, opsUser, true),
      status: "rejected",
      applicant: opsUser.name,
      applicantId: opsUser.id,
      createdAt: "2026-06-14 11:05:42",
      approverId: dbaUser.id,
      approver: dbaUser.name,
      opinion: "UPDATE 使用 LIMIT，变更目标不稳定，驳回后请补充主键条件。",
    },
    {
      id: "APR-SEED-005",
      review: analyzeSql(ledgerUpdateSql, oracle, financeUser, true),
      status: "pending",
      applicant: financeUser.name,
      applicantId: financeUser.id,
      createdAt: "2026-06-15 09:51:26",
      approverId: dbaUser.id,
      approver: dbaUser.name,
    },
  ];
};
