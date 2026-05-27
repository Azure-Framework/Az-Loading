local RESOURCE = GetCurrentResourceName()
local function dbg(...)
  if Config and Config.Debug then
    print(("[%s] [DEBUG] "):format(RESOURCE) .. table.concat({ ... }, ' '))
  end
end
local function isArray(tbl)
  if type(tbl) ~= 'table' then return false end
  local max = 0
  local count = 0
  for k, _ in pairs(tbl) do
    if type(k) ~= 'number' then return false end
    if k > max then max = k end
    count = count + 1
  end
  return max == count
end
local function toJs(value)
  local t = type(value)
  if t == 'nil' then
    return 'null'
  elseif t == 'boolean' then
    return value and 'true' or 'false'
  elseif t == 'number' then
    return tostring(value)
  elseif t == 'string' then
    return json.encode(value)
  elseif t == 'table' then
    if isArray(value) then
      local out = {}
      for i = 1, #value do out[#out+1] = toJs(value[i]) end
      return '[' .. table.concat(out, ',') .. ']'
    else
      local out = {}
      for k, v in pairs(value) do
        out[#out+1] = json.encode(tostring(k)) .. ':' .. toJs(v)
      end
      return '{' .. table.concat(out, ',') .. '}'
    end
  end
  return 'null'
end
local function buildClientCfg()
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
local function writeClientConfig()
  local payload = 'window.NV_CFG = ' .. toJs(buildClientCfg()) .. ';\n'
  SaveResourceFile(RESOURCE, 'html/config.js', payload, -1)
  dbg('Wrote html/config.js from config.lua')
end
local function dbFetchOne(sql, params, cb)
  params = params or {}
  if (Config.DBDriver or 'oxmysql') == 'oxmysql' then
    if not exports.oxmysql then
      cb(nil, 'oxmysql not running')
      return
    end
    exports.oxmysql:single(sql, params, function(row)
      cb(row, nil)
    end)
    return
  end
  if (Config.DBDriver or '') == 'mysql-async' then
    if not exports['mysql-async'] then
      cb(nil, 'mysql-async not running')
      return
    end
    exports['mysql-async']:mysql_fetch_all(sql, params, function(rows)
      cb(rows and rows[1] or nil, nil)
    end)
    return
  end
  cb(nil, 'Unknown DB driver: ' .. tostring(Config.DBDriver))
end
local function dbFetchAll(sql, params, cb)
  params = params or {}
  if (Config.DBDriver or 'oxmysql') == 'oxmysql' then
    if not exports.oxmysql then
      cb(nil, 'oxmysql not running')
      return
    end
    exports.oxmysql:query(sql, params, function(rows)
      cb(rows or {}, nil)
    end)
    return
  end
  if (Config.DBDriver or '') == 'mysql-async' then
    if not exports['mysql-async'] then
      cb(nil, 'mysql-async not running')
      return
    end
    exports['mysql-async']:mysql_fetch_all(sql, params, function(rows)
      cb(rows or {}, nil)
    end)
    return
  end
  cb(nil, 'Unknown DB driver: ' .. tostring(Config.DBDriver))
end
local function writeStatsFile(tbl)
  local ok, payload = pcall(function() return json.encode(tbl) end)
  if not ok then
    dbg('Failed to json.encode stats file payload')
    return
  end
  SaveResourceFile(RESOURCE, 'html/stats.json', payload, -1)
end
local function buildAndWrite()
  local out = {
    ok = true,
    updatedAt = os.date('!%Y-%m-%dT%H:%M:%SZ'),
    serverName = (Config.Text and Config.Text.serverName) or Config.ServerName,
    subtitle = (Config.Text and Config.Text.subtitle) or Config.Subtitle,
    characters = 0,
    cash = 0,
    bank = 0,
    jailRecords = 0,
    businesses = 0,
    vehicles = 0,
    businessesPreview = {}
  }
  dbFetchOne('SELECT COUNT(*) AS c FROM `user_characters`', {}, function(r1, e1)
    if e1 then out.ok=false; out.error=e1 end
    out.characters = (r1 and r1.c) or 0
    dbFetchOne('SELECT COALESCE(SUM(`cash`),0) AS cash, COALESCE(SUM(`bank`),0) AS bank FROM `econ_user_money`', {}, function(r2, e2)
      if e2 then out.ok=false; out.error=e2 end
      out.cash = tonumber(r2 and r2.cash) or 0
      out.bank = tonumber(r2 and r2.bank) or 0
      dbFetchOne('SELECT COUNT(*) AS c FROM `jail_records`', {}, function(r3, e3)
        if e3 then out.ok=false; out.error=e3 end
        out.jailRecords = (r3 and r3.c) or 0
        dbFetchOne('SELECT COUNT(*) AS c FROM `az_businesses`', {}, function(r4, e4)
          if e4 then out.ok=false; out.error=e4 end
          out.businesses = (r4 and r4.c) or 0
          dbFetchOne('SELECT COUNT(*) AS c FROM `user_vehicles`', {}, function(r5, e5)
            if e5 then out.ok=false; out.error=e5 end
            out.vehicles = (r5 and r5.c) or 0
            if Config.ShowBusinessesPreview then
              local limit = tonumber(Config.MaxBusinessesPreview) or 6
              if limit < 1 then limit = 1 end
              dbFetchAll([[
                SELECT `name`, `type`, `business_balance` AS balance, `is_open`
                FROM `az_businesses`
                ORDER BY `created_at` DESC
                LIMIT ?
              ]], { limit }, function(rows, e6)
                if e6 then out.ok=false; out.error=e6 end
                out.businessesPreview = rows or {}
                writeStatsFile(out)
                dbg(('Wrote stats.json (ok=%s chars=%s cash=%s bank=%s)'):format(tostring(out.ok), tostring(out.characters), tostring(out.cash), tostring(out.bank)))
              end)
            else
              writeStatsFile(out)
              dbg(('Wrote stats.json (ok=%s chars=%s cash=%s bank=%s)'):format(tostring(out.ok), tostring(out.characters), tostring(out.cash), tostring(out.bank)))
            end
          end)
        end)
      end)
    end)
  end)
end
CreateThread(function()
  writeClientConfig()
  Wait(1000)
  local interval = tonumber(Config.StatsFileWriteIntervalSec) or 10
  if interval < 3 then interval = 3 end
  dbg(('Starting stats writer every %ss'):format(interval))
  while true do
    buildAndWrite()
    Wait(interval * 1000)
  end
end)
RegisterNetEvent('nv_ls:reqStats', function()
  local src = source
  dbg(('nv_ls:reqStats from %s'):format(src))
  local data = LoadResourceFile(RESOURCE, 'html/stats.json')
  if not data then
    dbg('stats.json missing, building now')
    buildAndWrite()
    Wait(150)
    data = LoadResourceFile(RESOURCE, 'html/stats.json')
  end
  if not data then
    TriggerClientEvent('nv_ls:sendStats', src, { ok=false, error='stats.json missing' })
    return
  end
  local ok, decoded = pcall(function() return json.decode(data) end)
  if not ok or type(decoded) ~= 'table' then
    TriggerClientEvent('nv_ls:sendStats', src, { ok=false, error='stats.json invalid json' })
    return
  end
  TriggerClientEvent('nv_ls:sendStats', src, decoded)
end)
