fx_version 'cerulean'
game 'gta5'

name 'Az-Loading'
author 'Azure(TheStoicBear)'
description 'DB-powered loading screen (HYBRID GLOBAL)'
version '2.0.0'

lua54 'yes'

loadscreen 'html/index.html'

files {
  'html/index.html',
  'html/config.js',
  'html/stats.json',
  'html/assets/*'
}

server_scripts {
  'config.lua',
  'server.lua'
}

client_scripts {
  'config.lua',
  'client.lua'
}
