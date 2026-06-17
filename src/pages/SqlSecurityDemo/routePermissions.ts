import type { DemoUser, PlatformFunction } from './mock';
import {
  PERMISSIONS,
  PERMISSION_CODES,
  PERMISSION_CODE_SET,
  type PermissionNode,
} from './Permissions/menuPermissions';

const routeAccessMap = [
  ['/database/connections/create', 'db_connection:create'],
  ['/database/connections/detail', 'db_connection:read'],
  ['/database/connections/edit', 'db_connection:update'],
  ['/data-security/permissions/add', 'role:create'],
  ['/data-security/permissions/edit', 'role:update'],
  ['/data-security/permissions/details', 'role:read'],
  ['/sql-security/approval/executions', 'menu:approval_execution'],
  ['/sql-security/approval/list', 'menu:approval_list'],
  ['/sql-security/approval', 'menu:approval'],
  ['/sql-security/console', 'menu:sql_console'],
  ['/sql-security/sql-templates', 'menu:sql_template'],
  ['/sql-security/audit', 'menu:audit'],
  ['/data-security/assets', 'menu:asset'],
  ['/data-security/users', 'menu:user'],
  ['/data-security/permissions', 'menu:role'],
  ['/data-security/rules', 'menu:rule'],
  ['/overview', 'menu:overview'],
  ['/sql-security', 'menu:sql_security'],
  ['/database/connections', 'menu:db_connection'],
  ['/database/drivers', 'menu:jdbc_driver'],
  ['/database', 'menu:database'],
  ['/data-security', 'menu:security_governance'],
] as const;

const firstPathByAccessCode = [
  ['menu:overview', '/overview'],
  ['menu:sql_security', '/sql-security/console'],
  ['menu:sql_console', '/sql-security/console'],
  ['menu:sql_template', '/sql-security/sql-templates'],
  ['menu:db_connection', '/database/connections'],
  ['menu:jdbc_driver', '/database/drivers'],
  ['menu:asset', '/data-security/assets'],
  ['menu:user', '/data-security/users'],
  ['menu:role', '/data-security/permissions'],
  ['menu:rule', '/data-security/rules'],
  ['menu:security_governance', '/data-security/assets'],
  ['menu:approval', '/sql-security/approval/list'],
  ['menu:audit', '/sql-security/audit'],
] as const;

export const platformPermissionCodeMap: Record<PlatformFunction, string[]> = {
  overview: ['menu:overview'],
  console: ['menu:sql_security', 'menu:sql_console', 'sql_console:read', 'sql_console:execute'],
  sqlTemplates: ['menu:sql_security', 'menu:sql_template', 'sql_template:read'],
  database: [
    'menu:database',
    'menu:db_connection',
    'db_connection:read',
    'db_connection:create',
    'db_connection:update',
    'db_connection:delete',
    'menu:jdbc_driver',
    'jdbc_driver:read',
    'jdbc_driver:create',
    'jdbc_driver:update',
    'jdbc_driver:delete',
  ],
  assets: ['menu:security_governance', 'menu:asset', 'asset:read'],
  permissions: [
    'menu:security_governance',
    'menu:user',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'user:reset_password',
    'menu:role',
    'role:read',
    'role:create',
    'role:update',
    'role:delete',
  ],
  rules: [
    'menu:security_governance',
    'menu:rule',
    'rule:read',
    'rule:create',
    'rule:update',
    'rule:delete',
  ],
  approval: [
    'menu:sql_security',
    'menu:approval',
    'menu:approval_list',
    'approval:read',
    'approval:update',
    'menu:approval_execution',
    'execution:read',
  ],
  audit: ['menu:sql_security', 'menu:audit', 'audit:read'],
};

export type DemoCurrentUser = DemoUser & {
  permissionCodes: string[];
};

export type DemoUserWithPermissionCodes = DemoUser & {
  permissionCodes?: string[];
};

export const getPermissionCodesByPlatformPermissions = (
  permissions: PlatformFunction[] = [],
) =>
  Array.from(
    new Set(
      permissions.flatMap((permission) => platformPermissionCodeMap[permission] || []),
    ),
  );

export const getPlatformPermissionsByPermissionCodes = (
  permissionCodes: string[] = [],
): PlatformFunction[] => {
  const codeSet = new Set(permissionCodes);

  return (Object.keys(platformPermissionCodeMap) as PlatformFunction[]).filter(
    (permission) =>
      platformPermissionCodeMap[permission].some((code) => codeSet.has(code)),
  );
};

export const normalizePermissionCodes = (
  permissionCodes: string[] = [],
  fallback: string[] = [],
) => {
  const normalized = Array.from(
    new Set(
      permissionCodes
        .map(String)
        .filter((code) => PERMISSION_CODE_SET.has(code)),
    ),
  );

  return normalized.length ? normalized : [...fallback];
};

export const getAccessRecordByPermissionCodes = (
  permissionCodes: string[] = [],
) => {
  const userPermissions = normalizePermissionCodes(permissionCodes);
  const accessRecord = PERMISSION_CODES.reduce<Record<string, boolean>>(
    (record, key) => {
      record[key] = userPermissions.includes(key);
      return record;
    },
    {},
  );

  const propagateAccess = (menu: PermissionNode) => {
    if (!menu.children?.length) return;

    menu.children.forEach((child) => propagateAccess(child));
    accessRecord[menu.key] = menu.children.some(
      (child) => accessRecord[child.key],
    );
  };

  PERMISSIONS.forEach((menu) => propagateAccess(menu));

  return accessRecord;
};

export const getUserPermissionCodes = (
  user: DemoUserWithPermissionCodes | undefined,
) =>
  user?.permissionCodes?.length
    ? normalizePermissionCodes(user.permissionCodes)
    : getPermissionCodesByPlatformPermissions(user?.platformPermissions || []);

export const toDemoCurrentUser = (
  user: DemoUserWithPermissionCodes,
): DemoCurrentUser => ({
  ...user,
  permissionCodes: getUserPermissionCodes(user),
});

export const getRouteAccessCode = (pathname?: string) => {
  const normalizedPath = (pathname || '/overview').split('?')[0].split('#')[0];
  const matched = routeAccessMap.find(
    ([path]) => normalizedPath === path || normalizedPath.startsWith(`${path}/`),
  );

  return matched?.[1];
};

export const canAccessPath = (
  user: DemoUserWithPermissionCodes | undefined,
  pathname?: string,
) => {
  const accessCode = getRouteAccessCode(pathname);
  if (!accessCode || !user) return true;
  return Boolean(
    getAccessRecordByPermissionCodes(getUserPermissionCodes(user))[accessCode],
  );
};

export const getFirstAllowedPath = (
  user: DemoUserWithPermissionCodes | undefined,
) => {
  const accessRecord = getAccessRecordByPermissionCodes(
    getUserPermissionCodes(user),
  );
  const matched = firstPathByAccessCode.find(([accessCode]) =>
    accessRecord[accessCode],
  );

  return matched?.[1] || '/overview';
};
