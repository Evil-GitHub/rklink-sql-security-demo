import {
  type DemoUser,
  type PlatformFunction,
  type SqlType,
} from './mock';
import {
  getPermissionCodesByPlatformPermissions,
  getPlatformPermissionsByPermissionCodes,
  normalizePermissionCodes,
} from './routePermissions';
import { readDemoUserAccounts } from './userStore';

export type StoredUserPermission = {
  id: string;
  permissionCodes?: string[];
  platformPermissions?: PlatformFunction[];
  allowedSources?: string[];
  operations?: SqlType[];
  canViewPlain?: boolean;
  maskingDefault?: boolean;
  sensitiveAuditEnabled?: boolean;
  exportApprovalRequired?: boolean;
  dmlApprovalMode?: string;
  resultLimit?: number;
  executionWindow?: string;
};

const STORAGE_KEY = 'rklink-sql-security-demo:user-permissions:v6';
const PERMISSION_EVENT = 'rklink-sql-security-demo:user-permissions-change';

const readStoredPermissions = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUserPermission[]) : [];
  } catch {
    return [];
  }
};

const writeStoredPermissions = (permissions: StoredUserPermission[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
  window.dispatchEvent(new Event(PERMISSION_EVENT));
};

const normalizePermission = (
  user: DemoUser,
  permission?: StoredUserPermission,
) => {
  const canViewPlain = permission?.canViewPlain ?? user.canViewPlain;
  const maskingDefault = canViewPlain
    ? permission?.maskingDefault ?? user.maskingDefault
    : true;
  const fallbackPermissionCodes = getPermissionCodesByPlatformPermissions(
    user.platformPermissions,
  );
  const permissionCodes = normalizePermissionCodes(
    permission?.permissionCodes ||
      getPermissionCodesByPlatformPermissions(permission?.platformPermissions),
    fallbackPermissionCodes,
  );

  return {
    ...user,
    permissionCodes,
    platformPermissions: getPlatformPermissionsByPermissionCodes(permissionCodes),
    allowedSources: permission?.allowedSources ?? user.allowedSources,
    operations: permission?.operations ?? user.operations,
    maskingDefault,
    canViewPlain,
    sensitiveAuditEnabled:
      permission?.sensitiveAuditEnabled ?? user.sensitiveAuditEnabled,
    exportApprovalRequired:
      permission?.exportApprovalRequired ?? user.exportApprovalRequired,
    dmlApprovalMode: permission?.dmlApprovalMode ?? user.dmlApprovalMode,
    resultLimit: permission?.resultLimit ?? user.resultLimit,
    executionWindow: permission?.executionWindow ?? user.executionWindow,
  };
};

export const readDemoUsersWithPermissions = (): DemoUser[] => {
  const permissionMap = new Map(
    readStoredPermissions().map((item) => [item.id, item]),
  );
  const users = readDemoUserAccounts();

  return users.map((user) => normalizePermission(user, permissionMap.get(user.id)));
};

export const updateUserSecurityPermission = (
  userId: string,
  patch: Omit<StoredUserPermission, 'id'>,
) => {
  const current = readStoredPermissions();
  const existingIndex = current.findIndex((item) => item.id === userId);
  const users = readDemoUserAccounts();
  const currentUser =
    users.find((user) => user.id === userId) || users[0];
  if (!currentUser) return [];

  const existing = existingIndex >= 0 ? current[existingIndex] : { id: userId };
  const merged = {
    ...existing,
    ...patch,
  };
  const normalized = normalizePermission(currentUser, merged);
  const nextItem: StoredUserPermission = {
    id: userId,
    permissionCodes: normalized.permissionCodes,
    platformPermissions: normalized.platformPermissions,
    allowedSources: normalized.allowedSources,
    operations: normalized.operations,
    canViewPlain: normalized.canViewPlain,
    maskingDefault: normalized.maskingDefault,
    sensitiveAuditEnabled: normalized.sensitiveAuditEnabled,
    exportApprovalRequired: normalized.exportApprovalRequired,
    dmlApprovalMode: normalized.dmlApprovalMode,
    resultLimit: normalized.resultLimit,
    executionWindow: normalized.executionWindow,
  };
  const next =
    existingIndex >= 0
      ? current.map((item, index) => (index === existingIndex ? nextItem : item))
      : [...current, nextItem];

  writeStoredPermissions(next);
  return readDemoUsersWithPermissions();
};

export const updateUserPlainPermission = (
  userId: string,
  canViewPlain: boolean,
) =>
  updateUserSecurityPermission(userId, {
    canViewPlain,
    maskingDefault: canViewPlain ? undefined : true,
  });

export const replaceUserSecurityPermissions = (
  permissions: StoredUserPermission[],
) => {
  writeStoredPermissions(permissions);
  return readDemoUsersWithPermissions();
};

export const resetUserPermissions = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(PERMISSION_EVENT));
  }
  return readDemoUsersWithPermissions();
};

export const resetUserPlainPermissions = resetUserPermissions;

export const subscribeUserPermissionChange = (listener: () => void) => {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(PERMISSION_EVENT, listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener(PERMISSION_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
};
