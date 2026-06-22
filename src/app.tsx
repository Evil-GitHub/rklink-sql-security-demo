import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import {
  isDemoUserSignedIn,
  readCurrentDemoUserId,
} from '@/pages/SqlSecurityDemo/currentUserStore';
import { readDemoUsersWithPermissions } from '@/pages/SqlSecurityDemo/permissionStore';
import { resetApprovalTickets } from '@/pages/SqlSecurityDemo/approvalStore';
import { resetAuditLogs } from '@/pages/SqlSecurityDemo/auditStore';
import { resetExecutionRecords } from '@/pages/SqlSecurityDemo/executionStore';
import { resetSqlClientHistoryRecords } from '@/pages/SqlSecurityDemo/sqlClientHistoryStore';
import {
  resetMockDataSourceConnections,
  resetMockDriverPackages,
} from '@/pages/SqlSecurityDemo/mockApi';
import { resetPermissionRoles } from '@/pages/SqlSecurityDemo/permissionRoleStore';
import {
  resetRuleStrategies,
  resetSensitiveCatalog,
} from '@/pages/SqlSecurityDemo/mock';
import { toDemoCurrentUser } from '@/pages/SqlSecurityDemo/routePermissions';
import { resetDemoUserAccounts } from '@/pages/SqlSecurityDemo/userStore';
import { history } from '@umijs/max';
import { App as AntdApp, ConfigProvider, Result } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import defaultSettings from 'config/defaultSettings';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import weekday from 'dayjs/plugin/weekday';
import { useEffect, type ReactNode } from 'react';
import { defaultTheme, layoutToken } from './theme';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.locale('zh-cn');

const loginPath = '/user/login';

type DemoResetHooks = {
  resetAll?: () => void;
  resetAuditLogs?: () => void;
};

type DemoWindow = Window & {
  __RKLINK_SQL_SECURITY_DEMO__?: DemoResetHooks;
};

const resetAllDemoData = () => {
  resetDemoUserAccounts();
  resetPermissionRoles();
  resetMockDriverPackages();
  resetMockDataSourceConnections();
  resetRuleStrategies();
  resetSensitiveCatalog();
  resetApprovalTickets();
  resetExecutionRecords();
  resetSqlClientHistoryRecords();
  resetAuditLogs();
};

const DemoResetBridge = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const demoWindow = window as DemoWindow;
    const resetAuditSeedLogs = () => {
      resetAuditLogs();
    };
    const resetSeedData = () => {
      resetAllDemoData();
    };

    demoWindow.__RKLINK_SQL_SECURITY_DEMO__ = {
      ...demoWindow.__RKLINK_SQL_SECURITY_DEMO__,
      resetAll: resetSeedData,
      resetAuditLogs: resetAuditSeedLogs,
    };

    return () => {
      if (demoWindow.__RKLINK_SQL_SECURITY_DEMO__?.resetAll === resetSeedData) {
        delete demoWindow.__RKLINK_SQL_SECURITY_DEMO__.resetAll;
      }
      if (
        demoWindow.__RKLINK_SQL_SECURITY_DEMO__?.resetAuditLogs ===
        resetAuditSeedLogs
      ) {
        delete demoWindow.__RKLINK_SQL_SECURITY_DEMO__.resetAuditLogs;
      }
    };
  }, []);

  return <>{children}</>;
};

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
    <ConfigProvider locale={zhCN} theme={defaultTheme}>
      <AntdApp>
        <DemoResetBridge>{container}</DemoResetBridge>
      </AntdApp>
    </ConfigProvider>
  );
}
