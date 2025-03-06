module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-syntax-flow',
    ['module-resolver', {
      root: ['.'],
      alias: {
        '@': './src'
      }
    }]
  ]
};
