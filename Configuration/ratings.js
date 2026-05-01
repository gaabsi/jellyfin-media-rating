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
    const CAL_PATH  = `M3 7a3 3 0 013-3h12a3 3 0 013 3v11a3 3 0 01-3 3H6a3 3 0 01-3-3V7z M3 9h18 M8 2v4 M16 2v4 M7 12h2v2H7v-2z M11 12h2v2h-2v-2z M15 12h2v2h-2v-2z M7 16h2v2H7v-2z M11 16h2v2h-2v-2z M15 17.5l1.5 1.5 3-3`;
    const AUDIO_PATH = `M3 9v6h4l5 5V4L7 9H3z M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z`;
    const PIN_PATH  = `M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z`;
    const TV_PATH   = `M21 3H3a2 2 0 00-2 2v12a2 2 0 002 2h5v2h8v-2h5a2 2 0 002-2V5a2 2 0 00-2-2zm0 14H3V5h18v12z`;

    // Encodage URI pour le tab (basé sur CONFIG.STWIDTH)
    const SEARCH_HEART_SVG_URI = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='black'%3E%3Cpath d='M6.5 4.482c1.664-1.673 5.825 1.254 0 5.018-5.825-3.764-1.664-6.69 0-5.018'/%3E%3Cpath d='M13 6.5a6.47 6.47 0 0 1-1.258 3.844q.06.044.115.098l3.85 3.85a1 1 0 0 1-1.414 1.415l-3.85-3.85a1 1 0 0 1-.1-.115h.002A6.5 6.5 0 1 1 13 6.5M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11'/%3E%3C/svg%3E")`;
    const CAL_DATE_SVG_URI = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='black'%3E%3Cpath d='M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0'/%3E%3Cpath d='M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z'/%3E%3C/svg%3E")`;

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
        body.jr-search-active #jr-section-tonote, body.jr-search-active #jr-section-rated { display: none !important; }
        .jr-search-status { padding: 1em; opacity: 0.7; flex-basis: 100%; }
        @media (max-width: 720px) {
            body.jr-tab-active #jr-tab-panel,
            body.jr-monitoring-active #jr-monitoring-panel { padding-top: 5em; }
        }
        @media (min-width: 721px) and (max-width: 1366px) {
            body.jr-tab-active #jr-tab-panel,
            body.jr-monitoring-active #jr-monitoring-panel { padding-top: 3em; }
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
        body.jr-detail-active #slides-container,
        body.jr-detail-active .pageContainer > .page:not(#jr-seerr-detail-page) { display: none !important; }
        .jr-detail-status { padding: 4em 1em; text-align: center; opacity: 0.7; }
        #jr-seerr-detail-page .jr-btn-row { margin-top: 1em; display: flex; justify-content: center; align-items: center; gap: 0.8em; }
        #jr-seerr-detail-page .jr-btn-row .rating-wrapper { margin-right: 0; }
        #jr-seerr-detail-page .jr-btn-request { display: inline-flex; align-items: center; gap: 0.4em; padding: 0.4rem 0.9rem; border-radius: 0.375rem; border: 1px solid; font-family: inherit; font-size: 0.875rem; font-weight: 500; line-height: 1.25rem; color: #fff; cursor: pointer; transition: background-color 150ms ease-in-out, border-color 150ms ease-in-out; }
        #jr-seerr-detail-page .jr-btn-request:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.4); }
        #jr-seerr-detail-page .jr-btn-icon { width: 1em; height: 1em; display: inline-flex; }
        #jr-seerr-detail-page .jr-btn-icon svg { width: 100%; height: 100%; display: block; }
        #jr-seerr-detail-page .jr-btn-variant-demander { background: rgba(79,70,229,0.8); border-color: #6366f1; }
        #jr-seerr-detail-page .jr-btn-variant-demander:hover { background: #4f46e5; border-color: #6366f1; }
        #jr-seerr-detail-page .jr-btn-variant-demander:active { background: #4338ca; border-color: #4338ca; }
        #jr-seerr-detail-page .jr-btn-variant-wait { background: rgba(234,88,12,0.8); border-color: #f97316; cursor: not-allowed; }
        .jr-btn-bell { color: var(--text-primary); cursor: pointer; border: none; background: transparent; width: 44px; height: 44px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: background-color 0.2s, color 0.2s; outline: none; padding: 0; vertical-align: middle; }
        .jr-btn-bell:hover { background-color: rgba(255,255,255,0.15); }
        .jr-btn-bell.is-monitored { color: #22c55e; }
        .jr-btn-bell svg { width: 24px; height: 24px; display: block; }

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

        @media (max-width: 800px) {
            #jr-seerr-detail-page .jr-hero { min-height: 40vh; padding: 6em 1em 1em; gap: 0.8em; }
            #jr-seerr-detail-page .jr-hero-logo { width: 70%; max-height: 140px; }
            #jr-seerr-detail-page h1.itemName { font-size: 1.6em; }
            #jr-seerr-detail-page .detailPagePrimaryContent { padding: 0.5em 1em 1.5em !important; }
            #jr-seerr-detail-page .jr-cast-card { width: 100px; margin-right: 0.8em; }
            #jr-seerr-detail-page .jr-cast-avatar { width: 100px; height: 100px; }
            #jr-seerr-detail-page .jr-cast-name { font-size: 0.85em; }
            #jr-seerr-detail-page .jr-cast-role { font-size: 0.75em; }
            #jr-seerr-detail-page .jr-info-panel { flex: 1 1 100%; }
        }

        #jr-tab-btn .emby-button-foreground::before {
            content: ''; display: inline-block; width: 1.25em; height: 1.25em; background-color: currentColor;
            -webkit-mask-image: ${SEARCH_HEART_SVG_URI}; mask-image: ${SEARCH_HEART_SVG_URI};
            -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
            margin-right: 0.5em; vertical-align: middle;
        }
        #jr-monitoring-tab-btn .emby-button-foreground::before {
            content: ''; display: inline-block; width: 1.25em; height: 1.25em; background-color: currentColor;
            -webkit-mask-image: ${CAL_DATE_SVG_URI}; mask-image: ${CAL_DATE_SVG_URI};
            -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
            margin-right: 0.5em; vertical-align: middle;
        }
        #jr-monitoring-panel { width: 100%; display: none; }
        body.jr-monitoring-active #jr-monitoring-panel { display: block !important; position: relative; z-index: 100; }
        body.jr-monitoring-active .tab-panel-container > div:not(#jr-monitoring-panel),
        body.jr-monitoring-active .pageContainer > div:not(#jr-monitoring-panel),
        body.jr-monitoring-active .sections,
        body.jr-monitoring-active #slides-container { display: none !important; }
        .jr-cal-header { display: flex; align-items: center; justify-content: space-between; padding: 2em 1.5em 1em; gap: 1em; }
        .jr-cal-title { font-size: 1.6em; font-weight: 500; margin: 0; }
        .jr-cal-nav { display: inline-flex; align-items: center; gap: 0.5em; }
        .jr-cal-nav-btn { background: transparent; border: none; color: var(--text-primary); cursor: pointer; width: 38px; height: 38px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; transition: background-color 0.2s; }
        .jr-cal-nav-btn:hover { background-color: rgba(255,255,255,0.15); }
        .jr-cal-range { font-size: 1em; opacity: 0.85; min-width: 14em; text-align: center; }
        .jr-cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; padding: 0 1.5em 2em; }
        .jr-cal-dow { text-align: center; font-size: 0.85em; opacity: 0.6; padding: 0.5em 0; text-transform: uppercase; letter-spacing: 0.05em; }
        .jr-cal-cell { background-color: rgba(255,255,255,0.04); border-radius: 8px; min-height: 110px; padding: 6px 8px; display: flex; flex-direction: column; gap: 4px; transition: background-color 0.2s; }
        .jr-cal-cell.is-past { opacity: 0.45; }
        .jr-cal-cell.is-today { background-color: rgba(34,197,94,0.18); outline: 1px solid rgba(34,197,94,0.6); }
        .jr-cal-day-num { font-size: 0.95em; font-weight: 500; opacity: 0.85; }
        .jr-cal-day-num .jr-cal-month { font-size: 0.75em; opacity: 0.6; margin-left: 4px; text-transform: uppercase; }
        .jr-cal-release { font-size: 0.8em; line-height: 1.25; padding: 3px 6px 3px 8px; background-color: rgba(255,255,255,0.08); border-radius: 4px; border-left: 3px solid var(--release-color, transparent); cursor: pointer; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .jr-cal-release:hover { background-color: rgba(255,255,255,0.18); }
        .jr-cal-release.movie { --release-color: #a855f7; }
        .jr-cal-release.series { --release-color: #3b82f6; }
        .jr-cal-empty { padding: 3em; text-align: center; opacity: 0.6; }
        @media (max-width: 720px) {
            .jr-cal-header { flex-direction: column; align-items: flex-start; gap: 0.75em; padding: 1.25em 1em 0.75em; }
            .jr-cal-title { font-size: 1.3em; }
            .jr-cal-nav { width: 100%; justify-content: space-between; }
            .jr-cal-range { min-width: 0; flex: 1; font-size: 0.95em; }
            .jr-cal-grid-4x4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 0 0.75em 0.5em; }
            .jr-cal-cell-4x4 { background-color: rgba(255,255,255,0.04); border-radius: 6px; padding: 5px 5px 6px; display: flex; flex-direction: column; gap: 3px; min-height: 95px; cursor: pointer; transition: background-color 0.15s; }
            .jr-cal-cell-4x4.is-today { background-color: rgba(34,197,94,0.18); outline: 1px solid rgba(34,197,94,0.6); }
            .jr-cal-cell-4x4.is-past { opacity: 0.5; }
            .jr-cal-cell-4x4.is-selected { background-color: rgba(255,255,255,0.16); outline: 1px solid rgba(255,255,255,0.4); }
            .jr-cal-cell-4x4.is-empty { cursor: default; }
            .jr-cal-cell-head { font-size: 0.75em; font-weight: 500; opacity: 0.75; padding-bottom: 2px; }
            .jr-cal-cell-release { font-size: 0.7em; line-height: 1.2; padding: 2px 4px 2px 5px; background-color: rgba(255,255,255,0.08); border-radius: 3px; border-left: 3px solid var(--release-color, transparent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
            .jr-cal-cell-release:hover, .jr-cal-cell-release:active { background-color: rgba(255,255,255,0.18); }
            .jr-cal-cell-release.movie { --release-color: #a855f7; }
            .jr-cal-cell-release.series { --release-color: #3b82f6; }
            .jr-cal-cell-more { font-size: 0.65em; opacity: 0.7; padding: 2px 4px; background-color: rgba(255,255,255,0.05); border-radius: 3px; text-align: center; cursor: pointer; }
            .jr-cal-expand-mobile { padding: 0.5em 1em 1.5em; }
            .jr-cal-expand-mobile:empty { padding: 0; }
            .jr-cal-expand-head { font-size: 0.95em; font-weight: 500; opacity: 0.85; margin-bottom: 0.6em; padding: 0 0.25em; }
            .jr-cal-expand-row { display: block; padding: 0.55em 0.75em 0.55em 0.85em; background-color: rgba(255,255,255,0.06); border-radius: 6px; border-left: 3px solid var(--release-color, transparent); margin-bottom: 0.4em; cursor: pointer; font-size: 0.95em; }
            .jr-cal-expand-row:hover, .jr-cal-expand-row:active { background-color: rgba(255,255,255,0.14); }
            .jr-cal-expand-row.movie { --release-color: #a855f7; }
            .jr-cal-expand-row.series { --release-color: #3b82f6; }
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
        const btn = document.getElementById('jr-tab-btn');
        if (btn) btn.classList.remove('emby-tab-button-active');
    }

    function exitMonitoringMode() {
        document.body.classList.remove('jr-monitoring-active');
        const btn = document.getElementById('jr-monitoring-tab-btn');
        if (btn) btn.classList.remove('emby-tab-button-active');
    }

    function _syncTabHighlight(activeId) {
        const slider = document.querySelector(CONFIG.SELECTORS.TABS_SLIDER);
        if (!slider) return;
        slider.querySelectorAll('.emby-tab-button').forEach(b => b.classList.remove('emby-tab-button-active'));
        const btn = document.getElementById(activeId);
        if (btn) btn.classList.add('emby-tab-button-active');
    }

    function enterRatingsMode() {
        exitMonitoringMode();
        _syncTabHighlight('jr-tab-btn');
        document.body.classList.add('jr-tab-active');
        sessionStorage.setItem('jr-last-tab', 'ratings');
        loadCards();
    }

    function enterMonitoringMode() {
        exitRatingsMode();
        _syncTabHighlight('jr-monitoring-tab-btn');
        document.body.classList.add('jr-monitoring-active');
        sessionStorage.setItem('jr-last-tab', 'monitoring');
        loadMonitoring();
    }

    const DOW_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const MONTH_LABELS = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'];
    const SVG_CHEVRON_LEFT = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/></svg>';
    const SVG_CHEVRON_RIGHT = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/></svg>';

    let _cal_offset_days = 0;
    let _cal_selected_iso = null;
    let _cal_resize_bound = false;
    let _cal_resize_timer = null;

    function _is_mobile_view() {
        return window.matchMedia('(max-width: 720px)').matches;
    }

    function _bind_calendar_resize() {
        if (_cal_resize_bound) return;
        _cal_resize_bound = true;
        window.addEventListener('resize', () => {
            clearTimeout(_cal_resize_timer);
            _cal_resize_timer = setTimeout(() => {
                if (document.body.classList.contains('jr-monitoring-active')) _render_calendar_body();
            }, 200);
        });
    }

    async function loadMonitoring() {
        const container = document.getElementById('jr-monitoring-panel');
        if (!container) return;
        _cal_offset_days = 0;
        container.innerHTML = `
            <div class="jr-cal-header">
                <h2 class="jr-cal-title">Calendrier des sorties</h2>
                <div class="jr-cal-nav">
                    <button type="button" class="jr-cal-nav-btn" id="jr-cal-prev" aria-label="2 semaines précédentes" title="2 semaines précédentes">${SVG_CHEVRON_LEFT}</button>
                    <span class="jr-cal-range" id="jr-cal-range"></span>
                    <button type="button" class="jr-cal-nav-btn" id="jr-cal-next" aria-label="2 semaines suivantes" title="2 semaines suivantes">${SVG_CHEVRON_RIGHT}</button>
                </div>
            </div>
            <div id="jr-cal-body"></div>
        `;
        document.getElementById('jr-cal-prev').onclick = () => { _cal_offset_days -= 14; _cal_selected_iso = null; _render_calendar_body(); };
        document.getElementById('jr-cal-next').onclick = () => { _cal_offset_days += 14; _cal_selected_iso = null; _render_calendar_body(); };
        _bind_calendar_resize();
        await _render_calendar_body();
    }

    function _format_range(days) {
        const first = days[0];
        const last = days[days.length - 1];
        const same_year = first.getFullYear() === last.getFullYear();
        const fmt = (d, with_year) => `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}${with_year ? ' ' + d.getFullYear() : ''}`;
        return `${fmt(first, !same_year)} – ${fmt(last, true)}`;
    }

    async function _render_calendar_body() {
        const body = document.getElementById('jr-cal-body');
        if (!body) return;
        try {
            const userId = ApiClient.getCurrentUserId();
            const res = await API.get(`api/MediaRating/Monitoring?userId=${encodeURIComponent(userId)}`);
            const monitorings = res?.data || [];
            const anchor = new Date();
            anchor.setDate(anchor.getDate() + _cal_offset_days);
            const items = _flatten_releases(monitorings);
            const by_day = _group_by_day(items);
            const mobile = _is_mobile_view();
            const days = mobile ? _compute_calendar_days_mobile(anchor) : _compute_calendar_days(anchor);
            body.innerHTML = mobile ? _build_calendar_mobile_html(days, by_day) : _build_calendar_html(days, by_day);
            if (mobile) _render_mobile_expand(by_day);
            _bind_calendar_clicks(body, by_day, mobile);
            const range_el = document.getElementById('jr-cal-range');
            if (range_el) range_el.textContent = _format_range(days);
        } catch (e) {
            body.innerHTML = `<div class="jr-cal-empty">Erreur de chargement : ${UI.esc(e.message)}</div>`;
        }
    }

    function _build_calendar_html(days, by_day) {
        const today_iso = _iso_day(new Date());
        const dow_html = DOW_LABELS.map(d => `<div class="jr-cal-dow">${d}</div>`).join('');
        const cells_html = days.map(d => {
            const iso = _iso_day(d);
            const releases = by_day.get(iso) || [];
            const is_today = iso === today_iso;
            const is_past = iso < today_iso;
            const cls = ['jr-cal-cell', is_today ? 'is-today' : '', is_past ? 'is-past' : ''].filter(Boolean).join(' ');
            const day_num = d.getDate();
            const month_label = day_num === 1 ? `<span class="jr-cal-month">${MONTH_LABELS[d.getMonth()]}</span>` : '';
            const releases_html = releases.map(r =>
                `<div class="jr-cal-release ${r.mediaType === 'series' ? 'series' : 'movie'}" data-tmdb-id="${UI.esc(r.tmdbId)}" data-media-type="${r.mediaType}" title="${UI.esc(r.label)}">${UI.esc(r.label)}</div>`
            ).join('');
            return `<div class="${cls}"><div class="jr-cal-day-num">${day_num}${month_label}</div>${releases_html}</div>`;
        }).join('');
        return `<div class="jr-cal-grid">${dow_html}${cells_html}</div>`;
    }

    function _build_calendar_mobile_html(days, by_day) {
        const today_iso = _iso_day(new Date());
        const MAX_INLINE = 2;
        const cells_html = days.map(d => {
            const iso = _iso_day(d);
            const releases = by_day.get(iso) || [];
            const is_today = iso === today_iso;
            const is_past = iso < today_iso;
            const is_empty = releases.length === 0;
            const is_selected = iso === _cal_selected_iso;
            const cls = ['jr-cal-cell-4x4',
                is_today ? 'is-today' : '',
                is_past ? 'is-past' : '',
                is_empty ? 'is-empty' : '',
                is_selected ? 'is-selected' : ''].filter(Boolean).join(' ');
            const head = `${DOW_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()}`;
            const shown = releases.slice(0, MAX_INLINE);
            const overflow = releases.length - shown.length;
            const rows = shown.map(r =>
                `<div class="jr-cal-cell-release ${r.mediaType === 'series' ? 'series' : 'movie'}" data-tmdb-id="${UI.esc(r.tmdbId)}" data-media-type="${r.mediaType}" title="${UI.esc(r.label)}">${UI.esc(r.label)}</div>`
            ).join('');
            const more = overflow > 0
                ? `<div class="jr-cal-cell-more">+${overflow} autre${overflow > 1 ? 's' : ''}</div>`
                : '';
            return `<div class="${cls}" data-iso="${iso}"><div class="jr-cal-cell-head">${head}</div>${rows}${more}</div>`;
        }).join('');
        return `<div class="jr-cal-grid-4x4">${cells_html}</div><div id="jr-cal-expand-mobile" class="jr-cal-expand-mobile"></div>`;
    }

    function _render_mobile_expand(by_day) {
        const panel = document.getElementById('jr-cal-expand-mobile');
        if (!panel) return;
        document.querySelectorAll('.jr-cal-cell-4x4').forEach(c => {
            c.classList.toggle('is-selected', c.dataset.iso === _cal_selected_iso);
        });
        if (!_cal_selected_iso) { panel.innerHTML = ''; return; }
        const releases = by_day.get(_cal_selected_iso) || [];
        if (!releases.length) { panel.innerHTML = ''; return; }
        const [y, m, d] = _cal_selected_iso.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const head = `${DOW_LABELS[(date.getDay() + 6) % 7]} ${d} ${MONTH_LABELS[m - 1]}`;
        const rows = releases.map(r =>
            `<div class="jr-cal-expand-row ${r.mediaType === 'series' ? 'series' : 'movie'}" data-tmdb-id="${UI.esc(r.tmdbId)}" data-media-type="${r.mediaType}">${UI.esc(r.label)}</div>`
        ).join('');
        panel.innerHTML = `<div class="jr-cal-expand-head">${head}</div>${rows}`;
    }

    function _bind_calendar_clicks(body, by_day, mobile) {
        const nav_to = (el) => {
            const tmdbId = el.dataset.tmdbId;
            const mediaType = el.dataset.mediaType === 'series' ? 'tv' : 'movie';
            window.location.hash = `#!/jr-seerr-detail?id=${tmdbId}&type=${mediaType}`;
        };
        body.querySelectorAll('.jr-cal-release').forEach(el => { el.onclick = () => nav_to(el); });
        if (!mobile) return;
        body.querySelectorAll('.jr-cal-cell-release').forEach(el => {
            el.onclick = (e) => { e.stopPropagation(); nav_to(el); };
        });
        body.querySelectorAll('.jr-cal-cell-4x4').forEach(cell => {
            if (cell.classList.contains('is-empty')) return;
            cell.onclick = () => {
                const iso = cell.dataset.iso;
                _cal_selected_iso = (_cal_selected_iso === iso) ? null : iso;
                _render_mobile_expand(by_day);
                _bind_expand_clicks(by_day);
            };
        });
        _bind_expand_clicks(by_day);
    }

    function _bind_expand_clicks(by_day) {
        const panel = document.getElementById('jr-cal-expand-mobile');
        if (!panel) return;
        panel.querySelectorAll('.jr-cal-expand-row').forEach(el => {
            el.onclick = () => {
                const tmdbId = el.dataset.tmdbId;
                const mediaType = el.dataset.mediaType === 'series' ? 'tv' : 'movie';
                window.location.hash = `#!/jr-seerr-detail?id=${tmdbId}&type=${mediaType}`;
            };
        });
    }


    function _hide_native_favorites_tab() {
        document.querySelectorAll('.emby-tab-button').forEach(btn => {
            const label = (btn.textContent || '').trim().toLowerCase();
            if (label === 'favoris' || label === 'favorites') {
                btn.style.display = 'none';
            }
        });
    }

    function _is_home_route() {
        const h = window.location.hash;
        return h.includes('/home') || h === '#' || h === '';
    }

    function injectTab() {
        if (!_is_home_route()) return;
        const slider = document.querySelector(CONFIG.SELECTORS.TABS_SLIDER);
        if (!slider) return;
        _hide_native_favorites_tab();
        if (document.getElementById('jr-tab-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button'; btn.id = 'jr-tab-btn'; btn.setAttribute('is', 'emby-button');
        btn.className = 'emby-tab-button emby-button';
        btn.innerHTML = `<div class=\"emby-button-foreground\">Explorer</div>`;
        slider.appendChild(btn);
        const mbtn = document.createElement('button');
        mbtn.type = 'button'; mbtn.id = 'jr-monitoring-tab-btn'; mbtn.setAttribute('is', 'emby-button');
        mbtn.className = 'emby-tab-button emby-button';
        mbtn.innerHTML = `<div class=\"emby-button-foreground\">Suivis</div>`;
        slider.appendChild(mbtn);
        const container = document.querySelector(CONFIG.SELECTORS.TAB_CONTAINER) || document.querySelector(CONFIG.SELECTORS.PAGE_CONTAINER) || document.body;
        let panel = document.getElementById('jr-tab-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'jr-tab-panel'; panel.className = 'tabContent';
            panel.innerHTML = `<div class=\"padded-left padded-right padded-bottom\"><div class=\"jr-search\"><input type=\"search\" id=\"jr-search-input\" placeholder=\"Rechercher un film ou une série...\" autocomplete=\"off\" /></div><div class=\"verticalSection\" id=\"jr-section-tonote\" style=\"display:none\"><h2 class=\"sectionTitle\">À noter</h2><div class=\"itemsContainer vertical-wrap\" id=\"jr-tonote-container\"></div></div><div class=\"verticalSection\" id=\"jr-section-rated\"><h2 class=\"sectionTitle\">Mes notes</h2><div class=\"itemsContainer vertical-wrap\" id=\"jr-cards-container\"></div></div><div class=\"itemsContainer vertical-wrap\" id=\"jr-search-results\"></div></div>`;
            _bind_search(panel);
            container.appendChild(panel);
        }
        if (!document.getElementById('jr-monitoring-panel')) {
            const mp = document.createElement('div');
            mp.id = 'jr-monitoring-panel'; mp.className = 'tabContent';
            container.appendChild(mp);
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
            else if (clicked.id === 'jr-monitoring-tab-btn') { e.preventDefault(); e.stopPropagation(); enterMonitoringMode(); }
            else { exitRatingsMode(); exitMonitoringMode(); sessionStorage.removeItem('jr-last-tab'); }
        }, true);
        const last = sessionStorage.getItem('jr-last-tab');
        if (last === 'ratings') enterRatingsMode();
        else if (last === 'monitoring') enterMonitoringMode();
    }

    async function loadCards() {
        const container = document.getElementById('jr-cards-container');
        const tonoteSection = document.getElementById('jr-section-tonote');
        const tonoteContainer = document.getElementById('jr-tonote-container');
        if (!container) return;
        container.innerHTML = '<p style=\"padding:1em\">Chargement...</p>';
        if (tonoteSection) tonoteSection.style.display = 'none';
        try {
            const userId = ApiClient.getCurrentUserId();
            const [data, playedMovies, playedSeries] = await Promise.all([
                API.get(`api/MediaRating/User/${userId}`),
                API.get(`Users/${userId}/Items?Filters=IsPlayed&IncludeItemTypes=Movie&Recursive=true&Fields=ImageTags,ProductionYear&Limit=500`),
                API.get(`Users/${userId}/Items?Filters=IsPlayed&IncludeItemTypes=Series&Recursive=true&Fields=ImageTags,ProductionYear&Limit=500`)
            ]);
            const ratings = (data.success && data.ratings) ? data.ratings : [];
            const ratedIds = new Set(ratings.map(r => r.item_id.replace(/-/g, '')));
            const playedItems = [...(playedMovies.Items || []), ...(playedSeries.Items || [])];
            const tonote = playedItems.filter(it => !ratedIds.has(it.Id));

            if (tonoteSection && tonoteContainer) {
                if (tonote.length) {
                    tonoteContainer.innerHTML = tonote.map(_build_tonote_card_html).join('');
                    tonoteSection.style.display = '';
                } else {
                    tonoteContainer.innerHTML = '';
                    tonoteSection.style.display = 'none';
                }
            }

            if (!ratings.length) { container.innerHTML = '<p style=\"padding:1em\">Aucun vote.</p>'; return; }
            const ids = ratings.map(r => r.item_id.replace(/-/g, '')).join(',');
            const items = await API.get(`Users/${userId}/Items?Ids=${ids}&Fields=PrimaryImageAspectRatio,ImageTags,ProductionYear`);
            const itemMap = {}; (items.Items || []).forEach(it => { itemMap[it.Id] = it; });
            container.innerHTML = ratings.map(r => _build_card_html(r, itemMap)).join('');
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

    function _build_tonote_card_html(item) {
        const id = item.Id;
        const name = item.Name ?? '';
        const year = item.ProductionYear ?? '';
        const detailUrl = `#/details?id=${id}&serverId=${ApiClient.serverId()}`;
        const imgSrc = item.ImageTags?.Primary ? ApiClient.getUrl(`Items/${id}/Images/Primary?fillHeight=456&fillWidth=304&quality=96&tag=${item.ImageTags.Primary}`) : '';
        return `<div class=\"card portraitCard card-hoverable card-withuserdata\" data-id=\"${id}\"><div class=\"cardBox cardBox-bottompadded\"><div class=\"cardScalable\"><div class=\"cardPadder cardPadder-overflowPortrait\"></div><a href=\"${detailUrl}\" class=\"cardImageContainer coveredImage cardContent itemAction lazy\"><img src=\"${imgSrc}\" style=\"width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0\" alt=\"${UI.esc(name)}\"/></a></div><div class=\"cardText cardTextCentered cardText-first\"><bdi><a href=\"${detailUrl}\" class=\"itemAction textActionButton\">${UI.esc(name)}</a></bdi></div><div class=\"cardText cardTextCentered cardText-secondary\"><bdi>${year}</bdi></div></div></div>`;
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
    const SVG_BELL = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/></svg>';

    // Cache mémoire des tmdb_id monitorés par l'user courant. Lazy-loadé.
    const _monitored = { movie: null, series: null };

    async function _ensure_monitored_set() {
        if (_monitored.movie && _monitored.series) return;
        try {
            const userId = ApiClient.getCurrentUserId();
            const res = await API.get(`api/MediaRating/Monitoring?userId=${encodeURIComponent(userId)}`);
            _monitored.movie = new Set();
            _monitored.series = new Set();
            (res?.data || []).forEach(m => {
                const set = m.mediaType === 'series' ? _monitored.series : _monitored.movie;
                set._idByTmdb = set._idByTmdb || {};
                const _add = (id) => {
                    if (!id) return;
                    set.add(String(id));
                    set._idByTmdb[String(id)] = m.id;
                };
                _add(m.tmdbId);
                (m.released || []).forEach(r => _add(r.tmdbId));
                (m.upcoming || []).forEach(r => _add(r.tmdbId));
            });
        } catch (e) {
            _monitored.movie = new Set();
            _monitored.series = new Set();
        }
    }

    function _invalidate_monitored_cache() {
        _monitored.movie = null;
        _monitored.series = null;
    }

    function _is_monitored(tmdbId, mediaType) {
        const set = mediaType === 'series' ? _monitored.series : _monitored.movie;
        return set && set.has(String(tmdbId));
    }

    function _monitoring_id_of(tmdbId, mediaType) {
        const set = mediaType === 'series' ? _monitored.series : _monitored.movie;
        return set?._idByTmdb?.[String(tmdbId)] || null;
    }

    function _iso_day(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function _compute_calendar_days(today) {
        // Lundi de la semaine courante : recule du nombre de jours depuis lundi (0..6).
        const monday_curr = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const offset = (monday_curr.getDay() + 6) % 7;
        monday_curr.setDate(monday_curr.getDate() - offset);
        // Démarrage = lundi semaine N-1.
        const start = new Date(monday_curr);
        start.setDate(start.getDate() - 7);
        return Array.from({ length: 28 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    }

    function _compute_calendar_days_mobile(today) {
        // Mobile 4x4 : 16 jours du lundi de la semaine courante (N) → +15j (= 2 semaines + Lun/Mar de la 3ème).
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const offset = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - offset);
        return Array.from({ length: 16 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    }

    function _flatten_releases(monitorings) {
        // Films : 1 entrée par release (titre = release.title, tmdbId = release.tmdbId).
        // Séries : agrégées par (monitoring.id, date) → 1 entrée par jour quelque soit le nb d'épisodes.
        const out = [];
        const series_seen = new Set();
        (monitorings || []).forEach(m => {
            const all_releases = [...(m.released || []), ...(m.upcoming || [])];
            all_releases.forEach(r => {
                if (!r.releaseDate) return;
                if (m.mediaType === 'series') {
                    const key = `${m.id}|${r.releaseDate}`;
                    if (series_seen.has(key)) return;
                    series_seen.add(key);
                    out.push({ date: r.releaseDate, label: m.label, tmdbId: m.tmdbId, mediaType: 'series' });
                } else {
                    out.push({ date: r.releaseDate, label: r.title, tmdbId: r.tmdbId, mediaType: 'movie' });
                }
            });
        });
        return out;
    }

    function _group_by_day(items) {
        const map = new Map();
        items.forEach(it => {
            if (!map.has(it.date)) map.set(it.date, []);
            map.get(it.date).push(it);
        });
        return map;
    }

    function _request_button_config(status) {
        if (status === 5) return null;
        if (status === 2 || status === 3 || status === 4) {
            return { label: 'En attente', svg: SVG_HOURGLASS, variant: 'wait', disabled: true };
        }
        return { label: 'Demander', svg: SVG_REQUEST, variant: 'demander', disabled: false };
    }

    function _apply_btn_config(btn, cfg) {
        if (!btn || !cfg) return;
        const label = btn.querySelector('.jr-btn-label');
        const icon = btn.querySelector('.jr-btn-icon');
        if (label) label.textContent = cfg.label;
        if (icon) icon.innerHTML = cfg.svg;
        btn.className = `jr-btn-request jr-btn-variant-${cfg.variant}`;
        btn.disabled = !!cfg.disabled;
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
        ${backdrop ? `<div class=\"jr-backdrop-fixed\" style=\"background-image:url('${backdrop}')\"></div>` : ''}
        <div class=\"detailPageWrapperContainer padded-bottom-page\">
            <div class=\"jr-hero\">
                ${logo_url
                    ? `<img class=\"jr-hero-logo\" src=\"${logo_url}\" alt=\"${UI.esc(title)}\"/>`
                    : `<h1 class=\"itemName infoText parentNameLast\" style=\"margin:0;font-size:2.4em;font-weight:400\">${UI.esc(title)}</h1>`}
                <div class=\"jr-btn-row\">
                    <div class=\"rating-wrapper\" id=\"jr-seerr-widget\">${_widget_inner_html()}</div>
                    <button type=\"button\" class=\"jr-btn-bell\" id=\"jr-btn-bell\" aria-label=\"Suivre les sorties\" title=\"Suivre les sorties\">${SVG_BELL}</button>
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
        const btn = panel.querySelector('#jr-btn-request');
        if (btn && !btn.disabled) {
            btn.onclick = async () => {
                if (btn.dataset.busy === '1') return;
                btn.dataset.busy = '1';
                const labelEl = btn.querySelector('.jr-btn-label');
                if (labelEl) labelEl.textContent = 'Envoi...';
                btn.disabled = true;
                try {
                    const res = await API.ajax('POST', 'api/MediaRating/SeerrRequest', {
                        tmdbId: d.id,
                        mediaType: route.mediaType,
                        jellyfinUserId: ApiClient.getCurrentUserId()
                    }, 'json');
                    if (res?.success) {
                        _apply_btn_config(btn, _request_button_config(2));
                    } else {
                        alert(res?.message || 'Erreur lors de la demande');
                        _apply_btn_config(btn, _request_button_config(1));
                    }
                } catch (e) {
                    alert('Erreur réseau : ' + e.message);
                    _apply_btn_config(btn, _request_button_config(1));
                } finally {
                    btn.dataset.busy = '0';
                }
            };
        }
        _bind_seerr_rating(panel, d, logos, route.mediaType);
        _bind_bell(panel, d, route.mediaType);
        const track = panel.querySelector('.jr-cast-track');
        panel.querySelectorAll('.jr-cast-arrow').forEach(a => {
            a.onclick = () => { if (track) track.scrollBy({ left: a.dataset.dir * track.clientWidth * 0.8, behavior: 'smooth' }); };
        });
    }

    async function _bind_bell(panel, d, seerrMediaType) {
        const bell = panel.querySelector('#jr-btn-bell');
        if (!bell) return;
        // Seerr utilise 'tv', notre backend utilise 'series'
        const mediaType = seerrMediaType === 'tv' ? 'series' : 'movie';
        await _attach_bell(bell, String(d.id), mediaType);
    }

    async function _attach_bell(bell, tmdbId, mediaType) {
        if (!bell || !tmdbId) return;
        const userId = ApiClient.getCurrentUserId();

        await _ensure_monitored_set();
        _refresh_bell_visual(bell, _is_monitored(tmdbId, mediaType));

        bell.onclick = async () => {
            if (bell.dataset.busy === '1') return;
            bell.dataset.busy = '1';
            const wasMonitored = bell.classList.contains('is-monitored');
            try {
                if (wasMonitored) {
                    await _ensure_monitored_set();
                    const id = _monitoring_id_of(tmdbId, mediaType);
                    if (id) {
                        await API.ajax('DELETE', `api/MediaRating/Monitoring/${id}?userId=${encodeURIComponent(userId)}`, null, 'json');
                    }
                    _invalidate_monitored_cache();
                    _refresh_bell_visual(bell, false);
                } else {
                    const res = await API.ajax('POST', 'api/MediaRating/Monitoring', { userId, tmdbId, mediaType }, 'json');
                    if (res?.success) {
                        _invalidate_monitored_cache();
                        _refresh_bell_visual(bell, true);
                    } else {
                        alert(res?.message || 'Échec du monitoring');
                    }
                }
            } catch (e) {
                alert('Erreur réseau : ' + e.message);
            } finally {
                bell.dataset.busy = '0';
            }
        };
    }

    function _refresh_bell_visual(bell, isMonitored) {
        bell.classList.toggle('is-monitored', !!isMonitored);
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
        const old_bell = document.getElementById('jr-btn-bell-native');
        if (old_bell) old_bell.remove();
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

        // Cloche de monitoring (uniquement si on a un tmdbId — requis pour TMDB)
        if (tmdbId && (providerInfo?.Type === 'Movie' || providerInfo?.Type === 'Series')) {
            const mediaType = providerInfo.Type === 'Series' ? 'series' : 'movie';
            const bell = document.createElement('button');
            bell.type = 'button';
            bell.className = 'jr-btn-bell';
            bell.id = 'jr-btn-bell-native';
            bell.setAttribute('aria-label', 'Suivre les sorties');
            bell.title = 'Suivre les sorties';
            bell.innerHTML = SVG_BELL;
            widget.parentElement.insertBefore(bell, widget.nextSibling);
            _attach_bell(bell, String(tmdbId), mediaType);
        }
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
        const isHome = _is_home_route();
        if (!isHome) {
            document.body.classList.remove('jr-tab-active');
            document.body.classList.remove('jr-monitoring-active');
        } else {
            const last = sessionStorage.getItem('jr-last-tab');
            if (last === 'ratings') document.body.classList.add('jr-tab-active');
            else if (last === 'monitoring') document.body.classList.add('jr-monitoring-active');
        }
        if (document.body.classList.contains('jr-tab-active')) _syncTabHighlight('jr-tab-btn');
        else if (document.body.classList.contains('jr-monitoring-active')) _syncTabHighlight('jr-monitoring-tab-btn');
        injectTab(); injectWidget();
    }).observe(document.body, { subtree: true, childList: true });

    window.addEventListener('hashchange', _handle_detail_route);

    // Refresh = retour home : on vide la persistance de tab uniquement au chargement
    // initial du script (le script ne re-tourne pas sur navigation SPA interne).
    sessionStorage.removeItem('jr-last-tab');
    injectTab(); injectWidget(); _handle_detail_route();
})();
