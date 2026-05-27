fx_version 'cerulean'
game 'gta5'

name 'nv_db_loadscreen'
author 'NV'
description 'DB-powered loading screen with Az-style cinematic QBCore-inspired layout'
version '3.0.0'

lua54 'yes'

loadscreen 'html/index.html'

files {
  'html/index.html',
  'html/runtime.html',
  'html/style.css',
  'html/app.js',
  'html/config.js',
  'html/stats.json',
  'html/assets/*',
  'html/assets/**/*'
}


server_scripts {
  'config.lua',
  'server.lua'
}

client_scripts {
  'config.lua',
  'client.lua'
}
