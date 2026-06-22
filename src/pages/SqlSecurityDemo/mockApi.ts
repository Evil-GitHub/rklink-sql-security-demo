import dayjs from 'dayjs';
import {
  createId,
  dataSources,
  driverPackages,
  sourceTypeLabel,
  type ConnectionStatus,
  type DatabaseDriverPackage,
  type DemoDataSource,
  type DbKind,
} from './mock';

export type DataSourceConnectionPayload = {
  name: string;
  dbType: DbKind;
  environment: DemoDataSource['environment'];
  connectionMode?: DemoDataSource['connectionMode'];
  host: string;
  port: number;
  databaseName: string;
  schemaName?: string;
  owner: string;
  username: string;
  password?: string;
  driverId: string;
  sensitiveLevel: DemoDataSource['sensitiveLevel'];
  authorizedTables?: string;
  automaticScanning?: boolean;
};

export type DriverPackagePayload = {
  name: string;
  dbType: DbKind;
  driverIdentifier: string;
  driverClassName?: string;
  originalFileName?: string;
};

export type ConnectionTestResult = {
  status: ConnectionStatus;
  checkedAt: string;
  latency: number;
  message: string;
};

export type AuthorizedTableTreeNode = {
  title: string;
  key: string;
  selectable?: boolean;
  children?: AuthorizedTableTreeNode[];
};

export type AuthorizedTableTreeParams = {
  dbType?: DbKind;
  refreshSeed?: number;
  schemaName?: string;
  selectedTables?: string[];
};

type AuthorizedTableResource = {
  name: string;
  label: string;
  rows: string;
  sensitiveLevel: DemoDataSource['sensitiveLevel'];
};

let dataSourceStore: DemoDataSource[] = dataSources.map((item) => ({ ...item }));
let driverStore: DatabaseDriverPackage[] = driverPackages.map((item) => ({ ...item }));

const DATA_SOURCE_STORAGE_KEY = 'RKLINK_SQL_SECURITY_DATA_SOURCE_CONNECTIONS:v1';
const DRIVER_STORAGE_KEY = 'RKLINK_SQL_SECURITY_DRIVER_PACKAGES:v1';
const DATA_SOURCE_EVENT_NAME = 'rklink-sql-security-data-source-change';
const DRIVER_EVENT_NAME = 'rklink-sql-security-driver-change';

const wait = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const cloneDataSource = (item: DemoDataSource): DemoDataSource => ({
  ...item,
  schemas: [...item.schemas],
  authorizedTables: [...item.authorizedTables],
});

const cloneDriver = (item: DatabaseDriverPackage): DatabaseDriverPackage => ({
  ...item,
});

const readStoredDataSources = () => {
  if (!canUseStorage()) return undefined;

  try {
    const raw = window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as DemoDataSource[]).map(cloneDataSource)
      : undefined;
  } catch {
    return undefined;
  }
};

const writeDataSourceStore = (rows: DemoDataSource[]) => {
  dataSourceStore = rows.map(cloneDataSource);
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    DATA_SOURCE_STORAGE_KEY,
    JSON.stringify(dataSourceStore),
  );
  window.dispatchEvent(new CustomEvent(DATA_SOURCE_EVENT_NAME));
};

const readDataSourceStore = () => {
  const storedRows = readStoredDataSources();
  if (storedRows) {
    dataSourceStore = storedRows;
  }
  return dataSourceStore.map(cloneDataSource);
};

const readStoredDrivers = () => {
  if (!canUseStorage()) return undefined;

  try {
    const raw = window.localStorage.getItem(DRIVER_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as DatabaseDriverPackage[]).map(cloneDriver)
      : undefined;
  } catch {
    return undefined;
  }
};

const writeDriverStore = (rows: DatabaseDriverPackage[]) => {
  driverStore = rows.map(cloneDriver);
  if (!canUseStorage()) return;
  window.localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(driverStore));
  window.dispatchEvent(new CustomEvent(DRIVER_EVENT_NAME));
};

const readDriverStore = () => {
  const storedRows = readStoredDrivers();
  if (storedRows) {
    driverStore = storedRows;
  }
  return driverStore.map(cloneDriver);
};

