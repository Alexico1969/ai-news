/**
 * Models page: renders the current flagship model for each major lab, the
 * features that shipped with it, and the newest announcements since launch.
 * Data comes from /api/models — curated specs read off vendor documentation,
 * combined with live release feeds.
 */

const MODELS_ENDPOINT = '/api/models';

const state = {
    providers: [],
    verifiedOn: null,
    fetchedAt: null,
    loading: false,
    degraded: false,
};

const grid = document.getElementById('models-grid');
const jump = document.getElementById('provider-jump');
const statusEl = document.getElementById('models-status');
const statusText = document.getElementById('models-status-text');
const refreshBtn = document.getElementById('refresh-models');

/* ---------- helpers ---------- */

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function relativeTime(iso) {
    const then = Date.parse(iso);
    if (Number.isNaN(then)) return '';

    const minutes = Math.round((Date.now() - then) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(then).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDate(iso) {
    const parsed = Date.parse(iso);
    if (Number.isNaN(parsed)) return escapeHtml(iso);
    return new Date(parsed).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ---------- rendering ---------- */

function specRow(spec) {
    return `
        <div class="spec">
            <dt>${escapeHtml(spec.label)}</dt>
            <dd>${escapeHtml(spec.value)}</dd>
        </div>`;
}

function featureRow(feature) {
    const meta = [];
    if (feature.date) meta.push(`<span class="feature-date">${escapeHtml(feature.date)}</span>`);
    if (feature.source) {
        meta.push(
            `<a class="feature-source" href="${escapeHtml(feature.source)}" target="_blank" rel="noopener noreferrer">Source <i data-lucide="external-link"></i></a>`,
        );
    }

    return `
        <li class="feature">
            <div class="feature-head">
                <h4>${escapeHtml(feature.title)}</h4>
                ${meta.length ? `<div class="feature-meta">${meta.join('')}</div>` : ''}
            </div>
            <p>${escapeHtml(feature.detail)}</p>
        </li>`;
}

function variantRow(variant) {
    return `
        <li class="${variant.current ? 'variant current' : 'variant'}">
            <span class="variant-name">${escapeHtml(variant.name)}</span>
            <span class="variant-role">${escapeHtml(variant.role)}</span>
        </li>`;
}

function updateRow(item) {
    return `
        <li class="model-update">
            <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
            <span class="update-meta">${escapeHtml(item.source)} · ${escapeHtml(relativeTime(item.published))}</span>
        </li>`;
}

function updatesBlock(provider) {
    if (!provider.updates.length) {
        return `
            <div class="model-updates">
                <h3>Latest posts</h3>
                <p class="updates-empty">No recent posts could be loaded for ${escapeHtml(provider.vendor)} right now.</p>
            </div>`;
    }

    const label = provider.updatesFrom === 'official'
        ? `Live from the ${escapeHtml(provider.vendor)} blog`
        : 'Live from AI newsrooms';

    return `
        <div class="model-updates">
            <h3>Latest posts <span class="updates-origin">${label}</span></h3>
            <ul>${provider.updates.map(updateRow).join('')}</ul>
        </div>`;
}

function providerCard(provider) {
    const links = provider.links
        .map(
            (link) =>
                `<a class="model-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)} <i data-lucide="arrow-up-right"></i></a>`,
        )
        .join('');

    return `
        <article class="model-card" id="provider-${escapeHtml(provider.id)}" style="--accent-hue: ${Number(provider.hue) || 200}">
            <div class="model-card-head">
                <div class="model-vendor">
                    <span class="vendor-mark">${escapeHtml(provider.name.slice(0, 2).toUpperCase())}</span>
                    <div>
                        <span class="vendor-name">${escapeHtml(provider.name)}</span>
                        <span class="vendor-sub">${escapeHtml(provider.vendor)}</span>
                    </div>
                </div>
                <span class="model-status">${escapeHtml(provider.model.status)}</span>
            </div>

            <h2 class="model-name">${escapeHtml(provider.model.name)}</h2>
            <p class="model-tagline">${escapeHtml(provider.model.tagline)}</p>

            <dl class="spec-grid">${provider.specs.map(specRow).join('')}</dl>

            <div class="model-section">
                <h3>Latest features</h3>
                <ul class="feature-list">${provider.features.map(featureRow).join('')}</ul>
            </div>

            <div class="model-section">
                <h3>Where it sits in the lineup</h3>
                <ul class="variant-list">${provider.lineup.map(variantRow).join('')}</ul>
            </div>

            ${provider.note ? `<p class="model-note"><i data-lucide="info"></i><span>${escapeHtml(provider.note)}</span></p>` : ''}

            ${updatesBlock(provider)}

            <div class="model-card-foot">${links}</div>
        </article>`;
}

function renderJump() {
    if (!jump) return;

    jump.innerHTML = state.providers
        .map(
            (provider) =>
                `<a class="chip" href="#provider-${escapeHtml(provider.id)}" style="--accent-hue: ${Number(provider.hue) || 200}">
                    <strong>${escapeHtml(provider.name)}</strong> ${escapeHtml(provider.model.name)}
                </a>`,
        )
        .join('');
}

function renderStatus() {
    if (!statusEl || !statusText) return;

    const dot = statusEl.querySelector('.status-dot');
    dot?.classList.remove('loading', 'stale', 'error');

    if (state.loading) {
        dot?.classList.add('loading');
        statusText.textContent = 'Fetching latest model data…';
        return;
    }

    if (!state.providers.length) {
        dot?.classList.add('error');
        statusText.textContent = 'Model data unavailable.';
        return;
    }

    if (state.degraded) dot?.classList.add('stale');

    const verified = state.verifiedOn ? `Specs verified against vendor documentation on ${formatDate(state.verifiedOn)}` : '';
    const checked = state.fetchedAt ? `feeds checked ${relativeTime(state.fetchedAt)}` : '';
    statusText.textContent = [verified, checked].filter(Boolean).join(' · ');
}

function renderModels() {
    if (!grid) return;

    grid.innerHTML = state.providers.map(providerCard).join('');
    if (window.lucide) lucide.createIcons();
}

function showLoading() {
    if (!grid) return;

    grid.innerHTML = `
        <div class="grid-state">
            <div class="state-title">Fetching latest model data…</div>
            <div class="state-detail">Reading the labs' own release notes and announcement feeds.</div>
        </div>`;
}

function showError(message) {
    if (!grid) return;

    grid.innerHTML = `
        <div class="grid-state">
            <div class="state-title">Could not load the model tracker</div>
            <div class="state-detail">${escapeHtml(message)}</div>
            <button class="btn btn-primary" id="retry-models">Try Again</button>
        </div>`;

    document.getElementById('retry-models')?.addEventListener('click', () => loadModels({ force: true }));
}

/* ---------- data ---------- */

async function loadModels({ force = false } = {}) {
    if (state.loading) return;

    state.loading = true;
    refreshBtn?.classList.add('spinning');
    if (!state.providers.length) showLoading();
    renderStatus();

    try {
        const response = await fetch(force ? `${MODELS_ENDPOINT}?refresh=1` : MODELS_ENDPOINT, {
            headers: { accept: 'application/json' },
        });
        const payload = await response.json();

        if (!response.ok || !payload.providers?.length) {
            throw new Error(payload.error || 'The model service is temporarily unavailable.');
        }

        state.providers = payload.providers;
        state.verifiedOn = payload.verifiedOn ?? null;
        state.fetchedAt = payload.fetchedAt ?? new Date().toISOString();
        state.degraded = Boolean(payload.degraded);
        state.loading = false;

        renderModels();
        renderJump();
        renderStatus();
    } catch (error) {
        console.error(error);
        state.loading = false;
        renderStatus();
        if (!state.providers.length) showError(error.message || 'Please try again shortly.');
    } finally {
        refreshBtn?.classList.remove('spinning');
    }
}

/* ---------- events ---------- */

refreshBtn?.addEventListener('click', () => loadModels({ force: true }));

window.addEventListener('scroll', () => {
    // Toggle a class rather than writing inline styles, which would otherwise
    // override the stylesheet's header background for the rest of the visit.
    document.getElementById('main-header')?.classList.toggle('scrolled', window.scrollY > 50);
});

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    loadModels();
});
