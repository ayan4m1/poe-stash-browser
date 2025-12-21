import { WebpackConfiguration } from '@electron-forge/plugin-webpack/dist/Config';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: WebpackConfiguration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules: [
      ...rules,
      {
        test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
        parser: { amd: false },
        use: {
          loader: '@vercel/webpack-asset-relocator-loader',
          options: {
            outputAssetBase: 'native_modules'
          }
        }
      }
    ]
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.scss']
  }
};