const authorizedTableCatalog: Record<DbKind, AuthorizedTableResource[]> = {
  mysql: [
    { name: 'customer_info', label: '客户基础信息表', rows: '1280万行', sensitiveLevel: '高' },
    { name: 'order_info', label: '订单主表', rows: '4200万行', sensitiveLevel: '中' },
    { name: 'risk_event', label: '风险事件流水', rows: '860万行', sensitiveLevel: '高' },
    { name: 'customer_contact', label: '客户联系方式', rows: '1260万行', sensitiveLevel: '高' },
    { name: 'audit_log', label: '业务审计日志', rows: '2.1亿行', sensitiveLevel: '中' },
  ],
  oracle: [
    { name: 'customer_info', label: '核心客户档案', rows: '960万行', sensitiveLevel: '高' },
    { name: 'account_ledger', label: '账户流水', rows: '7.8亿行', sensitiveLevel: '高' },
    { name: 'loan_contract', label: '贷款合同', rows: '240万行', sensitiveLevel: '高' },
    { name: 'repayment_plan', label: '还款计划', rows: '5200万行', sensitiveLevel: '中' },
    { name: 'audit_log', label: '核心审计日志', rows: '1.4亿行', sensitiveLevel: '中' },
  ],
  gaussdb: [
    { name: 'risk_event', label: '实时风险事件', rows: '1900万行', sensitiveLevel: '高' },
    { name: 'customer_info', label: '风控客户快照', rows: '1180万行', sensitiveLevel: '高' },
    { name: 'device_fingerprint', label: '设备指纹', rows: '6800万行', sensitiveLevel: '高' },
    { name: 'model_score', label: '模型评分结果', rows: '2.6亿行', sensitiveLevel: '中' },
    { name: 'audit_log', label: '风控审计日志', rows: '9300万行', sensitiveLevel: '中' },
  ],
  db2: [
    { name: 'employee_salary', label: '员工薪酬', rows: '38万行', sensitiveLevel: '高' },
    { name: 'employee_profile', label: '员工档案', rows: '42万行', sensitiveLevel: '高' },
    { name: 'department_info', label: '部门信息', rows: '1.2万行', sensitiveLevel: '低' },
    { name: 'salary_adjustment', label: '薪酬调整记录', rows: '86万行', sensitiveLevel: '高' },
    { name: 'audit_log', label: '人事审计日志', rows: '360万行', sensitiveLevel: '中' },
  ],
};

const refreshedAuthorizedTableCatalog: Record<DbKind, AuthorizedTableResource[]> = {
  mysql: [
    { name: 'customer_tag_snapshot', label: '客户标签快照', rows: '980万行', sensitiveLevel: '中' },
  ],
  oracle: [
    { name: 'credit_limit_change', label: '授信额度变更', rows: '420万行', sensitiveLevel: '高' },
  ],
  gaussdb: [
    { name: 'model_feature_store', label: '模型特征宽表', rows: '3.2亿行', sensitiveLevel: '高' },
  ],
  db2: [
    { name: 'benefit_payment', label: '福利发放记录', rows: '62万行', sensitiveLevel: '高' },
  ],
};

const createJdbcUrl = (payload: DataSourceConnectionPayload) => {
  const host = `${payload.host}:${payload.port}`;
  if (payload.dbType === 'mysql') {
    return `jdbc:mysql://${host}/${payload.databaseName}?useSSL=true`;
  }
  if (payload.dbType === 'oracle') {
    return `jdbc:oracle:thin:@//${host}/${payload.databaseName}`;
  }
  if (payload.dbType === 'gaussdb') {
    return `jdbc:gaussdb://${host}/${payload.databaseName}`;
  }
  return `jdbc:db2://${host}/${payload.databaseName}`;
};

const parseAuthorizedTables = (value?: string) =>
  (value === undefined ? 'customer_info, audit_log' : value)
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

const buildSchemas = (payload: DataSourceConnectionPayload) => {
  if (payload.schemaName?.trim()) {
    return [payload.schemaName.trim()];
  }

  if (payload.dbType === 'oracle') return ['CORE_ACCOUNT'];
  if (payload.dbType === 'gaussdb') return ['risk_rt'];
  if (payload.dbType === 'db2') return ['HR_SALARY'];
  return [payload.databaseName || 'crm_core'];
};

export const queryMockDataSourceConnections = async () => {
  await wait();
  return {
    success: true,
    data: readDataSourceStore(),
  };
};

