import {
  readCurrentDemoUserId,
  signOutDemoUser,
  useCurrentDemoUserId,
  writeCurrentDemoUserId,
} from "@/pages/SqlSecurityDemo/currentUserStore";
import {
  readDemoUsersWithPermissions,
  subscribeUserPermissionChange,
} from "@/pages/SqlSecurityDemo/permissionStore";
import {
  canAccessPath,
  getFirstAllowedPath,
} from "@/pages/SqlSecurityDemo/routePermissions";
import { subscribeDemoUserChange } from "@/pages/SqlSecurityDemo/userStore";
import {
  DownOutlined,
  LogoutOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { history, useModel } from "@umijs/max";
import type { MenuProps } from "antd";
import { Avatar, Dropdown, Space, Tag, Typography } from "antd";
import defaultSettings from "config/defaultSettings";
import { startTransition, useEffect, useMemo, useState } from "react";

const { Text } = Typography;
const LOGIN_PATH = "/user/login";
const LOGOUT_KEY = "__logout";

const refreshRouteForUser = (user: ReturnType<typeof readDemoUsersWithPermissions>[number]) => {
  const { pathname } = history.location;

  if (!canAccessPath(user, pathname)) {
    window.location.assign(getFirstAllowedPath(user));
    return;
  }

  window.location.reload();
};

const RightContent = () => {
  const { setInitialState } = useModel("@@initialState");
  const currentUserId = useCurrentDemoUserId();
  const [users, setUsers] = useState(() => readDemoUsersWithPermissions());

  useEffect(
    () => {
      const refreshUsers = () => {
        const nextUsers = readDemoUsersWithPermissions();
        const nextUser =
          nextUsers.find((user) => user.id === readCurrentDemoUserId()) ||
          nextUsers[0];

        setUsers(nextUsers);
        if (!canAccessPath(nextUser, history.location.pathname)) {
          window.location.assign(getFirstAllowedPath(nextUser));
        }
      };
      const unsubscribePermissionChange =
        subscribeUserPermissionChange(refreshUsers);
      const unsubscribeUserChange = subscribeDemoUserChange(refreshUsers);

      return () => {
        unsubscribePermissionChange();
        unsubscribeUserChange();
      };
    },
    [],
  );

  const currentUser = useMemo(
    () =>
      users.find((user) => user.id === currentUserId) ||
      users.find((user) => user.id === readCurrentDemoUserId()) ||
      users[0],
    [currentUserId, users],
  );

  const loginOut = () => {
    const { pathname, search, hash } = window.location;
    const urlParams = new URL(window.location.href).searchParams;
    const redirect = urlParams.get("redirect");
    const searchParams = new URLSearchParams({
      redirect: pathname + search + hash,
    });

    signOutDemoUser();
    startTransition(() => {
      setInitialState((state) => {
        const nextState = state || { settings: defaultSettings };

        return {
          ...nextState,
          currentUser: undefined,
          settings: nextState.settings || defaultSettings,
        };
      });
    });

    if (pathname !== LOGIN_PATH && !redirect) {
      history.replace({
        pathname: LOGIN_PATH,
        search: searchParams.toString(),
      });
    }
  };

  const items: MenuProps["items"] = [
    ...users.map((user) => ({
      key: user.id,
      icon: <UserSwitchOutlined />,
      label: (
        <Space direction="vertical" size={2}>
          <Text strong>{user.name}</Text>
          <Space size={4} wrap>
            <Text type="secondary">
              {user.account} / {user.department}
            </Text>
            <Tag>{user.role}</Tag>
            <Tag color={user.canViewPlain ? "gold" : "cyan"}>
              {user.canViewPlain ? "明文授权" : "强制脱敏"}
            </Tag>
          </Space>
        </Space>
      ),
    })),
    { type: "divider" },
    {
      key: LOGOUT_KEY,
      icon: <LogoutOutlined />,
      label: "退出登录",
    },
  ];

  const menu: MenuProps = {
    selectedKeys: [currentUser.id],
    items,
    onClick: ({ key }) => {
      if (key === LOGOUT_KEY) {
        loginOut();
        return;
      }

      const nextUserId = writeCurrentDemoUserId(String(key));
      const nextUser = users.find((user) => user.id === nextUserId) || users[0];
      refreshRouteForUser(nextUser);
    },
  };

  return (
    <Dropdown menu={menu} trigger={["click"]} placement="bottomRight">
      <Space size={8}>
        <Avatar size="small" src="/images/user.svg" alt="avatar" />
        <Text strong>{currentUser.name}</Text>
        <DownOutlined />
      </Space>
    </Dropdown>
  );
};

export default RightContent;
