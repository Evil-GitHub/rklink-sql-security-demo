import type { Settings as LayoutSettings } from "@ant-design/pro-components";

type DemoSettings = Partial<LayoutSettings> & {
  logo?: string | false;
  pwa?: boolean;
  iconfontUrl?: string;
};

const Settings: DemoSettings = {
  navTheme: "light",
  layout: "mix",
  contentWidth: "Fluid",
  fixedHeader: false,
  fixSiderbar: true,
  colorWeak: false,
  title: "数据库统一安全管控平台",
  pwa: false,
  iconfontUrl: "",
  menu: {
    autoClose: false,
    locale: false,
    collapsedShowTitle: false,
    type: "sub",
  },
  logo: "/images/sql-security-logo-teal.svg",
};

export default Settings;
