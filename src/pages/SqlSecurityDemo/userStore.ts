import {
  createId,
  dataSources,
  demoUsers,
  type DemoUser,
  type PlatformFunction,
  type SqlType,
} from './mock';

export type DemoUserPayload = Pick<
  DemoUser,
  | 'account'
  | 'name'
  | 'department'
  | 'employeeNo'
  | 'position'
  | 'role'
  | 'status'
  | 'dataScope'
  | 'fieldScope'
> &
  Partial<
    Pick<
      DemoUser,
      | 'lastLoginAt'
      | 'platformPermissions'
      | 'maskingDefault'
      | 'canViewPlain'
      | 'sensitiveAuditEnabled'
      | 'exportApprovalRequired'
      | 'dmlApprovalMode'
      | 'resultLimit'
      | 'executionWindow'
      | 'allowedSources'
      | 'operations'
    >
  >;

const STORAGE_KEY = 'rklink-sql-security-demo:users:v1';
const USER_EVENT = 'rklink-sql-security-demo:users-change';

const platformFunctions: PlatformFunction[] = [
  'overview',
  'console',
  'sqlTemplates',
  'database',
  'assets',
  'permissions',
  'rules',
  'approval',
  'audit',
];
const sqlOperations: SqlType[] = ['select', 'insert', 'update', 'delete'];
const dataSourceIds = dataSources.map((source) => source.id);

const cloneUser = (user: DemoUser): DemoUser => ({
  ...user,
  platformPermissions: [...user.platformPermissions],
  allowedSources: [...user.allowedSources],
  operations: [...user.operations],
});

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const uniqueItems = <T extends string>(items: T[]) => Array.from(new Set(items));

const normalizeText = (value: unknown, fallback = '') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const normalizeList = <T extends string>(
  value: unknown,
  allowedValues: T[],
  fallback: T[],
) => {
  if (!Array.isArray(value)) return [...fallback];

  const allowedValueSet = new Set(allowedValues);
  const normalized = value
    .map(String)
    .filter((item): item is T => allowedValueSet.has(item as T));

  return normalized.length ? uniqueItems(normalized) : [...fallback];
};

const normalizeStringList = (
  value: unknown,
  allowedValues: string[],
  fallback: string[],
) => {
  if (!Array.isArray(value)) return [...fallback];

  const allowedValueSet = new Set(allowedValues);
  const normalized = value.map(String).filter((item) => allowedValueSet.has(item));

  return normalized.length ? uniqueItems(normalized) : [...fallback];
};

const createRestrictedUser = (): Omit<DemoUser, 'id'> => ({
  account: '',
  name: '',
  department: '',
  employeeNo: '',
  position: '',
  role: '待分配角色',
  status: '在职',
  lastLoginAt: '未登录',
  platformPermissions: ['overview'],
  dataScope: '未分配角色；仅保留总览访问',
  fieldScope: '未授权业务字段',
  maskingDefault: true,
  canViewPlain: false,
  sensitiveAuditEnabled: true,
  exportApprovalRequired: true,
  dmlApprovalMode: '未分配角色，不可提交 DML',
  resultLimit: 50,
  executionWindow: '未授权',
  allowedSources: [],
  operations: ['select'],
});

const normalizeUser = (
  user: Partial<DemoUser>,
  fallback: DemoUser | Omit<DemoUser, 'id'> = createRestrictedUser(),
): DemoUser => {
  const canViewPlain = Boolean(user.canViewPlain ?? fallback.canViewPlain);
  const normalizedId = normalizeText(user.id);

  return {
    id: normalizedId || createId('user').toLowerCase(),
    account: normalizeText(user.account, fallback.account),
    name: normalizeText(user.name, fallback.name),
    department: normalizeText(user.department, fallback.department),
    employeeNo: normalizeText(user.employeeNo, fallback.employeeNo),
    position: normalizeText(user.position, fallback.position),
    role: normalizeText(user.role, fallback.role),
    status: user.status === '锁定' ? '锁定' : '在职',
    lastLoginAt: normalizeText(user.lastLoginAt, fallback.lastLoginAt),
    platformPermissions: normalizeList(
      user.platformPermissions,
      platformFunctions,
      fallback.platformPermissions,
    ),
    dataScope: normalizeText(user.dataScope, fallback.dataScope),
    fieldScope: normalizeText(user.fieldScope, fallback.fieldScope),
    maskingDefault: canViewPlain
      ? Boolean(user.maskingDefault ?? fallback.maskingDefault)
      : true,
    canViewPlain,
    sensitiveAuditEnabled: Boolean(
      user.sensitiveAuditEnabled ?? fallback.sensitiveAuditEnabled,
    ),
    exportApprovalRequired: Boolean(
      user.exportApprovalRequired ?? fallback.exportApprovalRequired,
    ),
    dmlApprovalMode: normalizeText(user.dmlApprovalMode, fallback.dmlApprovalMode),
    resultLimit: Number(user.resultLimit || fallback.resultLimit),
    executionWindow: normalizeText(user.executionWindow, fallback.executionWindow),
    allowedSources: normalizeStringList(
      user.allowedSources,
      dataSourceIds,
      fallback.allowedSources,
    ),
    operations: normalizeList(user.operations, sqlOperations, fallback.operations),
  };
};

const readStoredUsers = () => {
  if (!canUseStorage()) return undefined;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.map((item) => normalizeUser(item as Partial<DemoUser>))
      : undefined;
  } catch {
    return undefined;
  }
};

const writeUserStore = (users: DemoUser[]) => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(users.map((user) => cloneUser(user))),
  );
  window.dispatchEvent(new Event(USER_EVENT));
};

export const readDemoUserAccounts = () =>
  (readStoredUsers() ?? demoUsers.map((user) => normalizeUser(user))).map(
    (user) => cloneUser(user),
  );

export const getDemoUserAccount = (userId?: string) =>
  readDemoUserAccounts().find((user) => user.id === userId);

export const createDemoUserAccount = (payload: DemoUserPayload) => {
  const users = readDemoUserAccounts();
  const user = normalizeUser({
    ...createRestrictedUser(),
    ...payload,
    id: createId('user').toLowerCase(),
  });

  writeUserStore([...users, user]);
  return user;
};

export const updateDemoUserAccount = (
  userId: string,
  payload: DemoUserPayload,
) => {
  const users = readDemoUserAccounts();
  const next = users.map((user) =>
    user.id === userId ? normalizeUser({ ...user, ...payload, id: userId }, user) : user,
  );

  writeUserStore(next);
  return getDemoUserAccount(userId);
};

export const updateDemoUserStatus = (
  userId: string,
  status: DemoUser['status'],
) => {
  const users = readDemoUserAccounts();
  const next = users.map((user) =>
    user.id === userId ? { ...user, status } : user,
  );

  writeUserStore(next);
  return getDemoUserAccount(userId);
};

export const deleteDemoUserAccounts = (userIds: string[]) => {
  const deleteIdSet = new Set(userIds);
  const next = readDemoUserAccounts().filter((user) => !deleteIdSet.has(user.id));

  writeUserStore(next.length ? next : [normalizeUser(demoUsers[0])]);
  return readDemoUserAccounts();
};

export const resetDemoUserAccounts = () => {
  if (canUseStorage()) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(USER_EVENT));
  }

  return readDemoUserAccounts();
};

export const subscribeDemoUserChange = (listener: () => void) => {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(USER_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(USER_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
};
