const NEWS_ENDPOINT = '/api/ai-news';

const state = {
    items: [],
    activeSource: 'all',
    searchTerm: '',
    fetchedAt: null,
    loading: false
};

/* ---------- helpers ---------- */

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

function relativeTime(isoDate) {
    const then = Date.parse(isoDate);
    if (Number.isNaN(then)) return '';

    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function readTime(item) {
    const words = `${item.title} ${item.summary}`.trim().split(/\s+/).length;
    return `${Math.max(2, Math.round(words / 40))} min read`;
}

// Sources without artwork get a deterministic gradient tile instead of an
// unrelated stock photo, so the card still reads as part of the grid.
function placeholderTile(item) {
    let hash = 0;
    for (const char of item.source) hash = (hash * 31 + char.charCodeAt(0)) % 360;
    const initials = item.source.split(/\s+/).slice(0, 2).map((word) => word[0]).join('');

    return `
        <div class="card-img card-img-fallback" style="--tile-hue: ${hash}">
            <span class="tile-initials">${escapeHtml(initials)}</span>
            <span class="tile-grid" aria-hidden="true"></span>
        </div>
    `;
}

/* ---------- rendering ---------- */

function createNewsCard(item) {
    const artwork = item.image
        ? `<div class="card-img"><img src="${escapeHtml(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.card-img').classList.add('img-failed')"></div>`
        : placeholderTile(item);

    return `
        <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="news-card fade-in-up">
            ${artwork}
            <div class="card-content">
                <span class="card-category">${escapeHtml(item.source)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.summary)}</p>
                <div class="card-footer">
                    <span>${escapeHtml(relativeTime(item.published))}</span>
                    <span>${escapeHtml(readTime(item))}</span>
                    <span class="read-more">SOURCE <i data-lucide="external-link"></i></span>
                </div>
            </div>
        </a>
    `;
}

function showLoading(message) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="grid-state">
            <div class="loading-spinner"></div>
            <p class="state-title">${escapeHtml(message)}</p>
            <p class="state-detail">Searching Ars Technica, The Verge, WIRED, TechCrunch, MIT Technology Review, IEEE Spectrum, OpenAI, Google DeepMind and more.</p>
        </div>
    `;
}

function showError(message) {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="grid-state">
            <p class="state-title error">${escapeHtml(message)}</p>
            <p class="state-detail">The news sources could not be reached.</p>
            <button class="btn btn-outline" id="retry-fetch">Try Again</button>
        </div>
    `;
    document.getElementById('retry-fetch')?.addEventListener('click', () => loadNews({ force: true }));
}

function visibleItems() {
    const term = state.searchTerm.toLowerCase();

    return state.items.filter((item) => {
        const matchesSource = state.activeSource === 'all' || item.sourceId === state.activeSource;
        const matchesTerm = !term ||
            item.title.toLowerCase().includes(term) ||
            item.summary.toLowerCase().includes(term) ||
            item.source.toLowerCase().includes(term);
        return matchesSource && matchesTerm;
    });
}

