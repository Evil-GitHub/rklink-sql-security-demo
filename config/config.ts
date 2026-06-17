import { defineConfig } from "@umijs/max";
import path from "path";
import defaultSettings from "./defaultSettings";
import routes from "./routes";

export default defineConfig({
  title: defaultSettings.title,
  publicPath: "/",
  hash: true,
  esbuildMinifyIIFE: true,
  routes,
  fastRefresh: true,
  theme: {
    "root-entry-name": "variable",
  },
  layout: {
    locale: false,
    ...defaultSettings,
  },
  model: {},
  initialState: {},
  access: {},
  locale: {
    default: "zh-CN",
    antd: false,
    baseNavigator: true,
  },
  request: {},
  presets: ["umi-presets-pro"],
  mfsu: {
    strategy: "normal",
  },
  alias: {
    config: path.resolve(__dirname, "./"),
  },
  clickToComponent: {},
});
