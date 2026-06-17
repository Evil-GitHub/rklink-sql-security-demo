import type { ProTokenType } from '@ant-design/pro-components';
import { theme, type ThemeConfig } from 'antd';

const { defaultSeed, defaultAlgorithm } = theme;

export const baseThemeToken = {
  borderRadiusLG: 4,
  borderRadius: 4,
  borderRadiusXS: 4,
  colorPrimary: '#13c2c2',
  colorInfo: '#13c2c2',
  colorLink: '#13c2c2',
  blue: '#13c2c2',
};

export const lightSeed = {
  ...defaultSeed,
  ...baseThemeToken,
};

export const defaultMapToken = defaultAlgorithm(lightSeed);

export const defaultTheme: ThemeConfig = {
  token: {
    ...defaultMapToken,
    ...baseThemeToken,
  },
  algorithm: defaultAlgorithm,
  components: {
    Card: {
      borderRadiusLG: 4,
    },
    Button: {
      borderRadius: 4,
    },
  },
};

export const cssVar = (name: string, fallback: string) => `var(--ant-${name}, ${fallback})`;

export const layoutToken: ProTokenType['layout'] = {
  sider: {
    colorMenuBackground: cssVar('color-bg-container', '#fff'),
    colorTextMenuSelected: cssVar('color-primary-text', lightSeed.colorPrimary),
    colorTextMenuItemHover: cssVar('color-primary-text-hover', lightSeed.colorPrimary),
    colorTextMenuActive: cssVar('color-primary-text-active', lightSeed.colorPrimary),
  },
  pageContainer: {
    paddingBlockPageContainerContent: 24,
    paddingInlinePageContainerContent: 24,
  },
};