function renderNews() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    const items = visibleItems();

    if (!items.length) {
        grid.innerHTML = `
            <div class="grid-state">
                <p class="state-title">No stories match that filter</p>
                <p class="state-detail">Try a different search term or source.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = items.map(createNewsCard).join('');
    if (window.lucide) lucide.createIcons();
}

function renderFilters() {
    const bar = document.getElementById('source-filters');
    if (!bar) return;

    const counts = new Map();
    for (const item of state.items) {
        counts.set(item.sourceId, { name: item.source, count: (counts.get(item.sourceId)?.count ?? 0) + 1 });
    }

    const chips = [`<button class="chip${state.activeSource === 'all' ? ' active' : ''}" data-source="all">All <span>${state.items.length}</span></button>`];
    for (const [id, { name, count }] of counts) {
        chips.push(`<button class="chip${state.activeSource === id ? ' active' : ''}" data-source="${escapeHtml(id)}">${escapeHtml(name)} <span>${count}</span></button>`);
    }

    bar.innerHTML = chips.join('');
    bar.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            state.activeSource = chip.dataset.source;
            renderFilters();
            renderNews();
        });
    });
}

function renderStatus({ stale = false, failed = [] } = {}) {
    const status = document.getElementById('feed-status');
    if (!status) return;

    if (state.loading) {
        status.innerHTML = `<span class="status-dot loading"></span> Fetching latest news…`;
        return;
    }

    if (!state.items.length) {
        status.innerHTML = `<span class="status-dot error"></span> No live stories available`;
        return;
    }

    const newest = state.items[0].published;
    const notes = [];
    if (stale) notes.push('showing last saved results');
    if (failed.length) notes.push(`${failed.length} source${failed.length > 1 ? 's' : ''} unavailable`);

    status.innerHTML = `
        <span class="status-dot${stale ? ' stale' : ''}"></span>
        <strong>${state.items.length} stories</strong> · newest ${escapeHtml(relativeTime(newest))}
        · updated ${escapeHtml(relativeTime(state.fetchedAt))}
        ${notes.length ? `<em>· ${escapeHtml(notes.join(' · '))}</em>` : ''}
    `;
}

function renderHero() {
    const badge = document.getElementById('hero-badge');
    const lead = document.getElementById('hero-lead');
    const top = state.items[0];

    if (badge) {
        badge.textContent = top
            ? `LIVE · ${new Date(top.published).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}`
            : 'LIVE AI INTELLIGENCE';
    }

    if (lead && top) {
        lead.textContent = `Leading now: ${top.title} — via ${top.source}.`;
    }
}

/* ---------- data ---------- */

async function loadNews({ force = false, scroll = false } = {}) {
    state.loading = true;
    showLoading('Fetching latest news…');
    renderStatus();

    const refreshBtn = document.getElementById('refresh-news');
    refreshBtn?.classList.add('spinning');

    try {
        const response = await fetch(force ? `${NEWS_ENDPOINT}?refresh=1` : NEWS_ENDPOINT, {
            headers: { accept: 'application/json' }
        });
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.items) || !data.items.length) {
            throw new Error(data.error || 'No stories returned');
        }

        state.items = data.items;
        state.fetchedAt = data.fetchedAt;
        state.loading = false;

        renderFilters();
        renderNews();
        renderHero();
        renderStatus({
            stale: Boolean(data.stale),
            failed: (data.sources || []).filter((source) => !source.ok)
        });

        if (scroll) document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('News fetch failed:', error);
        state.loading = false;
        state.items = [];
        showError('Could not fetch the latest news');
        renderStatus();
    } finally {
        refreshBtn?.classList.remove('spinning');
    }
}

/* ---------- events ---------- */

document.getElementById('read-latest')?.addEventListener('click', () => {
    if (state.items.length) {
        document.getElementById('news')?.scrollIntoView({ behavior: 'smooth' });
    } else {
        loadNews({ scroll: true });
    }
});

document.getElementById('market-pulse')?.addEventListener('click', () => {
    document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('refresh-news')?.addEventListener('click', () => loadNews({ force: true }));

window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (!header) return;

    if (window.scrollY > 50) {
        header.style.padding = '0.5rem 0';
        header.style.background = 'rgba(5, 5, 5, 0.9)';
    } else {
        header.style.padding = '1rem 0';
        header.style.background = 'var(--glass)';
    }
});

document.querySelectorAll('nav a').forEach((anchor) => {
    anchor.addEventListener('click', function (event) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('nav a').forEach((link) => link.classList.remove('active'));
        this.classList.add('active');
    });
});

document.querySelector('.search-box input')?.addEventListener('input', (event) => {
    state.searchTerm = event.target.value;
    renderNews();
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    loadNews();
});

// Keep the "updated Xm ago" labels honest during long visits.
setInterval(() => {
    if (!state.loading && state.items.length) renderStatus();
}, 60_000);
