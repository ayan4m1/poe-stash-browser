import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './src/images/icon',
    executableName: 'poe-stash-browser'
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      iconUrl: 'https://i.imgur.com/x7AjVxS.png',
      setupIcon: './src/images/icon.ico'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        icon: './src/images/icon.png'
      }
    }),
    new MakerDeb({
      options: {
        icon: './src/images/icon.png'
      }
    })
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ayan4m1',
          name: 'poe-stash-browser'
        },
        generateReleaseNotes: true,
        draft: false
      }
    }
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy:
        "default-src 'self' 'unsafe-eval' 'unsafe-inline' data: https://www.pathofexile.com https://api.pathofexile.com https://web.poecdn.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' data:;font-src 'self' 'unsafe-inline' https://fonts.gstatic.com;style-src 'self' 'unsafe-inline' https:;style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/components/App.tsx',
            name: 'main_window',
            preload: {
              js: './src/preload.ts'
            }
          }
        ]
      }
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ]
};

export default config;
