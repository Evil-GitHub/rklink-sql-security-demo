import {
  dataSources,
  type DemoUser,
  type SqlType,
} from './mock';
import { readMockDataSourceConnections } from './mockApi';
import {
  replaceUserSecurityPermissions,
  type StoredUserPermission,
} from './permissionStore';
import {
  getPermissionCodesByPlatformPermissions,
  getPlatformPermissionsByPermissionCodes,
  normalizePermissionCodes,
} from './routePermissions';
import { readDemoUserAccounts } from './userStore';

export type PermissionRoleStatus = 'enabled' | 'disabled';

export type PermissionRoleConfig = Omit<StoredUserPermission, 'id'>;

export type PermissionRole = Required<PermissionRoleConfig> & {
  id: string;
  name: string;
  description?: string;
  status: PermissionRoleStatus;
  userIds: string[];
};

export type PermissionRolePayload = Omit<PermissionRole, 'id'>;

const STORAGE_KEY = 'rklink-sql-security-demo:permission-roles:v6';
const ROLE_EVENT = 'rklink-sql-security-demo:permission-roles-change';

const sqlOperations: SqlType[] = ['select', 'insert', 'update', 'delete'];

const getCurrentDataSourceIds = () => {
  const ids = readMockDataSourceConnections().map((source) => source.id);
  return ids.length ? ids : dataSources.map((source) => source.id);
};

const cloneRole = (role: PermissionRole): PermissionRole => ({
  ...role,
  userIds: [...role.userIds],
  permissionCodes: [...(role.permissionCodes || [])],
  platformPermissions: [...(role.platformPermissions || [])],
  allowedSources: [...(role.allowedSources || [])],
  operations: [...(role.operations || [])],
});

const toRoleConfig = (user: DemoUser): Required<PermissionRoleConfig> => ({
  permissionCodes: getPermissionCodesByPlatformPermissions(user.platformPermissions),
  platformPermissions: [...user.platformPermissions],
  allowedSources: [...user.allowedSources],
  operations: [...user.operations],
  canViewPlain: user.canViewPlain,
  maskingDefault: user.maskingDefault,
  sensitiveAuditEnabled: user.sensitiveAuditEnabled,
  exportApprovalRequired: user.exportApprovalRequired,
  dmlApprovalMode: user.dmlApprovalMode,
  resultLimit: user.resultLimit,
  executionWindow: user.executionWindow,
});

const getDefaultConfig = () => toRoleConfig(readDemoUserAccounts()[0]);

const roleDescriptionMap: Record<string, string> = {
  dev: '研发人员提交 SQL 审核、查看样例和跟踪本人审批单；生产数据默认脱敏，变更需走审批。',
  ops: '生产运维在维护窗口内处理连接、变更和审批；全部生产源可见但敏感字段不授明文。',
  dba: '数据库平台管理员维护连接、驱动、规则和敏感资产；具备受控明文授权并强制留痕。',
  auditor: '安全合规角色查看资产、规则、审批和审计证据；仅允许审计视图和脱敏样例。',
  hr: '薪酬专员处理人事薪酬库查询和指定更新；姓名、手机号、银行卡等字段强制脱敏。',
  risk: '风控分析师只读风险事件、设备指纹和客户快照；不可提交 DML，导出需审批。',
  finance: '核心账务复核员处理 Oracle 核心账务复核场景；更新类操作需双人复核。',
};

const createSeedPermissionRoles = (): PermissionRole[] =>
  readDemoUserAccounts().map((user) => ({
    id: `role-${user.id}`,
    name: user.role,
    description:
      roleDescriptionMap[user.id] || `${user.dataScope}；${user.fieldScope}`,
    status: 'enabled',
    userIds: [user.id],
    ...toRoleConfig(user),
  }));

