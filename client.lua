local RESOURCE = GetCurrentResourceName()

local requested = false
local received = false

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

CreateThread(function()
  -- Let UI know Lua is alive
  Wait(50)
  sendToLoadscreen({ action = 'hello' })

  -- We cannot talk to the server until the network session is started.
  while not NetworkIsSessionStarted() do
    Wait(250)
  end

  -- As soon as session starts (often BEFORE full spawn), request stats.
  requested = true
  dbg('Network session started; requesting stats...')
  sendToLoadscreen({ action = 'status', text = 'Connected — fetching server stats…' })
  TriggerServerEvent('nv_ls:reqStats')

  -- Retry a few times if server is slow
  local tries = 0
  while not received and tries < 15 do
    tries += 1
    Wait(800)
    dbg(('Retry reqStats %d/15'):format(tries))
    TriggerServerEvent('nv_ls:reqStats')
  end
end)

RegisterNetEvent('nv_ls:sendStats', function(payload)
  if received then return end
  received = true

  dbg(('Stats received -> ok=%s chars=%s cash=%s bank=%s'):format(
    tostring(payload and payload.ok),
    tostring(payload and payload.characters),
    tostring(payload and payload.cash),
    tostring(payload and payload.bank)
  ))

  -- Push to loadscreen (this works even if the UI couldn't fetch stats.json)
  sendToLoadscreen({ action = 'stats', payload = payload })
end)
