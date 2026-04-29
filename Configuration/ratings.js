(function () {
    'use strict';

    // --- CONFIGURATION ---
    const CONFIG = {
        STWIDTH: '1.5', // L'épaisseur parfaite de 1.5px
        COLORS: {
            RED: '#ff3b30',
            ORANGE: '#ff9500',
            GREEN: '#34c759'
        },
        SELECTORS: {
            TRAILER_BTN: '.btnPlayTrailer',
            TABS_SLIDER: '.emby-tabs-slider',
            TAB_CONTAINER: '.tab-panel-container',
            PAGE_CONTAINER: '.pageContainer'
        }
    };

    const RATING = { DISLIKE: -1, LIKE: 1, LOVE: 2 };
    
    // Ton icône originale (contour silhouette)
    const THUMB_PATH = `M10.5 2A1.5 1.5 0 0 0 9 3.5v4.213l-1.94 3.105a1 1 0 0 1-.574.432l-2.035.581 A2 2 0 0 0 3 13.754v4.793c0 1.078.874 1.953 1.953 1.953.917 0 1.828.148 2.698.438 l1.493.498a11 11 0 0 0 3.479.564H16.5a3.5 3.5 0 0 0 3.467-3.017 3.5 3.5 0 0 0 1.028-2.671c.32-.529.505-1.15.505-1.812s-.185-1.283-.505-1.812Q21 12.595 21 12.5 A3.5 3.5 0 0 0 17.5 9h-1.566c.041-.325.066-.66.066-1 0-1.011-.221-2.194-.446-3.148 C15.14 3.097 13.543 2 11.838 2z`;
    const BACK_PATH = `M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z`;
    const CAL_PATH  = `M3 7a3 3 0 013-3h12a3 3 0 013 3v11a3 3 0 01-3 3H6a3 3 0 01-3-3V7z M3 9h18 M8 2v4 M16 2v4 M7 12h2v2H7v-2z M11 12h2v2h-2v-2z M15 12h2v2h-2v-2z M7 16h2v2H7v-2z M11 16h2v2h-2v-2z M15 17.5l1.5 1.5 3-3`;
    const AUDIO_PATH = `M3 9v6h4l5 5V4L7 9H3z M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z`;
    const PIN_PATH  = `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z`;
    const TV_PATH   = `M21 3H3a2 2 0 00-2 2v12a2 2 0 002 2h5v2h8v-2h5a2 2 0 002-2V5a2 2 0 00-2-2zm0 14H3V5h18v12z`;

    // Encodage URI pour le tab (basé sur CONFIG.STWIDTH)
    const THUMB_SVG_URI = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='${CONFIG.STWIDTH}' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='${THUMB_PATH}'/%3E%3C/svg%3E")`;

    let state = { currentId: null, isInjecting: false };

    // --- STYLES ---
    const style = document.createElement('style');
    style.textContent = `
        .btnPlayTrailer { display: none !important; }
        .rating-wrapper { position: relative; display: inline-flex; vertical-align: middle; margin-right: .5em; }
        
        /* Base des icônes SVG */
        .jr-svg-base { fill: none; stroke: currentColor; stroke-width: ${CONFIG.STWIDTH}; stroke-linecap: round; stroke-linejoin: round; }
        
        .jr-btn { color: var(--text-primary); cursor: pointer; border: none; background: transparent; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; outline: none; }
        .jr-btn:hover { background-color: rgba(255,255,255,0.15); }
        .jr-btn svg { width: 24px; height: 24px; }
        
        .jr-btn[data-rating=\"-1\"].is-active { color: ${CONFIG.COLORS.RED}; }
        .jr-btn[data-rating=\"1\"].is-active { color: ${CONFIG.COLORS.ORANGE}; }
        .jr-btn[data-rating=\"2\"].is-active { color: ${CONFIG.COLORS.GREEN}; }

        .rating-menu { position: absolute; bottom: 55px; left: 50%; transform: translateX(-50%) translateY(10px) scale(0.9); background-color: var(--panel-background, #1c1c1c); backdrop-filter: blur(20px); border-radius: 40px; padding: 4px 8px; display: flex; gap: 4px; visibility: hidden; opacity: 0; transition: all 0.2s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.6); z-index: 1000; border: 1px solid rgba(255,255,255,0.1); }
        .rating-menu::after { content: ''; position: absolute; bottom: -20px; left: 0; right: 0; height: 25px; }
        .rating-wrapper:hover .rating-menu, .rating-wrapper.is-open .rating-menu { visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        
        .opt-btn { position: relative; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary); transition: transform 0.1s ease; }
        .opt-btn:hover { background-color: rgba(255,255,255,0.1); transform: scale(1.15); }
        .opt-btn[data-rating=\"-1\"].is-selected { color: ${CONFIG.COLORS.RED}; }
        .opt-btn[data-rating=\"1\"].is-selected { color: ${CONFIG.COLORS.ORANGE}; }
        .opt-btn[data-rating=\"2\"].is-selected { color: ${CONFIG.COLORS.GREEN}; }
        .opt-btn svg { width: 22px; height: 22px; }
        .opt-btn.dislike svg { transform: rotate(180deg); }
        .opt-btn.love svg { width: 30px; }
        
        .opt-btn::before { content: attr(data-label); position: absolute; bottom: 52px; left: 50%; transform: translateX(-50%) translateY(5px); background: transparent; color: #ffffff !important; padding: 4px 10px; font-size: 12px; font-weight: 600; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s ease, transform 0.2s ease; z-index: 1001; }
        .opt-btn:hover::before { opacity: 1; transform: translateX(-50%) translateY(0); }

        .jr-card-badge { position: absolute; bottom: 8px; right: 8px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 3; box-shadow: 0 2px 5px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: #ffffff; }
        .jr-card-badge svg { width: 16px; height: 16px; }
        .jr-card-badge[data-rating=\"-1\"] { background: rgba(229, 9, 20, 0.9); }
        .jr-card-badge[data-rating=\"-1\"] svg { transform: rotate(180deg); }
        .jr-card-badge[data-rating=\"1\"] { background: rgba(240, 160, 0, 0.9); }
        .jr-card-badge[data-rating=\"2\"] { background: rgba(0, 160, 80, 0.9); }
        
        #jr-tab-panel { width: 100%; display: none; }
        body.jr-tab-active #jr-tab-panel { display: block !important; position: relative; z-index: 100; }
        body.jr-tab-active .tab-panel-container > div:not(#jr-tab-panel), body.jr-tab-active .pageContainer > div:not(#jr-tab-panel), body.jr-tab-active .sections, body.jr-tab-active #slides-container { display: none !important; }
        .jr-header { display: flex; align-items: center; gap: 15px; margin-bottom: 1em; padding: 0 3.3%; }
        .jr-back-arrow { width: 32px; height: 32px; cursor: pointer; color: var(--text-primary); transition: transform 0.2s; }
        .jr-back-arrow:hover { transform: translateX(-3px); color: var(--theme-primary-color); }
        .jr-search { margin: 1.5em auto; max-width: 600px; padding: 0 3.3%; box-sizing: border-box; }
        .jr-search input#jr-search-input { width: 100% !important; padding: 10px 18px !important; border-radius: 24px !important; border: 1px solid rgba(127,127,127,0.5) !important; background: rgba(127,127,127,0.18) !important; color: var(--text-primary, #fff) !important; font-size: 15px !important; outline: none !important; transition: border-color 0.2s, background 0.2s !important; box-sizing: border-box !important; height: auto !important; display: block !important; }
        .jr-search input#jr-search-input::placeholder { color: var(--text-primary, #fff) !important; opacity: 0.55 !important; }
        .jr-search input#jr-search-input:focus { border-color: var(--theme-primary-color, #00a4dc) !important; background: rgba(127,127,127,0.28) !important; }
        #jr-search-results { display: none; }
        body.jr-search-active #jr-search-results { display: flex; flex-wrap: wrap; }
        body.jr-search-active #jr-cards-container { display: none; }
        .jr-search-status { padding: 1em; opacity: 0.7; flex-basis: 100%; }
        @media (max-width: 800px) {
            body.jr-tab-active #jr-tab-panel { padding-top: 7em; }
        }
        
        #jr-seerr-detail-page { display: none; }
        body.jr-detail-active #jr-seerr-detail-page { display: flex !important; flex-direction: column; position: relative; z-index: 150; min-height: 100vh; background: transparent; }
        #jr-seerr-detail-page .jr-backdrop-fixed { position: fixed; inset: 0; background-size: cover; background-position: center top; z-index: 0; pointer-events: none; }
        #jr-seerr-detail-page .jr-backdrop-fixed::after { content: ''; position: absolute; inset: 0; background: var(--background-color, #101010); opacity: 0.55; }
        #jr-seerr-detail-page .detailPageWrapperContainer { position: relative; z-index: 1; flex: 1 0 auto; display: flex; flex-direction: column; }
        #jr-seerr-detail-page .detailPagePrimaryContent { flex: 1 0 auto; }
        body.jr-detail-active #jr-tab-panel,
        body.jr-detail-active #indexPage,
        body.jr-detail-active .tab-panel-container > div:not(#jr-seerr-detail-page),
        body.jr-detail-active .pageContainer > div:not(#jr-seerr-detail-page),
        body.jr-detail-active .sections,
        body.jr-detail-active #slides-container { display: none !important; }
        .jr-detail-status { padding: 4em 1em; text-align: center; opacity: 0.7; }
        .jr-detail-back { position: fixed; top: 70px; left: 1em; z-index: 200; width: 42px; height: 42px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .jr-detail-back:hover { background: rgba(0,0,0,0.85); }
        .jr-detail-back svg { width: 22px; height: 22px; }
        #jr-seerr-detail-page .jr-btn-row { margin-top: 1em; display: flex; justify-content: center; align-items: center; gap: 0.8em; }
        #jr-seerr-detail-page .jr-btn-request { display: inline-flex; align-items: center; gap: 0.4em; padding: 0.4rem 0.9rem; border-radius: 0.375rem; border: 1px solid; font-family: inherit; font-size: 0.875rem; font-weight: 500; line-height: 1.25rem; color: #fff; cursor: pointer; transition: background-color 150ms ease-in-out, border-color 150ms ease-in-out; }
        #jr-seerr-detail-page .jr-btn-request:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.4); }
        #jr-seerr-detail-page .jr-btn-icon { width: 1em; height: 1em; display: inline-flex; }
        #jr-seerr-detail-page .jr-btn-icon svg { width: 100%; height: 100%; display: block; }
        #jr-seerr-detail-page .jr-btn-variant-demander { background: rgba(79,70,229,0.8); border-color: #6366f1; }
        #jr-seerr-detail-page .jr-btn-variant-demander:hover { background: #4f46e5; border-color: #6366f1; }
        #jr-seerr-detail-page .jr-btn-variant-demander:active { background: #4338ca; border-color: #4338ca; }
        #jr-seerr-detail-page .jr-btn-variant-wait { background: rgba(234,88,12,0.8); border-color: #f97316; cursor: not-allowed; }

        /* --- Header Jellyfin transparent quand notre page est active --- */
        body.jr-detail-active .skinHeader { background: transparent !important; background-color: transparent !important; box-shadow: none !important; transition: background 0.3s ease, backdrop-filter 0.3s ease; }
        body.jr-detail-active .skinHeader.headroom--not-top { background: rgba(20, 20, 20, 0.55) !important; -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); }

        /* --- Hero page détail Seerr --- */
        #jr-seerr-detail-page { padding: 0 !important; }
        #jr-seerr-detail-page .jr-hero { position: relative; min-height: 55vh; padding: 8em 1em 1em; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 1.2em; text-align: center; }
        #jr-seerr-detail-page .jr-hero-logo { width: 40%; max-width: 480px; max-height: 220px; object-fit: contain; }
        #jr-seerr-detail-page .detailPageWrapperContainer { position: relative; }
        #jr-seerr-detail-page h1.itemName { font-size: 2.4em; margin: 0.2em 0 0.5em; font-weight: 400; }
        #jr-seerr-detail-page .itemMiscInfo-primary { justify-content: center; flex-wrap: wrap; gap: 0.5em 1.5em; }
        #jr-seerr-detail-page .detailPagePrimaryContent { max-width: none; margin: 0; }
        #jr-seerr-detail-page .detailSection, #jr-seerr-detail-page .detailSectionContent { display: block !important; column-count: 1 !important; }
        #jr-seerr-detail-page .tagline { display: block; width: 100%; font-style: italic; font-weight: 700; opacity: 0.85; font-size: 1.15em; margin: 0 0 0.6em; padding: 0; text-align: left; }
        #jr-seerr-detail-page .overview { display: block; width: 100%; line-height: 1.55; opacity: 0.92; margin: 0 0 1.5em; padding: 0; text-align: left; }
        #jr-seerr-detail-page .jr-cast-header { display: flex; align-items: center; justify-content: space-between; gap: 1em; margin-bottom: 0.5em; }
        #jr-seerr-detail-page .jr-cast-nav { display: flex; gap: 0.5em; }
        #jr-seerr-detail-page .jr-cast-arrow { width: 2.4em; height: 2.4em; border-radius: 50%; border: none; background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s; }
        #jr-seerr-detail-page .jr-cast-arrow:hover { background: rgba(255,255,255,0.2); }
        #jr-seerr-detail-page .jr-cast-arrow svg { width: 1.3em; height: 1.3em; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        #jr-seerr-detail-page .jr-cast-track::-webkit-scrollbar { display: none; }
        #jr-seerr-detail-page .jr-cast-track { scrollbar-width: none; }
        #jr-seerr-detail-page .jr-cast-card { display: inline-block; width: 160px; margin-right: 1.2em; vertical-align: top; white-space: normal; text-align: center; }
        #jr-seerr-detail-page .jr-cast-avatar { width: 160px; height: 160px; border-radius: 50%; background-size: cover; background-position: center; margin: 0 auto 0.6em; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        #jr-seerr-detail-page .jr-cast-avatar-empty { background: rgba(127,127,127,0.2); }
        #jr-seerr-detail-page .jr-cast-name { font-weight: 600; font-size: 0.95em; margin-bottom: 0.15em; }
        #jr-seerr-detail-page .jr-cast-role { font-size: 0.85em; opacity: 0.7; }
        #jr-seerr-detail-page .jr-info-panels { display: flex; flex-wrap: wrap; gap: 0.8em; margin: 0.8em 0 1.2em; align-items: stretch; }
        #jr-seerr-detail-page .jr-info-panel { flex: 1 1 320px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.4em 1em; margin: 0; font-size: 0.88em; }
        #jr-seerr-detail-page .jr-info-panel .detailsGroupItem { display: block; padding: 0.45em 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        #jr-seerr-detail-page .jr-info-panel .detailsGroupItem:last-child { border-bottom: none; }
        #jr-seerr-detail-page .jr-info-panel .detailsGroupItem label { display: flex; align-items: center; gap: 0.4em; font-size: 0.72em; font-weight: 600; opacity: 0.55; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.15em; padding: 0; }
        #jr-seerr-detail-page .jr-info-panel .detailsGroupItem label svg { width: 1.3em; height: 1.3em; fill: currentColor; flex-shrink: 0; }
        #jr-seerr-detail-page .jr-info-panel .detailsGroupItem span { display: block; opacity: 0.95; line-height: 1.35; }
        #jr-seerr-detail-page .jr-info-panel .detailsGroupItem label { margin-bottom: 0.35em; }
        #jr-seerr-detail-page .detailPagePrimaryContent { background: transparent; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); padding: 0.5em 4em 1.5em !important; margin-top: 0; }

        #jr-tab-btn .emby-button-foreground::before {
            content: ''; display: inline-block; width: 1.25em; height: 1.25em; background-color: currentColor;
            -webkit-mask-image: ${THUMB_SVG_URI}; mask-image: ${THUMB_SVG_URI};
            -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
            margin-right: 0.5em; vertical-align: middle;
        }
    `;
    document.head.appendChild(style);

    const UI = {
        getSvg: (path) => `<svg class=\"jr-svg-base\" viewBox=\"0 0 24 24\"><path d=\"${path}\"/></svg>`,
        getDoubleThumb: () => `<svg class=\"jr-svg-base\" viewBox=\"0 0 32 24\"><path opacity=\"0.4\" transform=\"translate(6,0)\" d=\"${THUMB_PATH}\"/><path d=\"${THUMB_PATH}\"/></svg>`,
        esc: (str) => { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; }
    };

    function _widget_inner_html() {
        return `<button class=\"jr-trigger jr-btn\">${UI.getSvg(THUMB_PATH)}</button><div class=\"rating-menu\"><div class=\"opt-btn dislike\" data-rating=\"-1\" data-label=\"Pas pour moi\">${UI.getSvg(THUMB_PATH)}</div><div class=\"opt-btn\" data-rating=\"1\" data-label=\"J'aime bien\">${UI.getSvg(THUMB_PATH)}</div><div class=\"opt-btn love\" data-rating=\"2\" data-label=\"J'adore !\">${UI.getDoubleThumb()}</div></div>`;
    }

    const API = {
        get: (url) => ApiClient.getJSON(ApiClient.getUrl(url)),
        ajax: (type, url, body, dataType) => ApiClient.ajax({
            type,
            url: ApiClient.getUrl(url),
            ...(dataType ? { dataType } : {}),
            ...(body !== undefined ? { data: JSON.stringify(body), contentType: 'application/json' } : {})
        })
    };

    // --- NAVIGATION ---
    function exitRatingsMode() {
        document.body.classList.remove('jr-tab-active');
        sessionStorage.removeItem('jr-last-tab');
        const btn = document.getElementById('jr-tab-btn');
        if (btn) btn.classList.remove('emby-tab-button-active');
    }

    function enterRatingsMode() {
        const btn = document.getElementById('jr-tab-btn');
        const slider = document.querySelector(CONFIG.SELECTORS.TABS_SLIDER);
        if (slider) slider.querySelectorAll('.emby-tab-button').forEach(b => b.classList.remove('emby-tab-button-active'));
        if (btn) btn.classList.add('emby-tab-button-active');
        document.body.classList.add('jr-tab-active');
        sessionStorage.setItem('jr-last-tab', 'ratings');
        loadCards();
    }

    function injectTab() {
        const slider = document.querySelector(CONFIG.SELECTORS.TABS_SLIDER);
        if (!slider || document.getElementById('jr-tab-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button'; btn.id = 'jr-tab-btn'; btn.setAttribute('is', 'emby-button'); 
        btn.className = 'emby-tab-button emby-button';
        btn.innerHTML = `<div class=\"emby-button-foreground\">Votes</div>`;
        slider.appendChild(btn);
        const container = document.querySelector(CONFIG.SELECTORS.TAB_CONTAINER) || document.querySelector(CONFIG.SELECTORS.PAGE_CONTAINER) || document.body;
        let panel = document.getElementById('jr-tab-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'jr-tab-panel'; panel.className = 'tabContent';
            panel.innerHTML = `<div class=\"padded-left padded-right padded-bottom\"><div class=\"jr-search\"><input type=\"search\" id=\"jr-search-input\" placeholder=\"Rechercher un film ou une série...\" autocomplete=\"off\" /></div><div class=\"verticalSection\"><div class=\"itemsContainer vertical-wrap\" id=\"jr-cards-container\"></div><div class=\"itemsContainer vertical-wrap\" id=\"jr-search-results\"></div></div></div>`;
            _bind_search(panel);
            container.appendChild(panel);
        }
        if (!document.getElementById('jr-seerr-detail-page')) {
            const dp = document.createElement('div');
            dp.id = 'jr-seerr-detail-page';
            dp.className = 'page libraryPage itemDetailPage noSecondaryNavPage selfBackdropPage';
            document.body.appendChild(dp);
        }
        slider.addEventListener('click', (e) => {
            const clicked = e.target.closest('.emby-tab-button');
            if (!clicked) return;
            if (clicked.id === 'jr-tab-btn') { e.preventDefault(); e.stopPropagation(); enterRatingsMode(); }
            else { exitRatingsMode(); }
        }, true);
        if (sessionStorage.getItem('jr-last-tab') === 'ratings') enterRatingsMode();
    }

    async function loadCards() {
        const container = document.getElementById('jr-cards-container');
        if (!container) return;
        container.innerHTML = '<p style=\"padding:1em\">Chargement...</p>';
        try {
            const userId = ApiClient.getCurrentUserId();
            const data = await API.get(`api/MediaRating/User/${userId}`);
            if (!data.success || !data.ratings?.length) { container.innerHTML = '<p style=\"padding:1em\">Aucun vote.</p>'; return; }
            const ids = data.ratings.map(r => r.item_id.replace(/-/g, '')).join(',');
            const items = await API.get(`Users/${userId}/Items?Ids=${ids}&Fields=PrimaryImageAspectRatio,ImageTags,ProductionYear`);
            const itemMap = {}; (items.Items || []).forEach(it => { itemMap[it.Id] = it; });
            container.innerHTML = data.ratings.map(r => _build_card_html(r, itemMap)).join('');
        } catch (e) { container.innerHTML = '<p>Erreur.</p>'; }
    }

    // --- SEARCH ---
    let _search_timer = null;
    let _search_seq   = 0;

    function _bind_search(panel) {
        const input   = panel.querySelector('#jr-search-input');
        const results = panel.querySelector('#jr-search-results');
        if (!input || !results) return;

        input.addEventListener('input', () => {
            const query = input.value.trim();
            clearTimeout(_search_timer);

            if (!query) {
                document.body.classList.remove('jr-search-active');
                results.innerHTML = '';
                return;
            }

            _search_timer = setTimeout(() => _run_search(query, results), 300);
        });
    }

    async function _run_search(query, container) {
        const seq = ++_search_seq;
        document.body.classList.add('jr-search-active');
        container.innerHTML = `<p class=\"jr-search-status\">Recherche...</p>`;

        const userId      = ApiClient.getCurrentUserId();
        const jf_promise  = _search_jellyfin(userId, query).catch(() => []);
        const sr_promise  = _search_seerr(query).catch(() => []);

        const jf = await jf_promise;
        if (seq !== _search_seq) return;
        if (jf.length) {
            container.innerHTML = jf.map(_build_unified_card_html).join('') + `<p class=\"jr-search-status\">Recherche Seerr...</p>`;
        }

        const seerr = await sr_promise;
        if (seq !== _search_seq) return;

        const seen_keys = new Set(jf.filter(i => i.tmdb_id).map(i => `${i.media_type}_${i.tmdb_id}`));
        const seerr_filtered = seerr.filter(s => !seen_keys.has(`${s.media_type}_${s.id}`));
        const merged = [...jf, ...seerr_filtered];

        container.innerHTML = merged.length
            ? merged.map(_build_unified_card_html).join('')
            : `<p class=\"jr-search-status\">Aucun résultat.</p>`;
    }

    async function _search_jellyfin(userId, query) {
        try {
            const data = await API.get(`Users/${userId}/Items?searchTerm=${encodeURIComponent(query)}&IncludeItemTypes=Movie,Series&Recursive=true&Limit=20&Fields=ProductionYear,ImageTags,ProviderIds`);
            return (data.Items || []).map(it => ({
                source:     'jellyfin',
                id:         it.Id,
                media_type: it.Type === 'Series' ? 'tv' : 'movie',
                title:      it.Name,
                year:       it.ProductionYear ?? '',
                tmdb_id:    it.ProviderIds?.Tmdb ? parseInt(it.ProviderIds.Tmdb) : null,
                poster_url: it.ImageTags?.Primary
                    ? ApiClient.getUrl(`Items/${it.Id}/Images/Primary?fillHeight=456&fillWidth=304&quality=96&tag=${it.ImageTags.Primary}`)
                    : null,
                detail_url: `#/details?id=${it.Id}&serverId=${ApiClient.serverId()}`
            }));
        } catch { return []; }
    }

    async function _search_seerr(query) {
        try {
            const data = await API.get(`api/MediaRating/SeerrSearch?query=${encodeURIComponent(query)}`);
            if (!data.success) return [];
            return (data.results || []).map(r => ({ ...r, source: 'seerr' }));
        } catch { return []; }
    }

    function _build_unified_card_html(r) {
        const title  = r.title ?? '';
        const year   = r.year ?? '';
        const poster = r.poster_url ?? '';
        const img = poster
            ? `<img src=\"${poster}\" style=\"width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0\" alt=\"${UI.esc(title)}\"/>`
            : `<div style=\"width:100%;height:100%;position:absolute;top:0;left:0;background:rgba(127,127,127,0.15)\"></div>`;
        const dataAttrs = r.source === 'jellyfin'
            ? `data-jellyfin-id=\"${r.id}\"`
            : `data-seerr-id=\"${r.id}\" data-media-type=\"${r.media_type}\"`;
        const target_url = r.detail_url
            || (r.source === 'seerr' ? `#!/jr-seerr-detail?id=${r.id}&type=${r.media_type}` : null);
        const imageWrap = target_url
            ? `<a href=\"${target_url}\" class=\"cardImageContainer coveredImage cardContent itemAction\">${img}</a>`
            : `<div class=\"cardImageContainer coveredImage cardContent\">${img}</div>`;
        const titleWrap = target_url
            ? `<a href=\"${target_url}\" class=\"itemAction textActionButton\">${UI.esc(title)}</a>`
            : UI.esc(title);
        return `<div class=\"card portraitCard card-hoverable\" data-source=\"${r.source}\" ${dataAttrs}><div class=\"cardBox cardBox-bottompadded\"><div class=\"cardScalable\"><div class=\"cardPadder cardPadder-overflowPortrait\"></div>${imageWrap}</div><div class=\"cardText cardTextCentered cardText-first\"><bdi>${titleWrap}</bdi></div><div class=\"cardText cardTextCentered cardText-secondary\"><bdi>${year}</bdi></div></div></div>`;
    }

    function _build_card_html(r, itemMap) {
        const id = r.item_id.replace(/-/g, '');
        const is_orphan = id === '00000000000000000000000000000000';
        const item = itemMap[id];
        const name = item?.Name ?? r.item_name ?? '';
        const year = item?.ProductionYear ?? '';
        const seerr_url = (is_orphan && r.tmdb_id && r.media_type) ? `#!/jr-seerr-detail?id=${r.tmdb_id}&type=${r.media_type}` : null;
        const detailUrl = item ? `#/details?id=${id}&serverId=${ApiClient.serverId()}` : (seerr_url ?? '#');
        const linkAttr = (item || seerr_url) ? `class=\"itemAction textActionButton\"` : `style=\"pointer-events:none;opacity:.7\"`;
        const jellyfinUrl = item?.ImageTags?.Primary ? ApiClient.getUrl(`Items/${id}/Images/Primary?fillHeight=456&fillWidth=304&quality=96&tag=${item.ImageTags.Primary}`) : null;
        const fallback = r.poster_url ?? '';
        const primarySrc = jellyfinUrl ?? fallback;
        const errAttr = jellyfinUrl && fallback ? `onerror=\"this.onerror=null;this.src='${fallback}'\"` : '';
        return `<div class=\"card portraitCard card-hoverable card-withuserdata\" data-id=\"${id}\"><div class=\"cardBox cardBox-bottompadded\"><div class=\"cardScalable\"><div class=\"cardPadder cardPadder-overflowPortrait\"></div><a href=\"${detailUrl}\" class=\"cardImageContainer coveredImage cardContent itemAction lazy\"><img src=\"${primarySrc}\" ${errAttr} style=\"width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0\" alt=\"${UI.esc(name)}\"/><div class=\"jr-card-badge\" data-rating=\"${r.rating}\">${UI.getSvg(THUMB_PATH)}</div></a></div><div class=\"cardText cardTextCentered cardText-first\"><bdi><a href=\"${detailUrl}\" ${linkAttr}>${UI.esc(name)}</a></bdi></div><div class=\"cardText cardTextCentered cardText-secondary\"><bdi>${year}</bdi></div></div></div>`;
    }

    // --- DETAIL PAGE (Seerr) ---
    let _detail_seq = 0;

    function _parse_detail_hash() {
        const h = window.location.hash || '';
        if (!h.includes('jr-seerr-detail')) return null;
        const qs = h.split('?')[1] || '';
        const params = new URLSearchParams(qs);
        const id = parseInt(params.get('id'));
        const type = params.get('type');
        if (!id || (type !== 'movie' && type !== 'tv')) return null;
        return { id, mediaType: type };
    }

    async function _handle_detail_route() {
        const panel = document.getElementById('jr-seerr-detail-page');
        if (!panel) return;
        const route = _parse_detail_hash();
        if (!route) {
            document.body.classList.remove('jr-detail-active');
            panel.innerHTML = '';
            return;
        }
        const seq = ++_detail_seq;
        document.body.classList.add('jr-detail-active');
        panel.innerHTML = `<div class=\"jr-detail-status\">Chargement...</div>`;
        try {
            const [res, imgs] = await Promise.all([
                API.get(`api/MediaRating/SeerrDetails?id=${route.id}&mediaType=${route.mediaType}`),
                API.get(`api/MediaRating/TmdbImages?id=${route.id}&mediaType=${route.mediaType}`).catch(() => ({ success: false }))
            ]);
            if (seq !== _detail_seq) return;
            if (!res.success) throw new Error(res.message || 'Erreur Seerr');
            const logos = (imgs && imgs.success && imgs.data && imgs.data.logos) || [];
            panel.innerHTML = _build_detail_html(res.data, route.mediaType, logos);
            _bind_detail(panel, route, res.data, logos);
            const _title = res.data.title || res.data.name || '';
            if (_title) {
                document.title = _title;
                const _h3 = document.querySelector('h3.pageTitle');
                if (_h3) _h3.textContent = _title;
            }
        } catch (e) {
            if (seq !== _detail_seq) return;
            panel.innerHTML = `<div class=\"jr-detail-status\">❌ ${UI.esc(e.message || 'Erreur')}</div>`;
        }
    }

    function _format_runtime(min) {
        if (!min) return '';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return h ? `${h}h ${m}min` : `${m}min`;
    }

    function _format_lang(code) {
        if (!code) return '';
        try { return new Intl.DisplayNames(['fr'], { type: 'language' }).of(code) || code; }
        catch { return code; }
    }

    function _format_date(iso) {
        if (!iso) return '';
        const dt = new Date(iso);
        if (isNaN(dt)) return iso;
        return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const SVG_REQUEST = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>';
    const SVG_HOURGLASS = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5m2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256 1.011.791 1.011 1.491v.702c0 .7-.478 1.235-1.011 1.491A3.5 3.5 0 0 0 4.5 13v1h7v-1a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351v-.702c0-.7.478-1.235 1.011-1.491A3.5 3.5 0 0 0 11.5 3V2z"/></svg>';

    function _request_button_config(status) {
        if (status === 5) return null;
        if (status === 2 || status === 3 || status === 4) {
            return { label: 'En attente', svg: SVG_HOURGLASS, variant: 'wait', disabled: true };
        }
        return { label: 'Demander', svg: SVG_REQUEST, variant: 'demander', disabled: false };
    }

    function _build_detail_html(d, mediaType, logos) {
        const title    = d.title || d.name || '';
        const date     = d.releaseDate || d.firstAirDate || '';
        const year     = date ? date.substring(0, 4) : '';
        const runtime  = d.runtime || (d.episodeRunTime && d.episodeRunTime[0]) || 0;
        const vote     = d.voteAverage ? d.voteAverage.toFixed(1) : null;
        const tagline  = d.tagline || '';
        const overview = d.overview || '';
        const genres   = (d.genres || []).map(g => g.name).join(', ');
        const studios  = (d.productionCompanies || []).map(s => s.name).join(', ');
        const countries = (d.productionCountries || []).map(c => c.name).join(', ');
        const orig_lang = _format_lang(d.originalLanguage);
        const crew     = (d.credits && d.credits.crew) || [];
        const directors = crew.filter(p => p.job === 'Director').map(p => p.name).join(', ');
        const writers  = crew.filter(p => p.department === 'Writing').slice(0, 5).map(p => p.name).join(', ');
        const cast     = ((d.credits && d.credits.cast) || []).slice(0, 20);
        const backdrop = d.backdropPath ? `https://image.tmdb.org/t/p/original${d.backdropPath}` : '';
        const poster   = d.posterPath ? `https://image.tmdb.org/t/p/w500${d.posterPath}` : '';
        const status   = (d.mediaInfo && d.mediaInfo.status) || 1;
        const btn      = _request_button_config(status);
        const fr_prov  = (d.watchProviders || []).find(w => w.iso_3166_1 === 'FR');
        const flatrate = (fr_prov && fr_prov.flatrate) || [];
        const _logos   = logos || [];
        const pick_logo = (lang) => _logos.find(l => l.iso_639_1 === lang);
        const logo     = pick_logo('fr') || pick_logo(null) || pick_logo('en') || _logos[0] || null;
        const logo_url = logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null;

        const castHtml = cast.map(p => {
            const profile = p.profilePath ? `https://image.tmdb.org/t/p/w185${p.profilePath}` : '';
            const avatar = profile
                ? `<div class=\"jr-cast-avatar\" style=\"background-image:url('${profile}')\"></div>`
                : `<div class=\"jr-cast-avatar jr-cast-avatar-empty\"></div>`;
            return `<div class=\"jr-cast-card\">${avatar}<div class=\"jr-cast-name\">${UI.esc(p.name)}</div><div class=\"jr-cast-role\">${UI.esc(p.character || '')}</div></div>`;
        }).join('');

        return `
        <button class=\"jr-detail-back\" type=\"button\" title=\"Retour\">${UI.getSvg(BACK_PATH)}</button>
        ${backdrop ? `<div class=\"jr-backdrop-fixed\" style=\"background-image:url('${backdrop}')\"></div>` : ''}
        <div class=\"detailPageWrapperContainer padded-bottom-page\">
            <div class=\"jr-hero\">
                ${logo_url
                    ? `<img class=\"jr-hero-logo\" src=\"${logo_url}\" alt=\"${UI.esc(title)}\"/>`
                    : `<h1 class=\"itemName infoText parentNameLast\" style=\"margin:0;font-size:2.4em;font-weight:400\">${UI.esc(title)}</h1>`}
                <div class=\"jr-btn-row\">
                    <div class=\"rating-wrapper\" id=\"jr-seerr-widget\">${_widget_inner_html()}</div>
                    ${btn ? `<button type=\"button\" class=\"jr-btn-request jr-btn-variant-${btn.variant}\" id=\"jr-btn-request\"${btn.disabled ? ' disabled' : ''}>
                        <span class=\"jr-btn-icon\" aria-hidden=\"true\">${btn.svg}</span>
                        <span class=\"jr-btn-label\">${btn.label}</span>
                    </button>` : ''}
                </div>
            </div>
            <div class=\"detailPagePrimaryContent padded-left padded-right\">
                <div class=\"detailSection detailSectionContent\">
                    ${tagline ? `<div class=\"tagline\">${UI.esc(tagline)}</div>` : ''}
                    ${overview ? `<div class=\"overview detail-clamp-text\">${UI.esc(overview)}</div>` : ''}
                    <div class=\"jr-info-panels\">
                        <div class=\"itemDetailsGroup jr-info-panel\">
                            ${genres ? `<div class=\"detailsGroupItem\"><label>Genres</label><span>${UI.esc(genres)}</span></div>` : ''}
                            ${directors ? `<div class=\"detailsGroupItem\"><label>Réalisation</label><span>${UI.esc(directors)}</span></div>` : ''}
                            ${writers ? `<div class=\"detailsGroupItem\"><label>Scénario</label><span>${UI.esc(writers)}</span></div>` : ''}
                            ${studios ? `<div class=\"detailsGroupItem\"><label>Studios</label><span>${UI.esc(studios)}</span></div>` : ''}
                        </div>
                        <div class=\"itemDetailsGroup jr-info-panel\">
                            ${date ? `<div class=\"detailsGroupItem\"><label>${UI.getSvg(CAL_PATH)}Date de sortie</label><span>${UI.esc(_format_date(date))}</span></div>` : ''}
                            ${orig_lang ? `<div class=\"detailsGroupItem\"><label>${UI.getSvg(AUDIO_PATH)}Langue originale</label><span>${UI.esc(orig_lang)}</span></div>` : ''}
                            ${countries ? `<div class=\"detailsGroupItem\"><label>${UI.getSvg(PIN_PATH)}Pays de production</label><span>${UI.esc(countries)}</span></div>` : ''}
                            <div class=\"detailsGroupItem\"><label>${UI.getSvg(TV_PATH)}Actuellement diffusé sur</label><span style=\"display:inline-flex;gap:8px;align-items:center;flex-wrap:wrap\">${flatrate.length ? flatrate.map(p => `<img src=\"https://image.tmdb.org/t/p/original${p.logoPath}\" alt=\"${UI.esc(p.providerName)}\" title=\"${UI.esc(p.providerName)}\" style=\"width:32px;height:32px;border-radius:6px;object-fit:cover\"/>`).join('') : '<em style=\"opacity:0.6\">Aucun service de streaming</em>'}</span></div>
                        </div>
                    </div>
                </div>
                ${castHtml ? `<div class=\"verticalSection detailVerticalSection jr-cast-section\" style=\"margin-top:2em\"><div class=\"jr-cast-header\"><h2 class=\"sectionTitle\">Distribution &amp; équipe</h2><div class=\"jr-cast-nav\"><button type=\"button\" class=\"jr-cast-arrow\" data-dir=\"-1\" aria-label=\"Précédent\">${UI.getSvg('M15 18l-6-6 6-6')}</button><button type=\"button\" class=\"jr-cast-arrow\" data-dir=\"1\" aria-label=\"Suivant\">${UI.getSvg('M9 18l6-6-6-6')}</button></div></div><div class=\"jr-cast-track\" style=\"white-space:nowrap;overflow-x:auto;padding:0.5em 0;scroll-behavior:smooth\">${castHtml}</div></div>` : ''}
            </div>
        </div>`;
    }

    function _bind_detail(panel, route, d, logos) {
        const back = panel.querySelector('.jr-detail-back');
        if (back) back.onclick = () => history.back();
        const btn = panel.querySelector('#jr-btn-request');
        if (btn && !btn.disabled) {
            btn.onclick = async () => {
                if (btn.dataset.busy === '1') return;
                btn.dataset.busy = '1';
                const original_label = btn.querySelector('span')?.textContent;
                if (original_label) btn.querySelector('span').textContent = 'Envoi...';
                btn.disabled = true;
                try {
                    const res = await API.ajax('POST', 'api/MediaRating/SeerrRequest', {
                        tmdbId: d.id,
                        mediaType: route.mediaType,
                        jellyfinUserId: ApiClient.getCurrentUserId()
                    }, 'json');
                    if (res?.success) {
                        if (original_label) btn.querySelector('span').textContent = 'Demandé ✓';
                    } else {
                        alert(res?.message || 'Erreur lors de la demande');
                        if (original_label) btn.querySelector('span').textContent = original_label;
                        btn.disabled = false;
                    }
                } catch (e) {
                    alert('Erreur réseau : ' + e.message);
                    if (original_label) btn.querySelector('span').textContent = original_label;
                    btn.disabled = false;
                } finally {
                    btn.dataset.busy = '0';
                }
            };
        }
        _bind_seerr_rating(panel, d, logos, route.mediaType);
        const track = panel.querySelector('.jr-cast-track');
        panel.querySelectorAll('.jr-cast-arrow').forEach(a => {
            a.onclick = () => { if (track) track.scrollBy({ left: a.dataset.dir * track.clientWidth * 0.8, behavior: 'smooth' }); };
        });
    }

    async function _bind_seerr_rating(panel, d, logos, mediaType) {
        const widget = panel.querySelector('#jr-seerr-widget');
        if (!widget) return;
        const tmdbId = String(d.id);
        const userId = ApiClient.getCurrentUserId();
        const empty_guid = '00000000-0000-0000-0000-000000000000';

        const cur = await API.get(`api/MediaRating/MyRating/${empty_guid}?userId=${userId}&tmdbId=${tmdbId}`).catch(() => null);
        if (cur?.rating != null) _updateTrigger(widget, cur.rating);

        widget.querySelector('.jr-trigger').onclick = (e) => { e.stopPropagation(); widget.classList.toggle('is-open'); };

        widget.querySelectorAll('.opt-btn').forEach(btn => {
            btn.onclick = async () => {
                const val = parseInt(btn.dataset.rating);
                if (btn.classList.contains('is-selected')) {
                    await API.ajax('DELETE', `api/MediaRating/Rating?itemId=${empty_guid}&userId=${userId}&tmdbId=${tmdbId}`);
                    _updateTrigger(widget, null);
                } else {
                    const user = await ApiClient.getCurrentUser();
                    await API.ajax('POST', 'api/MediaRating/Rate', _build_seerr_rate_payload(d, logos, val, user, userId, tmdbId, mediaType));
                    _updateTrigger(widget, val);
                }
                widget.classList.remove('is-open');
            };
        });
    }

    function _build_seerr_rate_payload(d, logos, rating, user, userId, tmdbId, mediaType) {
        const crew = (d.credits && d.credits.crew) || [];
        const cast = ((d.credits && d.credits.cast) || []).slice(0, 20);
        const pick_logo = (lang) => (logos || []).find(l => l.iso_639_1 === lang);
        const logo = pick_logo('fr') || pick_logo(null) || pick_logo('en') || (logos && logos[0]) || null;
        return {
            itemId: '00000000-0000-0000-0000-000000000000',
            userId,
            rating,
            userName: user?.Name ?? 'Unknown',
            itemName: d.title || d.name || 'Unknown',
            synopsis: d.overview ?? null,
            headerSynopsis: d.tagline ?? null,
            genres: (d.genres || []).map(g => g.name),
            studios: (d.productionCompanies || []).map(s => s.name),
            screenwriters: crew.filter(p => p.department === 'Writing').slice(0, 5).map(p => p.name),
            cast: cast.map(p => ({ name: p.name, role: p.character ?? '' })),
            tmdbId,
            mediaType,
            posterUrl: d.posterPath ? `https://image.tmdb.org/t/p/w500${d.posterPath}` : null,
            logoUrl: logo ? `https://image.tmdb.org/t/p/w500${logo.file_path}` : null
        };
    }

    // --- WIDGET ---
    async function injectWidget() {
        if (state.isInjecting) return;
        const itemId = new URLSearchParams(window.location.search).get('id') || (window.location.hash.includes('?') ? new URLSearchParams(window.location.hash.split('?')[1]).get('id') : null);
        if (!itemId) return;
        if (document.getElementById('jr-widget') && state.currentId === itemId) return;
        if (document.getElementById('jr-widget')) document.getElementById('jr-widget').remove();
        const trailerBtn = document.querySelector(CONFIG.SELECTORS.TRAILER_BTN);
        if (!trailerBtn) return;
        state.isInjecting = true; state.currentId = itemId;
        trailerBtn.style.display = 'none';
        const widget = document.createElement('div');
        widget.className = 'rating-wrapper'; widget.id = 'jr-widget';
        widget.innerHTML = _widget_inner_html();
        trailerBtn.parentElement.insertBefore(widget, trailerBtn);
        const userId = ApiClient.getCurrentUserId();
        const providerInfo = await API.get(`Users/${userId}/Items/${itemId}?Fields=ProviderIds`).catch(() => null);
        const tmdbId = providerInfo?.ProviderIds?.Tmdb ?? '';
        const data = await API.get(`api/MediaRating/MyRating/${itemId}?userId=${userId}&tmdbId=${tmdbId}`);
        if (data?.rating != null) _updateTrigger(widget, data.rating);
        widget.querySelector('.jr-trigger').onclick = (e) => { e.stopPropagation(); widget.classList.toggle('is-open'); };
        widget.querySelectorAll('.opt-btn').forEach(btn => {
            btn.onclick = async () => {
                const val = parseInt(btn.dataset.rating);
                if (btn.classList.contains('is-selected')) { await API.ajax('DELETE', `api/MediaRating/Rating?itemId=${itemId}&userId=${ApiClient.getCurrentUserId()}`); _updateTrigger(widget, null); }
                else {
                    const userId = ApiClient.getCurrentUserId();
                    const user = await ApiClient.getCurrentUser();
                    const item = await API.get(`Users/${userId}/Items/${itemId}?Fields=People,Genres,Studios,Overview,Taglines,ProviderIds`);
                    const people = item.People || [];
                    const [posterUrl, logoUrl] = await Promise.all([
                        _fetchRemoteImageUrl(itemId, 'Primary'),
                        _fetchRemoteImageUrl(itemId, 'Logo')
                    ]);
                    await API.ajax('POST', 'api/MediaRating/Rate', {
                        itemId,
                        userId,
                        rating: val,
                        userName: user?.Name ?? 'Unknown',
                        itemName: item.Name ?? 'Unknown',
                        synopsis: item.Overview ?? null,
                        headerSynopsis: (item.Taglines && item.Taglines[0]) ?? null,
                        genres: item.Genres ?? [],
                        studios: (item.Studios ?? []).map(s => s.Name),
                        screenwriters: people.filter(p => p.Type === 'Writer').map(p => p.Name),
                        cast: people.filter(p => p.Type === 'Actor').map(p => ({ name: p.Name, role: p.Role ?? '' })),
                        tmdbId: item.ProviderIds?.Tmdb ?? null,
                        posterUrl,
                        logoUrl
                    });
                    _updateTrigger(widget, val);
                }
                widget.classList.remove('is-open');
            };
        });
        state.isInjecting = false;
    }

    async function _fetchRemoteImageUrl(itemId, type) {
        try {
            const data = await API.get(`Items/${itemId}/RemoteImages?providerName=TheMovieDb&type=${type}&limit=1`);
            return data?.Images?.[0]?.Url ?? null;
        } catch { return null; }
    }

    function _updateTrigger(widget, rating) {
        const trigger = widget.querySelector('.jr-trigger');
        trigger.innerHTML = UI.getSvg(THUMB_PATH);
        trigger.classList.toggle('is-active', rating !== null);
        trigger.setAttribute('data-rating', rating || '');
        widget.querySelectorAll('.opt-btn').forEach(b => b.classList.toggle('is-selected', parseInt(b.dataset.rating) === rating));
    }

    new MutationObserver(() => {
        const isHome = window.location.hash.includes('/home') || window.location.hash === '#' || window.location.hash === '';
        if (!isHome) document.body.classList.remove('jr-tab-active');
        else if (sessionStorage.getItem('jr-last-tab') === 'ratings') document.body.classList.add('jr-tab-active');
        injectTab(); injectWidget();
    }).observe(document.body, { subtree: true, childList: true });

    window.addEventListener('hashchange', _handle_detail_route);

    // Refresh = retour home : on vide la persistance de tab uniquement au chargement
    // initial du script (le script ne re-tourne pas sur navigation SPA interne).
    sessionStorage.removeItem('jr-last-tab');
    injectTab(); injectWidget(); _handle_detail_route();
})();