export const readMockDataSourceConnections = () => readDataSourceStore();

export const subscribeMockDataSourceConnections = (callback: () => void) => {
  if (!canUseStorage()) return () => undefined;

  window.addEventListener(DATA_SOURCE_EVENT_NAME, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(DATA_SOURCE_EVENT_NAME, callback);
    window.removeEventListener('storage', callback);
  };
};

export const getMockDataSourceConnection = async (sourceId: string) => {
  await wait(260);
  return {
    success: true,
    data: readDataSourceStore().find((item) => item.id === sourceId),
  };
};

export const queryMockDriverPackages = async () => {
  await wait();
  return {
    success: true,
    data: readDriverStore(),
  };
};

export const queryMockAuthorizedTableTree = async ({
  dbType = 'mysql',
  refreshSeed = 0,
  schemaName,
  selectedTables = [],
}: AuthorizedTableTreeParams = {}) => {
  await wait(260);
  const schema = schemaName?.trim() || '默认Schema';
  const catalog = [
    ...(authorizedTableCatalog[dbType] || []),
    ...(refreshSeed > 0 ? refreshedAuthorizedTableCatalog[dbType] || [] : []),
  ];
  const tableMap = new Map(
    catalog.map((table) => [table.name, table]),
  );
  selectedTables.forEach((tableName) => {
    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, {
        name: tableName,
        label: '已有授权表',
        rows: '-',
        sensitiveLevel: '中',
      });
    }
  });
  const tables = Array.from(tableMap.values());

  return {
    success: true,
    data: [
      {
        title: `${schema}（${tables.length} 张表）`,
        key: `schema:${schema}`,
        selectable: false,
        children: tables.map((tableName) => ({
          title: `${tableName.name}｜${tableName.label}｜${tableName.sensitiveLevel}｜${tableName.rows}`,
          key: tableName.name,
        })),
      },
    ] as AuthorizedTableTreeNode[],
  };
};

export const testMockDataSourceConnection = async (sourceId: string): Promise<ConnectionTestResult> => {
  await wait(680);
  const checkedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const latency = sourceId.includes('oracle') ? 86 : sourceId.includes('db2') ? 128 : 42;

  const nextStore = readDataSourceStore().map((item) =>
    item.id === sourceId
      ? {
          ...item,
          connectionStatus: 'online' as ConnectionStatus,
          lastTestAt: checkedAt,
        }
      : item,
  );
  writeDataSourceStore(nextStore);

  return {
    status: 'online',
    checkedAt,
    latency,
    message: `连接成功，模拟握手耗时 ${latency}ms。`,
  };
};

export const downloadMockDriverPackage = async (driverId: string) => {
  await wait(760);
  const nextStore = readDriverStore().map((item) =>
    item.id === driverId
      ? {
          ...item,
          status: 'downloaded' as DatabaseDriverPackage['status'],
        }
      : item,
  );
  writeDriverStore(nextStore);
  return {
    success: true,
    data: readDriverStore().find((item) => item.id === driverId),
  };
};

export const createMockDriverPackage = async (payload: DriverPackagePayload) => {
  await wait(520);
  const currentDrivers = readDriverStore();
  const fileName = payload.originalFileName || `${payload.driverIdentifier}.jar`;
  const newDriver: DatabaseDriverPackage = {
    id: createId(`driver-${payload.dbType}`),
    dbType: payload.dbType,
    name: payload.name,
    version: '1.0.0',
    driverIdentifier: payload.driverIdentifier,
    driverClassName: payload.driverClassName || '',
    originalFileName: fileName,
    fileName,
    size: '1.0 MB',
    vendor: '自定义',
    license: 'Tenant Custom',
    checksum: `SHA256: ${Date.now().toString(16).slice(-12)}`,
    compatibleVersions: sourceTypeLabel[payload.dbType],
    builtIn: false,
    defaultDriver: false,
    status: 'available',
    releaseDate: dayjs().format('YYYY-MM-DD'),
    dialect: currentDrivers.find((item) => item.dbType === payload.dbType)?.dialect || sourceTypeLabel[payload.dbType],
    downloadUrl: `/mock-downloads/${fileName}`,
  };

  writeDriverStore([newDriver, ...currentDrivers]);
  return {
    success: true,
    data: { ...newDriver },
  };
};

