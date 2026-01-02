Config = Config or {}

Config.DBDriver = 'oxmysql'
Config.Debug = true

-- ✅ NEW: server writes html/stats.json on an interval
Config.StatsFileWriteIntervalSec = 10

Config.ServerName = 'Your Server'
Config.Subtitle   = 'Welcome back — syncing server stats...'

Config.ShowBusinessesPreview = true
Config.MaxBusinessesPreview  = 6
