window.NV_CFG = {
  text: {
    title: "Loading…",
    serverName: "Azure Framework",
    subtitle: "Welcome back — syncing server stats...",

    leftTitle: "Loading into the city",
    leftSub: "Live server stats!",

    rightTitle: "Owned Businesses",
    rightSub: "Latest businesses in the city",

    tipPill: "Tip",
    tipText: "If your stats show “—”, make sure oxmysql is started and your mysql_connection_string is correct.",

    footerLeft: "DB-powered Loading Screen",
    footerRight: "Blue accent theme",

    emptyList: "Waiting for server stats…",
    errorTitle: "Profile sync issue"
  },

// ✅ CHANGE THESE TO ANY COLOR YOU WANT
  colors: {
    bg: "#07080c",
    bg2:"#0b0d14",

    panel: "rgba(16,17,24,.78)",
    panel2:"rgba(20,22,32,.70)",

    stroke:"rgba(255,255,255,.08)",
    stroke2:"rgba(47,183,255,.35)",

    text:"rgba(255,255,255,.92)",
    muted:"rgba(255,255,255,.62)",
    muted2:"rgba(255,255,255,.42)",


    accent:"#2fb3ffff",
    accent2:"#9b00af",
    good:"#2d35d4ff",
    warn:"#f59e0b",
    bad:"#ef4444",

    shadow:"rgba(0,0,0,.55)",
    glow:"rgba(47,183,255,.22)"
  },

  ui: {
    radius: 18,
    blur: 16,
    gridGap: 18,
    floatMs: 5200,
    shimmerMs: 1500,
    maxBusinessesPreview: 6,


    enableStatsJsonFetch: true,
    statsJsonPath: "stats.json",
    statsFetchTries: 10,
    statsFetchInterval: 700
  },

  media: {
    videoSrc: "assets/bg.mp4",
    logoSrc: "assets/logo.png"
  }
};