export const updateMockDriverPackage = async (driverId: string, payload: DriverPackagePayload) => {
  await wait(420);
  const nextStore = readDriverStore().map((driver) =>
    driver.id === driverId
      ? {
          ...driver,
          name: payload.name,
          dbType: payload.dbType,
          driverIdentifier: payload.driverIdentifier,
          driverClassName: payload.driverClassName || driver.driverClassName,
          originalFileName: payload.originalFileName || driver.originalFileName,
          fileName: payload.originalFileName || driver.fileName,
        }
      : driver,
  );
  writeDriverStore(nextStore);
  return {
    success: true,
    data: readDriverStore().find((item) => item.id === driverId),
  };
};

export const deleteMockDriverPackage = async (driverId: string) => {
  await wait(360);
  writeDriverStore(readDriverStore().filter((driver) => driver.id !== driverId));
  return { success: true };
};

export const createMockDataSourceConnection = async (payload: DataSourceConnectionPayload) => {
  await wait(520);
  const currentDataSources = readDataSourceStore();
  const driver = readDriverStore().find((item) => item.id === payload.driverId);
  const checkedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const schemas = buildSchemas(payload);
  const newSource: DemoDataSource = {
    id: createId(payload.dbType),
    name: payload.name,
    dbType: payload.dbType,
    environment: payload.environment,
    connectionMode: payload.connectionMode || 'HOST_PORT',
    clusterEnabled: false,
    automaticScanning: !!payload.automaticScanning,
    databaseName: payload.databaseName,
    host: `${payload.host}:${payload.port}`,
    jdbcUrl: createJdbcUrl(payload),
    username: payload.username,
    driverId: payload.driverId,
    connectionStatus: 'online',
    lastTestAt: checkedAt,
    accountPolicy: payload.environment === '生产' ? '生产连接默认只读，DML 需审批授权' : '非生产连接允许受控读写',
    dialect: driver?.dialect || sourceTypeLabel[payload.dbType],
    schemas,
    authorizedTables: parseAuthorizedTables(payload.authorizedTables),
    owner: payload.owner,
    schemaCount: schemas.length,
    tableCount: payload.environment === '生产' ? 48 : 12,
    sensitiveLevel: payload.sensitiveLevel,
  };

  writeDataSourceStore([newSource, ...currentDataSources]);
  return {
    success: true,
    data: { ...newSource },
  };
};

export const updateMockDataSourceConnection = async (sourceId: string, payload: DataSourceConnectionPayload) => {
  await wait(520);
  const driver = readDriverStore().find((item) => item.id === payload.driverId);
  const schemas = buildSchemas(payload);

  const nextStore = readDataSourceStore().map((source) =>
    source.id === sourceId
      ? {
          ...source,
          name: payload.name,
          dbType: payload.dbType,
          environment: payload.environment,
          connectionMode: payload.connectionMode || 'HOST_PORT',
          clusterEnabled: false,
          automaticScanning: !!payload.automaticScanning,
          databaseName: payload.databaseName,
          host: `${payload.host}:${payload.port}`,
          jdbcUrl: createJdbcUrl(payload),
          username: payload.username,
          driverId: payload.driverId,
          accountPolicy: payload.environment === '生产' ? '生产连接默认只读，DML 需审批授权' : '非生产连接允许受控读写',
          dialect: driver?.dialect || sourceTypeLabel[payload.dbType],
          schemas,
          authorizedTables: parseAuthorizedTables(payload.authorizedTables),
          owner: payload.owner,
          schemaCount: schemas.length,
          sensitiveLevel: payload.sensitiveLevel,
        }
      : source,
  );
  writeDataSourceStore(nextStore);

  return {
    success: true,
    data: readDataSourceStore().find((item) => item.id === sourceId),
  };
};

export const deleteMockDataSourceConnection = async (sourceId: string) => {
  await wait(360);
  writeDataSourceStore(
    readDataSourceStore().filter((source) => source.id !== sourceId),
  );
  return { success: true };
};

export const resetMockDataSourceConnections = () => {
  writeDataSourceStore(dataSources);
  return readDataSourceStore();
};

export const resetMockDriverPackages = () => {
  writeDriverStore(driverPackages);
  return readDriverStore();
};
