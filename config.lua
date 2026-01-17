Config = Config or {}

-- DB
Config.DBDriver = Config.DBDriver or 'oxmysql' -- 'oxmysql' | 'mysql-async'
Config.Debug = (Config.Debug ~= false)

-- server writes html/stats.json on an interval
Config.StatsFileWriteIntervalSec = tonumber(Config.StatsFileWriteIntervalSec) or 10

-- UI text (this now drives the loadscreen; no need to edit html/config.js)
Config.Text = Config.Text or {
  title       = 'Loading…',
  serverName  = 'State of Los Santos',
  subtitle    = 'Welcome back — syncing server stats...',

  leftTitle   = 'Loading into the city',
  leftSub     = 'Live server stats!',

  rightTitle  = 'Owned Businesses',
  rightSub    = 'Latest businesses in the city',

  tipPill     = 'Tip',
  tipText     = 'If your stats show “—”, make sure oxmysql is started and your mysql_connection_string is correct.',

  footerLeft  = 'DB-powered Loading Screen',
  footerRight = 'Purple / Blue theme',

  emptyList   = 'Waiting for server stats…',
  errorTitle  = 'Profile sync issue'
}

-- Theme colors (purple/blue)
Config.Theme = Config.Theme or {
  bg     = '#07080c',
  bg2    = '#0b0d14',

  panel  = 'rgba(16,17,24,.78)',
  panel2 = 'rgba(20,22,32,.70)',

  stroke  = 'rgba(255,255,255,.08)',
  stroke2 = 'rgba(255,255,255,.12)',

  text   = 'rgba(255,255,255,.92)',
  muted  = 'rgba(255,255,255,.62)',
  muted2 = 'rgba(255,255,255,.42)',

  accent  = '#4da3ff', -- blue
  accent2 = '#a855f7', -- purple

  good = '#22c55e',
  warn = '#f59e0b',
  bad  = '#ef4444',

  shadow = 'rgba(0,0,0,.55)',
  glow   = 'rgba(77,163,255,.22)'
}

-- UI tuning
Config.UI = Config.UI or {
  radius    = 24,
  blur      = 18,
  gridGap   = 18,
  floatMs   = 5200,
  shimmerMs = 1500
}

-- Businesses preview panel
Config.ShowBusinessesPreview = (Config.ShowBusinessesPreview ~= false)
Config.MaxBusinessesPreview  = tonumber(Config.MaxBusinessesPreview) or 6

-- Back-compat fields used by server.lua
Config.ServerName = Config.ServerName or Config.Text.serverName
Config.Subtitle   = Config.Subtitle or Config.Text.subtitle
