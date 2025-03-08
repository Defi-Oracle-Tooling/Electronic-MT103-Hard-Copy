module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      useBuiltIns: 'usage',
      corejs: 3
    }],
    ['@babel/preset-typescript', {
      optimizeConstEnums: true
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }]
  ],
  plugins: [
    '@babel/plugin-syntax-flow',
    '@babel/plugin-proposal-decorators',
    ['@babel/plugin-transform-runtime', {
      regenerator: true
    }],
    ['module-resolver', {
      root: ['.'],
      alias: {
        '@': './src',
        '@components': './src/components',
        '@services': './src/services',
        '@utils': './src/utils'
      }
    }]
  ],
  env: {
    production: {
      plugins: ['transform-remove-console']
    }
  }
};
