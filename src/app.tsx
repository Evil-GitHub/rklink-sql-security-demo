import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import {
  isDemoUserSignedIn,
  readCurrentDemoUserId,
} from '@/pages/SqlSecurityDemo/currentUserStore';
import { readDemoUsersWithPermissions } from '@/pages/SqlSecurityDemo/permissionStore';
import { toDemoCurrentUser } from '@/pages/SqlSecurityDemo/routePermissions';
import { history } from '@umijs/max';
import { App as AntdApp, ConfigProvider, Result } from 'antd';
import defaultSettings from 'config/defaultSettings';
import type { ReactNode } from 'react';
import { defaultTheme, layoutToken } from './theme';

const loginPath = '/user/login';

export async function getInitialState() {
  if (!isDemoUserSignedIn()) {
    return {
      currentUser: undefined,
      settings: defaultSettings,
    };
  }

  const users = readDemoUsersWithPermissions();
  const currentDemoUserId = readCurrentDemoUserId();
  const currentUser =
    users.find((user) => user.id === currentDemoUserId) || users[0];

  return {
    currentUser: currentUser ? toDemoCurrentUser(currentUser) : undefined,
    settings: defaultSettings,
  };
}

export const layout = ({
  initialState,
}: {
  initialState?: Awaited<ReturnType<typeof getInitialState>>;
}) => ({
  footerRender: () => <Footer />,
  rightContentRender: () => <RightContent />,
  onPageChange: () => {
    const { location } = history;

    if (!initialState?.currentUser && location.pathname !== loginPath) {
      history.replace({
        pathname: loginPath,
        search: new URLSearchParams({
          redirect: location.pathname + location.search + location.hash,
        }).toString(),
      });
    }
  },
  unAccessible: (
    <Result status="403" title="403" subTitle="当前账号无访问权限" />
  ),
  token: layoutToken,
  ...initialState?.settings,
});

export function rootContainer(container: ReactNode) {
  return (
    <ConfigProvider theme={defaultTheme}>
      <AntdApp>{container}</AntdApp>
    </ConfigProvider>
  );
}
