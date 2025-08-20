module.exports = {
  stories: ["../stories/**/*.stories.js"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "storybook/actions",
    "@storybook/addon-webpack5-compiler-babel",
  ],
  features: {
    postcss: false,
  },
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve("babel-loader"),
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    browsers: ["last 2 versions"],
                  },
                },
              ],
              "@babel/preset-react",
            ],
            plugins: ["@babel/plugin-transform-runtime"],
          },
        },
      ],
    });
    return config;
  },
};
