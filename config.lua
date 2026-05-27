Config = Config or {}

Config.DBDriver = Config.DBDriver or 'oxmysql'
Config.Debug = (Config.Debug ~= false)
Config.StatsFileWriteIntervalSec = tonumber(Config.StatsFileWriteIntervalSec) or 10

Config.Text = Config.Text or {
  title = 'Azure Framework Loading',
  serverName = 'Azure Framework',
  subtitle = 'Welcome back — syncing live server data...',

  showcaseText = 'You can add/remove items, vehicles, jobs & gangs through the shared folder.',
  showcaseCredit = 'Photo captured by: MadebyAzure.com',

  keybindsTitle = 'Default Keybinds',
  loadingCardTitle = 'Downloading Server Data',
  loadingCardBody1 = 'Hold tight while we begin downloading all the resources/assets required to play on this server.',
  loadingCardBody2 = 'After download has been finished successfully, you will be placed into the server and this screen will disappear. Please do not leave or turn off your PC.',
  detailsHide = 'HIDE DETAILS',
  detailsShow = 'SHOW DETAILS',
  detailStatsTitle = 'Live Server Snapshot',
  detailBusinessesTitle = 'Latest Businesses',
  footerStatePrefix = 'Loading game',

  emptyList = 'Waiting for live server stats…',
  errorTitle = 'Server data issue'
}

Config.Theme = Config.Theme or {
  bg = '#04070d',
  bg2 = '#070b13',
  panel = 'rgba(255,255,255,.94)',
  panel2 = 'rgba(255,255,255,.82)',
  stroke = 'rgba(255,255,255,.14)',
  stroke2 = 'rgba(57,112,230,.35)',
  text = '#f4f7fb',
  muted = 'rgba(255,255,255,.76)',
  muted2 = 'rgba(255,255,255,.48)',
  accent = '#175dbfff',
  accent2 = '#3970e6ff',
  good = '#1fc781',
  warn = '#5bc0ff',
  bad = '#3970e6',
  shadow = 'rgba(0,0,0,.55)',
  glow = 'rgba(57,112,230,.22)'
}

Config.UI = Config.UI or {
  radius = 18,
  blur = 12,
  gridGap = 18,
  floatMs = 5200,
  shimmerMs = 1500,
  maxBusinessesPreview = 6,
  enableStatsJsonFetch = true,
  statsJsonPath = 'stats.json',
  statsFetchTries = 12,
  statsFetchInterval = 700,
  showcaseRotateMs = 6500,
  detailsExpanded = true,
  buildLabel = 'FiveM* (b2372) (Beta)'
}

Config.Media = Config.Media or {
  bgImageSrc = '',
  videoSrc = 'assets/bg_rebuilt.mp4',
  logoSrc = '',
  brandWordmark = 'Azure Framework loading',
  brandSubline = 'cinematic database loading screen'
}

Config.KeybindPages = Config.KeybindPages or {
  {
    { key = 'TAB', label = 'Open Inventory' },
    { key = '`',   label = 'Cycle Proximity' },
    { key = 'M',   label = 'Open Phone' },
    { key = 'B',   label = 'Toggle Seat Belt' },
    { key = 'LALT', label = 'Open Target Menu' },
    { key = 'F1',  label = 'Radial Menu' },
    { key = 'I',   label = 'Open HUD Menu' },
    { key = 'LALT', label = 'Talk Over Radio' }
  }
}

Config.ShowcaseSlides = Config.ShowcaseSlides or {
  {
    text = 'Azure Framework gives your FiveM server a complete foundation with jobs, economy, permissions, HUD systems, and developer exports.',
    credit = 'Azure Framework'
  },
  {
    text = 'Build immersive roleplay with department and job systems, role-based permissions, and automated paycheck support.',
    credit = 'Features • Azure Framework'
  },
  {
    text = 'Keep your server data persistent with MySQL-backed player economy, auto-created tables, and clean framework-driven storage.',
    credit = 'Persistent Economy'
  },
  {
    text = 'Manage staff power through Discord role-based admin permissions and track important actions with webhook logging.',
    credit = 'Discord Integration'
  },
  {
    text = 'Customize the player experience with a full NUI HUD, live money and status updates, and exportable functions for other resources.',
    credit = 'HUD + Developer API'
  },
  {
    text = 'Get started fast with the Azure Framework setup guide, documentation, resources, and community support.',
    credit = 'Docs • Guides • Community'
  }
}
Config.ShowBusinessesPreview = (Config.ShowBusinessesPreview ~= false)
Config.MaxBusinessesPreview = tonumber(Config.MaxBusinessesPreview) or 6

Config.ServerName = Config.ServerName or Config.Text.serverName
Config.Subtitle = Config.Subtitle or Config.Text.subtitle


Config.RuntimePreview = Config.RuntimePreview or {
  enabled = false,
  command = 'azloadtest',
  durationMs = 5000,
  allowEveryone = true,
  statusText = 'In-game loading screen preview running…',
  phaseText = 'Preview test active',
  startProgress = 18,
  targetProgress = 94
}
