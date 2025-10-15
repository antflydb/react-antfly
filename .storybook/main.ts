import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
  ],
  features: {
    postcss: false,
  },
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
