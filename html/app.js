(() => {
  const CFG = window.NV_CFG || {};
  const IS_RUNTIME_PREVIEW = !!window.NV_RUNTIME_PREVIEW;
  const $ = (id) => document.getElementById(id);

  const isObj = (value) => value && typeof value === 'object' && !Array.isArray(value);
  const deepMerge = (target, src) => {
    if (!isObj(target) || !isObj(src)) return target;
    for (const key of Object.keys(src)) {
      const srcValue = src[key];
      if (isObj(srcValue)) {
        target[key] = deepMerge(isObj(target[key]) ? target[key] : {}, srcValue);
      } else {
        target[key] = srcValue;
      }
    }
    return target;
  };

  const setCssVar = (name, value) => {
    if (value === undefined || value === null || value === '') return;
    document.documentElement.style.setProperty(name, String(value));
  };

  const hexToRgb = (hex) => {
    const normalized = String(hex || '').trim().replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatInt = (value) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const formatMoney = (value) => `$${formatInt(Math.round(Number(value || 0)))}`;


  const getYouTubeVideoId = (input) => {
    const raw = String(input || '').trim();
    if (!raw) return null;

    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./i, '').toLowerCase();

      if (host === 'youtu.be') {
        const id = url.pathname.replace(/^\/+/, '').split('/')[0];
        return id || null;
      }

      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') return url.searchParams.get('v');
        if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1].split('/')[0] || null;
        if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/shorts/')[1].split('/')[0] || null;
      }
    } catch (_) {
      return null;
    }

    return null;
  };

  const buildYouTubeEmbedUrl = (input) => {
    const id = getYouTubeVideoId(input);
    if (!id) return null;
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      controls: '0',
      loop: '1',
      playlist: id,
      rel: '0',
      modestbranding: '1',
      playsinline: '1'
    });
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  };

  const stopBackgroundVideo = () => {
    try {
      dom.bgVideo.pause();
    } catch (_) {}
    dom.bgVideo.removeAttribute('src');
    if (dom.bgVideoSource) dom.bgVideoSource.removeAttribute('src');
    dom.bgVideo.load();
    dom.bgVideo.style.display = 'none';
    dom.bgVideo.style.opacity = '0';
  };

  const stopBackgroundYouTube = () => {
    if (!dom.bgYoutube || !dom.bgYoutubeFrame) return;
    dom.bgYoutubeFrame.src = 'about:blank';
    dom.bgYoutube.classList.add('hidden');
    if (dom.bgImage) {
      dom.bgImage.style.opacity = '1';
      dom.bgImage.style.visibility = 'visible';
    }
  };

  const state = {
    runtimeVisible: !IS_RUNTIME_PREVIEW,
    progress: 0,
    gotStats: false,
    statsRequested: false,
    detailsExpanded: true,
    keybindPageIndex: 0,
    showcaseIndex: 0,
    lastLuaAt: 0,
    lastStatusText: 'Connecting…',
    fetchAttempts: 0
  };

  const dom = {
    buildLabel: $('buildLabel'),
    showcaseText: $('showcaseText'),
    showcaseCredit: $('showcaseCredit'),
    keybindsTitle: $('keybindsTitle'),
    keybindGrid: $('keybindGrid'),
    kbPrev: $('kbPrev'),
    kbNext: $('kbNext'),
    brandLogo: $('brandLogo'),
    brandWordmark: $('brandWordmark'),
    brandSubline: $('brandSubline'),
    loadingCardTitle: $('loadingCardTitle'),
    loadingCardBody1: $('loadingCardBody1'),
    loadingCardBody2: $('loadingCardBody2'),
    detailStatsTitle: $('detailStatsTitle'),
    detailBusinessesTitle: $('detailBusinessesTitle'),
    emptyList: $('emptyList'),
    errorTitle: $('errorTitle'),
    detailsCard: $('detailsCard'),
    detailsContent: $('detailsContent'),
    detailsToggle: $('detailsToggle'),
    liveBadge: $('liveBadge'),
    progressLabel: $('progressLabel'),
    progressFill: $('progressFill'),
    progressPct: $('progressPct'),
    footerStatePrefix: $('footerStatePrefix'),
    statusText: $('statusText'),
    clock: $('clock'),
    statChars: $('statChars'),
    statCash: $('statCash'),
    statBank: $('statBank'),
    statJail: $('statJail'),
    statBiz: $('statBiz'),
    statVeh: $('statVeh'),
    bizList: $('bizList'),
    errorBox: $('errorBox'),
    errorMsg: $('errorMsg'),
    bgImage: document.querySelector('.bg-image'),
    bgYoutube: document.querySelector('.bg-youtube'),
    bgYoutubeFrame: document.querySelector('.bg-youtube-frame'),
    bgVideo: document.querySelector('.bg-video'),
    bgVideoSource: document.querySelector('.bg-video source')
  };


  const setRuntimeVisible = (visible) => {
    state.runtimeVisible = !!visible;
    if (IS_RUNTIME_PREVIEW) {
      document.body.classList.toggle('preview-open', state.runtimeVisible);
    }
  };

  const resetPreviewState = (preview) => {
    const next = preview && typeof preview === 'object' ? preview : {};
    const startProgress = Number(next.startProgress ?? 18);
    const targetProgress = Number(next.targetProgress ?? 94);
    hideError();
    setDetailsExpanded(CFG.ui?.detailsExpanded !== false);
    renderShowcase();
    renderKeybindPage();
    setStatus(next.statusText || 'In-game loading screen preview running…');
    setPhase(next.phaseText || 'Preview test active');
    dom.liveBadge.textContent = state.gotStats ? 'LIVE DATA' : 'SYNCING';
    setProgress(startProgress);

    const start = performance.now();
    const duration = 4600;
    const animate = (now) => {
      if (!state.runtimeVisible) return;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startProgress + (targetProgress - startProgress) * eased;
      setProgress(value, next.phaseText || 'Preview test active');
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const getShowcaseSlides = () => {
    const slides = Array.isArray(CFG.showcaseSlides) ? CFG.showcaseSlides : [];
    if (slides.length) return slides;
    return [{ text: CFG.text?.showcaseText || '', credit: CFG.text?.showcaseCredit || '' }];
  };

  const getKeybindPages = () => {
    const pages = Array.isArray(CFG.keybindPages) ? CFG.keybindPages : [];
    return pages.length ? pages : [[]];
  };

  const updateClock = () => {
    const now = new Date();
    dom.clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const updateDetailsToggleText = () => {
    dom.detailsToggle.textContent = state.detailsExpanded
      ? (CFG.text?.detailsHide || 'HIDE DETAILS')
      : (CFG.text?.detailsShow || 'SHOW DETAILS');
  };

  const setDetailsExpanded = (expanded) => {
    state.detailsExpanded = !!expanded;
    dom.detailsCard.classList.toggle('collapsed', !state.detailsExpanded);
    updateDetailsToggleText();
  };

  const renderShowcase = () => {
    const slides = getShowcaseSlides();
    const current = slides[state.showcaseIndex % slides.length] || {};
    dom.showcaseText.textContent = current.text || CFG.text?.showcaseText || '';
    dom.showcaseCredit.textContent = current.credit || CFG.text?.showcaseCredit || '';
  };

  const renderKeybindPage = () => {
    const pages = getKeybindPages();
    const total = pages.length;
    state.keybindPageIndex = ((state.keybindPageIndex % total) + total) % total;

    dom.keybindGrid.innerHTML = '';
    const currentPage = pages[state.keybindPageIndex] || [];

    currentPage.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'keybind-item';
      item.innerHTML = `
        <div class="keybind-key">${escapeHtml(entry.key || '?')}</div>
        <div class="keybind-label">${escapeHtml(entry.label || '')}</div>
      `;
      dom.keybindGrid.appendChild(item);
    });

    dom.kbPrev.classList.toggle('hidden-nav', total <= 1);
    dom.kbNext.classList.toggle('hidden-nav', total <= 1);
  };

  const setStatus = (text) => {
    const nextText = text || 'Loading…';
    state.lastStatusText = nextText;
    dom.statusText.textContent = nextText;
  };

  const setPhase = (text) => {
    dom.progressLabel.textContent = text || 'Preparing connection…';
  };

  const setProgress = (value, label) => {
    const clamped = Math.max(0, Math.min(100, Number(value || 0)));
    state.progress = clamped;
    dom.progressFill.style.width = `${clamped.toFixed(0)}%`;
    dom.progressPct.textContent = `${clamped.toFixed(0)}%`;
    if (label) setPhase(label);
  };

  const showError = (message) => {
    if (!message) return;
    dom.errorBox.classList.remove('hidden');
    dom.errorMsg.textContent = message;
  };

  const hideError = () => {
    dom.errorBox.classList.add('hidden');
    dom.errorMsg.textContent = '—';
  };

  const tweenTextNumber = (el, to, formatter) => {
    const toValue = Number(to || 0);
    const fromValue = Number(el.dataset.value || 0);
    const start = performance.now();
    const duration = 700;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = fromValue + (toValue - fromValue) * eased;
      el.textContent = formatter(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.dataset.value = String(toValue);
      }
    };

    requestAnimationFrame(tick);
  };

  const renderBusinesses = (rows) => {
    dom.bizList.innerHTML = '';
    const safeRows = Array.isArray(rows) ? rows : [];
    const max = Number(CFG.ui?.maxBusinessesPreview ?? 6);
    const subset = safeRows.slice(0, Math.max(0, max));

    if (!subset.length) {
      const empty = document.createElement('div');
      empty.className = 'business-empty';
      empty.textContent = CFG.text?.emptyList || 'Waiting for live server stats…';
      dom.bizList.appendChild(empty);
      return;
    }

    subset.forEach((row) => {
      const open = Number(row.is_open) === 1;
      const item = document.createElement('div');
      item.className = 'business-item';
      item.innerHTML = `
        <div class="business-top">
          <div>
            <div class="business-name">${escapeHtml(row.name || 'Business')}</div>
            <div class="business-type">${escapeHtml(row.type || '—')}</div>
          </div>
          <div class="business-badge ${open ? 'open' : 'closed'}">${open ? 'OPEN' : 'CLOSED'}</div>
        </div>
        <div class="business-meta">
          <span>Balance: ${formatMoney(row.balance || 0)}</span>
          <span>DB linked</span>
        </div>
      `;
      dom.bizList.appendChild(item);
    });
  };

  const setStats = (payload) => {
    if (!payload || typeof payload !== 'object') return;

    state.gotStats = true;
    dom.liveBadge.textContent = payload.ok === false ? 'ERROR' : 'LIVE DATA';
    hideError();

    if (payload.ok === false) {
      showError(payload.error || 'Unknown server data issue.');
      dom.liveBadge.textContent = 'ERROR';
    }

    if (payload.serverName) document.title = payload.serverName;

    tweenTextNumber(dom.statChars, payload.characters ?? 0, (n) => formatInt(Math.round(n)));
    tweenTextNumber(dom.statCash, payload.cash ?? 0, (n) => formatMoney(Math.round(n)));
    tweenTextNumber(dom.statBank, payload.bank ?? 0, (n) => formatMoney(Math.round(n)));
    tweenTextNumber(dom.statJail, payload.jailRecords ?? 0, (n) => formatInt(Math.round(n)));
    tweenTextNumber(dom.statBiz, payload.businesses ?? 0, (n) => formatInt(Math.round(n)));
    tweenTextNumber(dom.statVeh, payload.vehicles ?? 0, (n) => formatInt(Math.round(n)));

    renderBusinesses(payload.businessesPreview || []);

    if (state.progress < 54) {
      setProgress(54, 'Server data synced');
    } else {
      setPhase('Server data synced');
    }

    if (!/synced/i.test(state.lastStatusText)) {
      setStatus('Connected — live data synced');
    }
  };

  const applyConfig = () => {
    const text = CFG.text || {};
    const colors = CFG.colors || {};
    const ui = CFG.ui || {};
    const media = CFG.media || {};

    document.title = text.title || text.serverName || 'Az Loading';

    dom.buildLabel.textContent = ui.buildLabel || 'FiveM* (b2372) (Beta)';
    dom.keybindsTitle.textContent = text.keybindsTitle || 'Default Keybinds';
    dom.loadingCardTitle.textContent = text.loadingCardTitle || 'Downloading Server Data';
    dom.loadingCardBody1.textContent = text.loadingCardBody1 || '';
    dom.loadingCardBody2.textContent = text.loadingCardBody2 || '';
    dom.detailStatsTitle.textContent = text.detailStatsTitle || 'Live Server Snapshot';
    dom.detailBusinessesTitle.textContent = text.detailBusinessesTitle || 'Latest Businesses';
    dom.emptyList.textContent = text.emptyList || 'Waiting for live server stats…';
    dom.errorTitle.textContent = text.errorTitle || 'Server data issue';
    dom.footerStatePrefix.textContent = text.footerStatePrefix || 'Loading game';
    dom.brandWordmark.textContent = media.brandWordmark || text.serverName || 'az loading';
    dom.brandSubline.textContent = media.brandSubline || text.subtitle || '';

    setCssVar('--bg', colors.bg);
    setCssVar('--bg2', colors.bg2);
    setCssVar('--panel', colors.panel);
    setCssVar('--panel2', colors.panel2);
    setCssVar('--stroke', colors.stroke);
    setCssVar('--stroke2', colors.stroke2);
    setCssVar('--text', colors.text);
    setCssVar('--muted', colors.muted);
    setCssVar('--muted2', colors.muted2);
    setCssVar('--accent', colors.accent);
    setCssVar('--accent2', colors.accent2 || colors.accent);
    setCssVar('--good', colors.good);
    setCssVar('--warn', colors.warn);
    setCssVar('--bad', colors.bad);
    setCssVar('--shadow', colors.shadow);
    setCssVar('--glow', colors.glow);
    setCssVar('--radius', `${ui.radius ?? 18}px`);
    setCssVar('--blur', `${ui.blur ?? 12}px`);

    const accentRgb = colors.accentRgb || hexToRgb(colors.accent);
    const accent2Rgb = colors.accent2Rgb || hexToRgb(colors.accent2 || colors.accent);
    if (accentRgb) setCssVar('--accentRgb', accentRgb);
    if (accent2Rgb) setCssVar('--accent2Rgb', accent2Rgb);

    if (media.logoSrc) {
      dom.brandLogo.src = media.logoSrc;
      dom.brandLogo.classList.remove('hidden');
    } else {
      dom.brandLogo.classList.add('hidden');
    }

    dom.bgImage.style.backgroundImage = media.bgImageSrc ? `url('${media.bgImageSrc}')` : 'none';
    dom.bgImage.style.opacity = media.bgImageSrc ? '1' : '0';
    dom.bgImage.style.visibility = media.bgImageSrc ? 'visible' : 'hidden';

    const youtubeEmbedUrl = buildYouTubeEmbedUrl(media.videoSrc);
    if (youtubeEmbedUrl && dom.bgYoutube && dom.bgYoutubeFrame) {
      stopBackgroundVideo();
      dom.bgYoutubeFrame.src = youtubeEmbedUrl;
      dom.bgYoutube.classList.remove('hidden');
      dom.bgImage.style.opacity = '0';
      dom.bgImage.style.visibility = 'hidden';
    } else if (media.videoSrc) {
      stopBackgroundYouTube();
      dom.bgVideo.pause();
      dom.bgVideo.src = media.videoSrc;
      if (dom.bgVideoSource) dom.bgVideoSource.src = media.videoSrc;
      dom.bgVideo.muted = !!media.videoMuted;
      dom.bgVideo.volume = typeof ui.audioVolume === 'number' ? Math.max(0, Math.min(1, ui.audioVolume)) : 0.85;
      dom.bgVideo.autoplay = true;
      dom.bgVideo.loop = true;
      dom.bgVideo.playsInline = true;
      dom.bgVideo.style.display = 'block';
      dom.bgVideo.style.opacity = '1';

      const failToImage = () => {
        console.warn('[NV] Background video failed, falling back to image');
        stopBackgroundVideo();
        if (dom.bgImage) {
          const fallback = media.bgImageSrc || 'assets/bg.png';
          dom.bgImage.style.backgroundImage = `url('${fallback}')`;
          dom.bgImage.style.opacity = '1';
          dom.bgImage.style.visibility = 'visible';
        }
      };

      dom.bgVideo.onerror = failToImage;
      dom.bgVideo.addEventListener('stalled', failToImage, { once: true });
      dom.bgVideo.addEventListener('abort', failToImage, { once: true });

      const tryPlay = () => {
        try {
          dom.bgVideo.load();
          const playPromise = dom.bgVideo.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch((err) => {
              console.warn('[NV] Video autoplay failed:', err);
              failToImage();
            });
          }
        } catch (error) {
          console.warn('[NV] Video load/play error:', error);
          failToImage();
        }
      };

      tryPlay();
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) tryPlay();
      });
      window.addEventListener('focus', tryPlay);
    } else {
      stopBackgroundYouTube();
      stopBackgroundVideo();
    }
    renderShowcase();
    renderKeybindPage();
    setDetailsExpanded(ui.detailsExpanded !== false);
    updateDetailsToggleText();
  };

  const maybeRotateShowcase = () => {
    const slides = getShowcaseSlides();
    if (slides.length <= 1) return;
    const rotateMs = Number(CFG.ui?.showcaseRotateMs ?? 6500);
    window.setInterval(() => {
      state.showcaseIndex = (state.showcaseIndex + 1) % slides.length;
      renderShowcase();
    }, Math.max(2500, rotateMs));
  };

  const maybeFetchStatsJson = async () => {
    if (CFG.ui?.enableStatsJsonFetch === false) return;

    const maxAttempts = Number(CFG.ui?.statsFetchTries ?? 10);
    const interval = Number(CFG.ui?.statsFetchInterval ?? 700);
    const path = String(CFG.ui?.statsJsonPath || 'stats.json');

    const attemptFetch = async () => {
      state.fetchAttempts += 1;
      try {
        const response = await fetch(`${path}?ts=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data && typeof data === 'object') {
          setStats(data);
          return true;
        }
      } catch (error) {
        if (state.fetchAttempts >= maxAttempts && !state.gotStats) {
          showError(`Waiting for server snapshot… ${String(error.message || error)}`);
        }
      }
      return false;
    };

    const first = await attemptFetch();
    if (first) return;

    const timer = window.setInterval(async () => {
      if (state.gotStats || state.fetchAttempts >= maxAttempts) {
        window.clearInterval(timer);
        return;
      }
      const done = await attemptFetch();
      if (done) window.clearInterval(timer);
    }, Math.max(300, interval));
  };

  const bootProgress = () => {
    const fakeTimer = window.setInterval(() => {
      const bump = state.progress < 40 ? 1.8 : state.progress < 70 ? 1.15 : 0.55;
      const ceiling = state.gotStats ? 96 : 88;
      if (state.progress < ceiling) {
        setProgress(state.progress + bump);
      }
    }, 240);

    return fakeTimer;
  };

  const handleFiveMEvent = (eventName, eventData) => {
    if (eventName === 'startInitFunctionOrder') {
      setStatus('Initializing game session…');
      setPhase('Bootstrapping client');
      setProgress(Math.max(state.progress, 8));
    }

    if (eventName === 'initFunctionInvoking') {
      if (eventData && eventData.name) setPhase(String(eventData.name));
      setStatus(state.gotStats ? 'Loading game assets…' : 'Loading assets…');
      setProgress(Math.min(97, state.progress + 2.3));
    }

    if (eventName === 'endInitFunction') {
      setStatus('Finalizing connection…');
      setPhase('Finalizing client session');
      setProgress(Math.max(state.progress, 96));
    }
  };

  window.addEventListener('message', (event) => {
    let data = event.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        return;
      }
    }

    if (!data || typeof data !== 'object') return;

    if (data.eventName) {
      handleFiveMEvent(String(data.eventName), data.eventData || {});
    }

    if (data.action) {
      state.lastLuaAt = Date.now();
    }

    if (data.action === 'hello') {
      hideError();
      setStatus('Lua bridge linked');
      dom.liveBadge.textContent = 'LINKED';
      setProgress(Math.max(state.progress, 4), 'Handshake complete');
    }

    if (data.action === 'status') {
      hideError();
      setStatus(String(data.text || 'Loading…'));
      dom.liveBadge.textContent = state.gotStats ? 'LIVE DATA' : 'SYNCING';
    }

    if (data.action === 'cfg' && data.cfg) {
      deepMerge(CFG, data.cfg || {});
      applyConfig();
    }

    if (data.action === 'stats') {
      setStats(data.payload || {});
    }

    if (data.action === 'runtimeShow') {
      setRuntimeVisible(true);
      resetPreviewState(data.preview || {});
    }

    if (data.action === 'runtimeHide' || data.action === 'hideForGameplay') {
      setRuntimeVisible(false);
    }
  });

  dom.kbPrev.addEventListener('click', () => {
    state.keybindPageIndex -= 1;
    renderKeybindPage();
  });

  dom.kbNext.addEventListener('click', () => {
    state.keybindPageIndex += 1;
    renderKeybindPage();
  });

  dom.detailsToggle.addEventListener('click', () => {
    setDetailsExpanded(!state.detailsExpanded);
  });

  updateClock();
  window.setInterval(updateClock, 1000);
  window.setInterval(() => {
    const live = Date.now() - state.lastLuaAt < 3200;
    if (state.gotStats && live) {
      dom.liveBadge.textContent = 'LIVE DATA';
    } else if (live) {
      dom.liveBadge.textContent = 'SYNCING';
    }
  }, 700);

  applyConfig();
  renderShowcase();
  renderKeybindPage();
  hideError();
  setStatus('Connecting…');
  setPhase('Preparing connection…');
  setProgress(0);
  if (IS_RUNTIME_PREVIEW) {
    setRuntimeVisible(false);
  }
  bootProgress();
  maybeRotateShowcase();
  maybeFetchStatsJson();
})();
