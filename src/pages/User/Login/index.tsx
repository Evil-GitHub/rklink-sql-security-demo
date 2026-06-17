import Footer from "@/components/Footer";
import { signInDemoUser } from "@/pages/SqlSecurityDemo/currentUserStore";
import { readDemoUsersWithPermissions } from "@/pages/SqlSecurityDemo/permissionStore";
import { toDemoCurrentUser } from "@/pages/SqlSecurityDemo/routePermissions";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { LoginForm, ProFormText } from "@ant-design/pro-components";
import { Helmet, useModel } from "@umijs/max";
import { App } from "antd";
import defaultSettings from "config/defaultSettings";
import { startTransition } from "react";
import "./index.less";

type LoginFormValues = {
  password: string;
  username: string;
};

const loginPath = "/user/login";

const getSafeRedirectUrl = (redirect: string | null): string => {
  if (!redirect?.startsWith("/")) return "/";
  if (redirect.startsWith("//")) return "/";

  try {
    const parsed = new URL(redirect, window.location.origin);

    if (parsed.origin !== window.location.origin) return "/";
    if (parsed.pathname === loginPath) return "/";

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
};

const Login = () => {
  const { message } = App.useApp();
  const { setInitialState } = useModel("@@initialState");

  const handleSubmit = async (values: LoginFormValues) => {
    const username = values.username.trim();
    const users = readDemoUsersWithPermissions();
    const matchedUser = users.find(
      (user) => user.account === username || user.id === username,
    );

    if (!matchedUser) {
      message.error("账号或密码错误");
      return false;
    }

    if (matchedUser.status === "锁定") {
      message.warning("当前账号已锁定");
      return false;
    }

    signInDemoUser(matchedUser.id);
    startTransition(() => {
      setInitialState((state) => ({
        ...(state || { settings: defaultSettings }),
        currentUser: toDemoCurrentUser(matchedUser),
        settings: state?.settings || defaultSettings,
      }));
    });
    message.success("登录成功！");

    const urlParams = new URL(window.location.href).searchParams;
    window.location.href = getSafeRedirectUrl(urlParams.get("redirect"));
    return true;
  };

  return (
    <div className="login-page">
      <Helmet>
        <title>登录 - {defaultSettings.title}</title>
      </Helmet>
      <div className="login-content">
        <div className="login-form">
          <LoginForm<LoginFormValues>
            logo={<img alt="logo" src="/images/sql-security-logo-teal.svg" />}
            title={defaultSettings.title}
            onFinish={handleSubmit}
          >
            <ProFormText
              name="username"
              fieldProps={{
                size: "large",
                prefix: <UserOutlined />,
              }}
              placeholder="请输入用户名"
              rules={[
                {
                  required: true,
                  message: "请输入用户名!",
                },
              ]}
            />
            <ProFormText.Password
              name="password"
              fieldProps={{
                size: "large",
                prefix: <LockOutlined />,
              }}
              placeholder="请输入密码"
              rules={[
                {
                  required: true,
                  message: "请输入密码！",
                },
              ]}
            />
          </LoginForm>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Login;
