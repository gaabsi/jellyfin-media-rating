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
        body.jr-tab-active #jr-tab-panel { display: block !important; }
        body.jr-tab-active .tab-panel-container > div:not(#jr-tab-panel), body.jr-tab-active .pageContainer > div:not(#jr-tab-panel), body.jr-tab-active .sections { display: none !important; }
        .jr-header { display: flex; align-items: center; gap: 15px; margin-bottom: 1em; padding: 0 3.3%; }
        .jr-back-arrow { width: 32px; height: 32px; cursor: pointer; color: var(--text-primary); transition: transform 0.2s; }
        .jr-back-arrow:hover { transform: translateX(-3px); color: var(--theme-primary-color); }
        
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

    const API = {
        get: (url) => ApiClient.getJSON(ApiClient.getUrl(url)),
        ajax: (type, url) => ApiClient.ajax({ type, url: ApiClient.getUrl(url) })
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
            panel.innerHTML = `<div class=\"padded-left padded-right padded-bottom\"><div class=\"jr-header\"><div class=\"jr-back-arrow\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"${BACK_PATH}\"/></svg></div><h2 class=\"sectionTitle\">Mes votes</h2></div><div class=\"verticalSection\"><div class=\"itemsContainer vertical-wrap\" id=\"jr-cards-container\"></div></div></div>`;
            container.appendChild(panel);
            panel.querySelector('.jr-back-arrow').onclick = () => {
                const homeBtn = slider.querySelector('.emby-tab-button:not(#jr-tab-btn)');
                if (homeBtn) homeBtn.click();
                exitRatingsMode();
            };
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
            const ratingMap = {}; data.ratings.forEach(r => { ratingMap[r.item_id.replace(/-/g, '')] = r.rating; });
            const ids = data.ratings.map(r => r.item_id.replace(/-/g, '')).join(',');
            const items = await API.get(`Users/${userId}/Items?Ids=${ids}&Fields=PrimaryImageAspectRatio,ImageTags,ProductionYear`);
            container.innerHTML = (items.Items || []).map(item => {
                const imgUrl = ApiClient.getUrl(`Items/${item.Id}/Images/Primary?fillHeight=456&fillWidth=304&quality=96&tag=${item.ImageTags.Primary}`);
                const rating = ratingMap[item.Id];
                const detailUrl = `#/details?id=${item.Id}&serverId=${ApiClient.serverId()}`;
                return `<div class=\"card portraitCard card-hoverable card-withuserdata\" data-id=\"${item.Id}\"><div class=\"cardBox cardBox-bottompadded\"><div class=\"cardScalable\"><div class=\"cardPadder cardPadder-overflowPortrait\"></div><a href=\"${detailUrl}\" class=\"cardImageContainer coveredImage cardContent itemAction lazy\"><div style=\"background-image: url('${imgUrl}');\" class=\"cardImageContainer coveredImage cardContent\"></div><div class=\"jr-card-badge\" data-rating=\"${rating}\">${UI.getSvg(THUMB_PATH)}</div></a></div><div class=\"cardText cardTextCentered cardText-first\"><bdi><a href=\"${detailUrl}\" class=\"itemAction textActionButton\">${UI.esc(item.Name)}</a></bdi></div><div class=\"cardText cardTextCentered cardText-secondary\"><bdi>${item.ProductionYear || ''}</bdi></div></div></div>`;
            }).join('');
        } catch (e) { container.innerHTML = '<p>Erreur.</p>'; }
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
        widget.innerHTML = `<button id=\"jr-trigger\" class=\"jr-btn\">${UI.getSvg(THUMB_PATH)}</button><div class=\"rating-menu\"><div class=\"opt-btn dislike\" data-rating=\"-1\" data-label=\"Pas pour moi\">${UI.getSvg(THUMB_PATH)}</div><div class=\"opt-btn\" data-rating=\"1\" data-label=\"J'aime bien\">${UI.getSvg(THUMB_PATH)}</div><div class=\"opt-btn love\" data-rating=\"2\" data-label=\"J'adore !\">${UI.getDoubleThumb()}</div></div>`;
        trailerBtn.parentElement.insertBefore(widget, trailerBtn);
        const data = await API.get(`api/MediaRating/MyRating/${itemId}?userId=${ApiClient.getCurrentUserId()}`);
        if (data?.rating != null) _updateTrigger(widget, data.rating);
        document.getElementById('jr-trigger').onclick = (e) => { e.stopPropagation(); widget.classList.toggle('is-open'); };
        widget.querySelectorAll('.opt-btn').forEach(btn => {
            btn.onclick = async () => {
                const val = parseInt(btn.dataset.rating);
                if (btn.classList.contains('is-selected')) { await API.ajax('DELETE', `api/MediaRating/Rating?itemId=${itemId}&userId=${ApiClient.getCurrentUserId()}`); _updateTrigger(widget, null); }
                else {
                    const user = await ApiClient.getCurrentUser();
                    const userName = user?.Name ?? 'Unknown';
                    const item = await API.get(`Users/${ApiClient.getCurrentUserId()}/Items/${itemId}`);
                    await API.ajax('POST', `api/MediaRating/Rate?itemId=${itemId}&userId=${ApiClient.getCurrentUserId()}&rating=${val}&userName=${encodeURIComponent(userName)}&itemName=${encodeURIComponent(item.Name)}`);
                    _updateTrigger(widget, val);
                }
                widget.classList.remove('is-open');
            };
        });
        state.isInjecting = false;
    }

    function _updateTrigger(widget, rating) {
        const trigger = widget.querySelector('#jr-trigger');
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

    injectTab(); injectWidget();
})();
