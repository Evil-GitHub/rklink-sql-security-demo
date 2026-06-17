import {
  getAccessRecordByPermissionCodes,
  type DemoCurrentUser,
} from './pages/SqlSecurityDemo/routePermissions';

export default function access(
  initialState: { currentUser?: DemoCurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  if (!currentUser) return {};

  return {
    ...getAccessRecordByPermissionCodes(currentUser.permissionCodes),
  };
}
