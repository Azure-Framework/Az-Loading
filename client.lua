local RESOURCE = GetCurrentResourceName()

local requested = false
local received = false
local previewToken = 0
local runtimePreviewActive = false

local function dbg(...)
  if Config and Config.Debug then
    print(('[%s] [DEBUG] '):format(RESOURCE) .. table.concat({ ... }, ' '))
  end
end

local function sendToLoadscreen(tbl)
  local ok, payload = pcall(function() return json.encode(tbl) end)
  if not ok then return end
  SendLoadingScreenMessage(payload)
end

local function sendToPreview(tbl)
  SendNUIMessage(tbl)
end

local function sendToAll(tbl)
  sendToLoadscreen(tbl)
  sendToPreview(tbl)
end

local function buildCfg()
  local cfg = {}

  if Config then
    if type(Config.Text) == 'table' then cfg.text = Config.Text end
    cfg.text = cfg.text or {}
    if Config.ServerName then cfg.text.serverName = Config.ServerName end
    if Config.Subtitle then cfg.text.subtitle = Config.Subtitle end

    if type(Config.Theme) == 'table' then cfg.colors = Config.Theme end
    if type(Config.UI) == 'table' then cfg.ui = Config.UI end
    if type(Config.Media) == 'table' then cfg.media = Config.Media end
    if type(Config.KeybindPages) == 'table' then cfg.keybindPages = Config.KeybindPages end
    if type(Config.ShowcaseSlides) == 'table' then cfg.showcaseSlides = Config.ShowcaseSlides end

    cfg.ui = cfg.ui or {}
    if Config.MaxBusinessesPreview then
      cfg.ui.maxBusinessesPreview = tonumber(Config.MaxBusinessesPreview) or 6
    end
    cfg.ui.enableStatsJsonFetch = (cfg.ui.enableStatsJsonFetch ~= false)
    cfg.ui.statsJsonPath = cfg.ui.statsJsonPath or 'stats.json'
  end

  return cfg
end

CreateThread(function()
  Wait(50)
  sendToLoadscreen({ action = 'hello' })
  sendToLoadscreen({ action = 'cfg', cfg = buildCfg() })
  sendToPreview({ action = 'cfg', cfg = buildCfg() })

  while not NetworkIsSessionStarted() do
    Wait(250)
  end

  requested = true
  dbg('Network session started; requesting stats...')
  sendToLoadscreen({ action = 'status', text = 'Connected — fetching live server data…' })
  TriggerServerEvent('nv_ls:reqStats')

  local tries = 0
  while not received and tries < 15 do
    tries = tries + 1
    Wait(800)
    dbg(('Retry reqStats %d/15'):format(tries))
    TriggerServerEvent('nv_ls:reqStats')
  end
end)

RegisterNetEvent('nv_ls:sendStats', function(payload)
  received = true

  dbg(('Stats received -> ok=%s chars=%s cash=%s bank=%s'):format(
    tostring(payload and payload.ok),
    tostring(payload and payload.characters),
    tostring(payload and payload.cash),
    tostring(payload and payload.bank)
  ))

  sendToAll({ action = 'stats', payload = payload })
end)

RegisterCommand((Config.RuntimePreview and Config.RuntimePreview.command) or 'azloadtest', function()
  local preview = Config.RuntimePreview or {}
  if preview.enabled == false then
    dbg('Runtime preview command blocked: disabled in config')
    return
  end

  previewToken = previewToken + 1
  local myToken = previewToken
  local durationMs = tonumber(preview.durationMs) or 5000
  if durationMs < 1000 then durationMs = 1000 end

  runtimePreviewActive = true
  SetNuiFocus(false, false)
  sendToPreview({ action = 'cfg', cfg = buildCfg() })
  sendToPreview({
    action = 'runtimeShow',
    preview = {
      statusText = preview.statusText or 'In-game loading screen preview running…',
      phaseText = preview.phaseText or 'Preview test active',
      startProgress = tonumber(preview.startProgress) or 18,
      targetProgress = tonumber(preview.targetProgress) or 94
    }
  })

  TriggerServerEvent('nv_ls:reqStats')

  CreateThread(function()
    Wait(durationMs)
    if myToken ~= previewToken then return end
    runtimePreviewActive = false
    SetNuiFocus(false, false)
    sendToPreview({ action = 'runtimeHide' })
  end)
end, false)


CreateThread(function()
  while true do
    if runtimePreviewActive then
      HideHudAndRadarThisFrame()
      Wait(0)
    else
      Wait(350)
    end
  end
end)