const normalizeList = <T extends string>(
  value: unknown,
  allowedValues: T[],
  fallback: T[],
) => {
  if (!Array.isArray(value)) return [...fallback];
  const allowed = new Set(allowedValues);
  const normalized = value.map(String).filter((item): item is T => allowed.has(item as T));
  return normalized.length ? Array.from(new Set(normalized)) : [...fallback];
};

const normalizeStringList = (
  value: unknown,
  allowedValues: string[],
  fallback: string[],
) => {
  if (!Array.isArray(value)) return [...fallback];
  const allowed = new Set(allowedValues);
  const normalized = value.map(String).filter((item) => allowed.has(item));
  return normalized.length ? Array.from(new Set(normalized)) : [...fallback];
};

const normalizeUserIds = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const demoUserIds = new Set(readDemoUserAccounts().map((user) => user.id));

  return Array.from(
    new Set(value.map(String).filter((userId) => demoUserIds.has(userId))),
  );
};

const normalizeRole = (role: Partial<PermissionRole>): PermissionRole => {
  const defaultConfig = getDefaultConfig();
  const canViewPlain = role.canViewPlain ?? defaultConfig.canViewPlain;
  const permissionCodes = normalizePermissionCodes(
    role.permissionCodes ||
      getPermissionCodesByPlatformPermissions(role.platformPermissions),
    defaultConfig.permissionCodes,
  );

  return {
    id: String(role.id || `role-${Date.now().toString(36)}`),
    name: String(role.name || '未命名角色'),
    description: role.description || '',
    status: role.status === 'disabled' ? 'disabled' : 'enabled',
    userIds: normalizeUserIds(role.userIds),
    permissionCodes,
    platformPermissions: getPlatformPermissionsByPermissionCodes(permissionCodes),
    allowedSources: normalizeStringList(
      role.allowedSources,
      getCurrentDataSourceIds(),
      defaultConfig.allowedSources,
    ),
    operations: normalizeList(role.operations, sqlOperations, defaultConfig.operations),
    canViewPlain,
    maskingDefault: canViewPlain
      ? role.maskingDefault ?? defaultConfig.maskingDefault
      : true,
    sensitiveAuditEnabled:
      role.sensitiveAuditEnabled ?? defaultConfig.sensitiveAuditEnabled,
    exportApprovalRequired:
      role.exportApprovalRequired ?? defaultConfig.exportApprovalRequired,
    dmlApprovalMode: role.dmlApprovalMode || defaultConfig.dmlApprovalMode,
    resultLimit: role.resultLimit || defaultConfig.resultLimit,
    executionWindow: role.executionWindow || defaultConfig.executionWindow,
  };
};

const readStoredRoles = (): PermissionRole[] | undefined => {
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return undefined;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((role) => normalizeRole(role as Partial<PermissionRole>))
      : undefined;
  } catch {
    return undefined;
  }
};

const writePermissionRoles = (roles: PermissionRole[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(roles.map((role) => cloneRole(role))),
  );
  window.dispatchEvent(new Event(ROLE_EVENT));
};

const uniqueItems = <T extends string>(items: T[]) => Array.from(new Set(items));

const createUnassignedUserPermission = (user: DemoUser): StoredUserPermission => ({
  id: user.id,
  permissionCodes: getPermissionCodesByPlatformPermissions(['overview']),
  platformPermissions: ['overview'],
  allowedSources: [],
  operations: ['select'],
  canViewPlain: false,
  maskingDefault: true,
  sensitiveAuditEnabled: true,
  exportApprovalRequired: true,
  dmlApprovalMode: '未分配角色，不可提交 DML',
  resultLimit: 50,
  executionWindow: '未授权',
});

