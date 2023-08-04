'use strict'


const settings = {
  ignore_watch: 'status',
  watch: ['./dist', './dist/*js'],
  namespace: 'synonym'
}

module.exports = {
  apps: [
    {
      name: 'pm2-slack-killswitch',
      script: './dist/index.js',
      env_production: {},
      ...settings
    }
  ]
}
