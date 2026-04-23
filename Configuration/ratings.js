(function () {
    'use strict';

    // -----------------------------------------------------------------
    // Valeurs de rating
    // -----------------------------------------------------------------
    const RATING = { DISLIKE: -1, LIKE: 1, LOVE: 2 };

    // Path SVG Netflix (pouce)
    const THUMB_PATH = `M10.696 8.773A2 2 0 0 0 11 7.713V4h.838c.877 0 1.59.553 1.77 1.311
        C13.822 6.228 14 7.227 14 8a7 7 0 0 1-.246 1.75L13.432 11H17.5a1.5 1.5 0 0 1 1.476
        1.77l-.08.445.28.354c.203.256.324.578.324.931s-.12.675-.324.93l-.28.355.08.445q.024.13.024.27
        c0 .49-.234.925-.6 1.2l-.4.3v.5a1.5 1.5 0 0 1-1.5 1.5h-3.877a9 9 0 0 1-2.846-.462l-1.493-.497
        A10.5 10.5 0 0 0 5 18.5v-4.747l2.036-.581a3 3 0 0 0 1.72-1.295z
        M10.5 2A1.5 1.5 0 0 0 9 3.5v4.213l-1.94 3.105a1 1 0 0 1-.574.432l-2.035.581
        A2 2 0 0 0 3 13.754v4.793c0 1.078.874 1.953 1.953 1.953.917 0 1.828.148 2.698.438
        l1.493.498a11 11 0 0 0 3.479.564H16.5a3.5 3.5 0 0 0 3.467-3.017 3.5 3.5 0 0 0
        1.028-2.671c.32-.529.505-1.15.505-1.812s-.185-1.283-.505-1.812Q21 12.595 21 12.5
        A3.5 3.5 0 0 0 17.5 9h-1.566c.041-.325.066-.66.066-1 0-1.011-.221-2.194-.446-3.148
        C15.14 3.097 13.543 2 11.838 2z`;

    // -----------------------------------------------------------------
    // CSS
    // -----------------------------------------------------------------
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --jf-text: #ffffff;
            --jf-hover-bg: rgba(255, 255, 255, 0.18);
            --jf-popover-bg: rgba(28, 28, 28, 0.9);
            --jf-blur: blur(20px);
            --bezier: cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .rating-wrapper {
            position: relative;
            padding: 10px;
        }

        .main-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: transparent;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: background-color 0.2s ease;
            outline: none;
            position: relative;
            z-index: 5;
        }

        .main-btn:hover { background-color: var(--jf-hover-bg); }

        .main-btn svg {
            width: 24px;
            height: 24px;
            fill: var(--jf-text);
        }

        .main-btn.is-dislike svg { transform: rotate(180deg); }
        .main-btn.is-love svg { width: 34px; }

        .rating-menu {
            position: absolute;
            bottom: 65px;
            left: 50%;
            transform: translateX(-50%) translateY(15px) scale(0.9);
            background-color: var(--jf-popover-bg);
            backdrop-filter: var(--jf-blur);
            -webkit-backdrop-filter: var(--jf-blur);
            border-radius: 40px;
            padding: 6px 12px;
            display: flex;
            gap: 8px;
            visibility: hidden;
            opacity: 0;
            transition: opacity 0.25s ease, transform 0.35s var(--bezier), visibility 0.25s;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 1000;
        }

        /* Pont invisible pour maintenir le hover */
        .rating-menu::after {
            content: '';
            position: absolute;
            bottom: -35px;
            left: -20px;
            right: -20px;
            top: 0;
            z-index: -1;
        }

        .rating-wrapper:hover .rating-menu,
        .rating-wrapper.is-open .rating-menu {
            visibility: visible;
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }

        .option-btn {
            position: relative;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s ease, transform 0.2s var(--bezier);
        }

        .option-btn:hover {
            background-color: var(--jf-hover-bg);
            transform: scale(1.15);
        }

        .option-btn svg {
            width: 24px;
            height: 24px;
            fill: var(--jf-text);
        }

        .option-btn.is-selected { opacity: 1; }
        .option-btn:not(.is-selected) { opacity: 0.6; }
        .rating-menu:not(.has-selection) .option-btn { opacity: 1; }

        .dislike svg { transform: rotate(180deg); }
        .love svg { width: 34px; }

        /* Tooltip */
        .option-btn::before {
            content: attr(data-label);
            position: absolute;
            bottom: 55px;
            left: 50%;
            transform: translateX(-50%) translateY(5px);
            background: #ffffff;
            color: #000000;
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .option-btn:hover::before {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `;
    document.head.appendChild(style);

    // -----------------------------------------------------------------
    // SVG helpers
    // -----------------------------------------------------------------
    function _svg_thumb_up() {
        return `<svg viewBox="0 0 24 24"><path d="${THUMB_PATH}"/></svg>`;
    }

    function _svg_thumb_down() {
        return `<svg viewBox="0 0 24 24"><path d="${THUMB_PATH}"/></svg>`;
    }

    function _svg_double_thumb() {
        return `
        <svg viewBox="0 0 32 24">
            <path opacity="0.4" transform="translate(6,0)" d="${THUMB_PATH}"/>
            <path d="${THUMB_PATH}"/>
        </svg>`;
    }

    // SVG affiché dans le trigger selon le vote enregistré
    function _trigger_svg(rating) {
        if (rating === RATING.LOVE)    return _svg_double_thumb();
        if (rating === RATING.DISLIKE) return _svg_thumb_up();   // sera retourné via CSS
        return _svg_thumb_up();                                   // like ou neutre
    }

    // -----------------------------------------------------------------
    // API calls
    // -----------------------------------------------------------------
    async function _load_my_rating(itemId) {
        try {
            const userId = ApiClient.getCurrentUserId();
            const res = await fetch(
                ApiClient.getUrl(`api/MediaRating/MyRating/${itemId}?userId=${userId}`),
                { headers: { 'X-Emby-Token': ApiClient.accessToken() } }
            );
            return await res.json();
        } catch {
            return null;
        }
    }

    async function _save_rating(itemId, rating) {
        try {
            const userId  = ApiClient.getCurrentUserId();
            const user    = await ApiClient.getCurrentUser();
            const userName = user?.Name ?? 'Unknown';
            const url = ApiClient.getUrl(
                `api/MediaRating/Rate?itemId=${itemId}&userId=${userId}&rating=${rating}&userName=${encodeURIComponent(userName)}`
            );
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'X-Emby-Token': ApiClient.accessToken() }
            });
            return await res.json();
        } catch {
            return { success: false };
        }
    }

    async function _delete_rating(itemId) {
        try {
            const userId = ApiClient.getCurrentUserId();
            const url = ApiClient.getUrl(
                `api/MediaRating/Rating?itemId=${itemId}&userId=${userId}`
            );
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'X-Emby-Token': ApiClient.accessToken() }
            });
            return await res.json();
        } catch {
            return { success: false };
        }
    }

    // -----------------------------------------------------------------
    // Widget UI
    // -----------------------------------------------------------------
    function _create_widget(itemId) {
        const wrapper = document.createElement('div');
        wrapper.className = 'rating-wrapper';
        wrapper.id = 'jr-widget';

        wrapper.innerHTML = `
            <button class="main-btn" id="jr-trigger">
                ${_svg_thumb_up()}
            </button>
            <div class="rating-menu" id="jr-menu">
                <div class="option-btn dislike" data-rating="-1" data-label="Pas pour moi">
                    ${_svg_thumb_down()}
                </div>
                <div class="option-btn" data-rating="1" data-label="J'aime bien">
                    ${_svg_thumb_up()}
                </div>
                <div class="option-btn love" data-rating="2" data-label="J'adore !">
                    ${_svg_double_thumb()}
                </div>
            </div>
        `;

        const trigger = wrapper.querySelector('#jr-trigger');
        const menu    = wrapper.querySelector('#jr-menu');

        // Ouverture/fermeture au clic
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('is-open');
        });

        document.addEventListener('click', () => wrapper.classList.remove('is-open'));
        menu.addEventListener('click', (e) => e.stopPropagation());

        // Clic sur une option
        wrapper.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const newRating = parseInt(btn.dataset.rating);
                const currentlySelected = btn.classList.contains('is-selected');

                if (currentlySelected) {
                    // Désélection → supprime le vote
                    await _delete_rating(itemId);
                    _apply_selection(wrapper, null);
                } else {
                    const result = await _save_rating(itemId, newRating);
                    if (result.success) {
                        _apply_selection(wrapper, newRating);
                    }
                }

                wrapper.classList.remove('is-open');
            });
        });

        return wrapper;
    }

    // Met à jour l'UI selon le vote actif
    function _apply_selection(wrapper, rating) {
        const trigger = wrapper.querySelector('.main-btn');
        const menu    = wrapper.querySelector('.rating-menu');

        // Reset trigger
        trigger.classList.remove('is-dislike', 'is-like', 'is-love');
        trigger.innerHTML = _trigger_svg(rating);

        // Reset options
        menu.classList.remove('has-selection');
        wrapper.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('is-selected'));

        if (rating === null) return;

        menu.classList.add('has-selection');

        // Marque l'option sélectionnée
        const selected = wrapper.querySelector(`.option-btn[data-rating="${rating}"]`);
        if (selected) selected.classList.add('is-selected');

        // Classe CSS sur le trigger pour orienter l'icône
        if (rating === RATING.DISLIKE) trigger.classList.add('is-dislike');
        if (rating === RATING.LIKE)    trigger.classList.add('is-like');
        if (rating === RATING.LOVE)    trigger.classList.add('is-love');
    }

    // -----------------------------------------------------------------
    // Injection dans la page détail
    // -----------------------------------------------------------------
    let _current_item_id  = null;
    let _is_injecting     = false;
    let _injection_tries  = 0;
    const MAX_TRIES       = 25;

    async function _inject_widget() {
        if (_is_injecting) return;

        // Récupère l'itemId depuis l'URL
        let itemId = null;
        const urlParams  = new URLSearchParams(window.location.search);
        itemId = urlParams.get('id');

        if (!itemId && window.location.hash.includes('?')) {
            itemId = new URLSearchParams(window.location.hash.split('?')[1]).get('id');
        }

        if (!itemId) return;

        // Déjà injecté pour cet item
        const existing = document.getElementById('jr-widget');
        if (existing && _current_item_id === itemId) return;
        if (existing) existing.remove();

        // Cible le bouton bande-annonce pour le remplacer
        const trailerBtn = document.querySelector('.btnPlayTrailer');

        if (!trailerBtn) {
            if (_injection_tries < MAX_TRIES) {
                _injection_tries++;
                setTimeout(_inject_widget, 200);
            }
            return;
        }

        _is_injecting    = true;
        _current_item_id = itemId;
        _injection_tries = 0;

        // Cache le bouton bande-annonce et insère le widget à sa place
        trailerBtn.style.display = 'none';
        const widget = _create_widget(itemId);
        trailerBtn.parentElement.insertBefore(widget, trailerBtn);

        // Charge le vote existant et l'affiche
        const data = await _load_my_rating(itemId);
        if (data?.rating != null) {
            _apply_selection(widget, data.rating);
        }

        _is_injecting = false;
    }

    function _reset_state() {
        _is_injecting    = false;
        _injection_tries = 0;
        _current_item_id = null;
        const w = document.getElementById('jr-widget');
        if (w) w.remove();
    }

    // -----------------------------------------------------------------
    // Navigation (SPA — Jellyfin change l'URL sans reload)
    // -----------------------------------------------------------------
    let _last_url = location.href;

    new MutationObserver(() => {
        const url = location.href;
        if (url !== _last_url) {
            _last_url = url;
            _reset_state();
            setTimeout(_inject_widget, 150);
            return;
        }

        // Détection d'ajout de conteneur détail sans changement d'URL
        const isDetail = window.location.hash.includes('/details') ||
                         window.location.href.includes('/details');
        if (isDetail && !document.getElementById('jr-widget')) {
            setTimeout(_inject_widget, 150);
        }
    }).observe(document.body, { subtree: true, childList: true });

    window.addEventListener('hashchange', () => {
        _reset_state();
        setTimeout(_inject_widget, 150);
    });

    // Tentatives initiales
    setTimeout(_inject_widget, 100);
    setTimeout(_inject_widget, 400);
    setTimeout(_inject_widget, 900);

})();
