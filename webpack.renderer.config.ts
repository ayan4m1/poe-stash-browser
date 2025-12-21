import { WebpackConfiguration } from '@electron-forge/plugin-webpack/dist/Config';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.s[ac]ss$/i,
  use: ['style-loader', 'css-loader', 'sass-loader']
});

export const rendererConfig: WebpackConfiguration = {
  module: {
    rules
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss']
  },
  ignoreWarnings: [/.*/i]
};