const mergeRolePermission = (
  current: StoredUserPermission,
  role: PermissionRole,
): StoredUserPermission => {
  const canViewPlain = Boolean(current.canViewPlain || role.canViewPlain);
  const permissionCodes = uniqueItems([
    ...(current.permissionCodes || []),
    ...role.permissionCodes,
  ]);

  return {
    id: current.id,
    permissionCodes,
    platformPermissions: getPlatformPermissionsByPermissionCodes(permissionCodes),
    allowedSources: uniqueItems([
      ...(current.allowedSources || []),
      ...role.allowedSources,
    ]),
    operations: uniqueItems([...(current.operations || []), ...role.operations]),
    canViewPlain,
    maskingDefault: canViewPlain
      ? Boolean(current.maskingDefault && role.maskingDefault)
      : true,
    sensitiveAuditEnabled: Boolean(
      current.sensitiveAuditEnabled || role.sensitiveAuditEnabled,
    ),
    exportApprovalRequired: Boolean(
      current.exportApprovalRequired || role.exportApprovalRequired,
    ),
    dmlApprovalMode: role.dmlApprovalMode,
    resultLimit: Math.max(current.resultLimit || 0, role.resultLimit),
    executionWindow: role.executionWindow,
  };
};

export const readPermissionRoles = () =>
  (readStoredRoles() ?? createSeedPermissionRoles()).map((role) =>
    cloneRole(role),
  );

export const getPermissionRole = (id?: string) =>
  readPermissionRoles().find((role) => role.id === id);

export const syncAllRolePermissionsToUsers = (
  roles: PermissionRole[] = readPermissionRoles(),
) => {
  const users = readDemoUserAccounts();
  const permissionMap = new Map(
    users.map((user) => [user.id, createUnassignedUserPermission(user)]),
  );

  roles
    .filter((role) => role.status === 'enabled')
    .forEach((role) => {
      role.userIds.forEach((userId) => {
        const current = permissionMap.get(userId);
        if (current) {
          permissionMap.set(userId, mergeRolePermission(current, role));
        }
      });
    });

  replaceUserSecurityPermissions(Array.from(permissionMap.values()));
};

export const createPermissionRole = (payload: PermissionRolePayload) => {
  const roles = readPermissionRoles();
  const role = normalizeRole({
    ...payload,
    id: `role-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
  });
  const next = [...roles, role];
  writePermissionRoles(next);
  syncAllRolePermissionsToUsers(next);
  return role;
};

export const updatePermissionRole = (
  roleId: string,
  payload: PermissionRolePayload,
) => {
  const roles = readPermissionRoles();
  const next = roles.map((role) =>
    role.id === roleId ? normalizeRole({ ...role, ...payload, id: roleId }) : role,
  );
  writePermissionRoles(next);
  syncAllRolePermissionsToUsers(next);
  return getPermissionRole(roleId);
};

export const updatePermissionRoleStatus = (
  roleId: string,
  status: PermissionRoleStatus,
) => {
  const roles = readPermissionRoles();
  const next = roles.map((role) =>
    role.id === roleId ? { ...role, status } : role,
  );
  writePermissionRoles(next);
  syncAllRolePermissionsToUsers(next);
};

export const updateUserPermissionRoles = (
  userId: string,
  roleIds: string[],
) => {
  const roleIdSet = new Set(roleIds);
  const next = readPermissionRoles().map((role) => {
    const userIds = role.userIds.filter((item) => item !== userId);

    return roleIdSet.has(role.id)
      ? { ...role, userIds: uniqueItems([...userIds, userId]) }
      : { ...role, userIds };
  });

  writePermissionRoles(next);
  syncAllRolePermissionsToUsers(next);
  return next;
};

export const deletePermissionRoles = (roleIds: string[]) => {
  const roleIdSet = new Set(roleIds);
  const next = readPermissionRoles().filter((role) => !roleIdSet.has(role.id));
  writePermissionRoles(next);
  syncAllRolePermissionsToUsers(next);
};

export const resetPermissionRoles = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(ROLE_EVENT));
  }
  syncAllRolePermissionsToUsers(createSeedPermissionRoles());
  return readPermissionRoles();
};

export const subscribePermissionRoleChange = (listener: () => void) => {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(ROLE_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(ROLE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
};
