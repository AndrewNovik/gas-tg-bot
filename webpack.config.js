const path = require('path');
const GasPlugin = require('gas-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isMinimized = process.argv.includes('--optimization-minimize');

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'gas'),
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@commands': path.resolve(__dirname, 'src/commands'),
        '@messages': path.resolve(__dirname, 'src/messages'),
        '@state': path.resolve(__dirname, 'src/state'),
        '@webhooks': path.resolve(__dirname, 'src/webhooks'),
        '@google-sheets': path.resolve(__dirname, 'src/google-sheets'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@telegram-api': path.resolve(__dirname, 'src/telegram-api'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    optimization: {
      minimize: isMinimized,
      // Отключаем tree shaking для GAS
      usedExports: false,
      sideEffects: false,
    },
    // Убираем source-map для продакшена
    devtool: false,
    plugins: [
      new GasPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: 'appsscript.json',
            to: 'appsscript.json',
          },
        ],
      }),
    ],
  };
};