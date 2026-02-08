const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800';

const newsData = [
    {
        title: "Anthropic Launches Claude 4.6 with 'Agent Teams'",
        category: "Models",
        summary: "The latest iteration features a 1-million token context window and a groundbreaking research preview: coordinated agent teams that divide project tasks autonomously.",
        image: "claude.png",
        link: "https://www.anthropic.com/news",
        date: "Feb 05, 2026",
        readTime: "5 min read"
    },
    {
        title: "SpaceX and xAI Merge in Trillion-Dollar Deal",
        category: "Mergers",
        summary: "Uniting space infrastructure with frontier AI, the newly formed entity aims to colonize the digital and physical solar systems with autonomous systems.",
        image: "spacex.png",
        link: "https://x.ai",
        date: "Feb 08, 2026",
        readTime: "8 min read"
    }
];

function createNewsCard(item) {
    const imgUrl = item.image || FALLBACK_IMAGE;
    return `
        <a href="${item.link || '#'}" target="_blank" class="news-card fade-in-up" style="text-decoration: none; color: inherit;">
            <div class="card-img">
                <img src="${imgUrl}" alt="${item.title}" onerror="this.src='${FALLBACK_IMAGE}'">
            </div>
            <div class="card-content">
                <span class="card-category">${item.category || 'AI News'}</span>
                <h3>${item.title}</h3>
                <p>${item.summary}</p>
                <div class="card-footer">
                    <span>${item.date || 'Today'}</span>
                    <span>${item.readTime || '4 min read'}</span>
                    <span class="read-more" style="color: var(--primary); font-weight: bold; font-size: 0.7rem; display: flex; align-items: center; gap: 4px;">SOURCE <i data-lucide="external-link" style="width: 12px; height: 12px;"></i></span>
                </div>
            </div>
        </a>
    `;
}

async function fetchLatestNews() {
    const grid = document.getElementById('news-grid');
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 1rem; color: var(--primary); font-family: 'Orbitron';">SCANNING NEURAL NETWORKS FOR LATEST INTEL...</p>
        </div>
    `;

    try {
        // Using a public RSS to JSON proxy
        const rssUrl = 'https://www.artificialintelligence-news.com/feed/rss/';
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
        const data = await response.json();

        if (data.status === 'ok') {
            const liveNews = data.items.map(item => ({
                title: item.title,
                link: item.link,
                category: "Live Update",
                summary: item.description.replace(/<[^>]*>?/gm, '').substring(0, 160) + '...',
                image: item.thumbnail || item.enclosure?.link || null,
                date: new Date(item.pubDate).toLocaleDateString(),
                readTime: "4 min read"
            }));

            // Combine with featured news and render
            const allNews = [...newsData, ...liveNews];
            grid.innerHTML = allNews.map(item => createNewsCard(item)).join('');

            // Re-initialize Lucide icons for new cards
            if (window.lucide) lucide.createIcons();

            // Scroll to news section
            document.getElementById('news').scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error('Failed to fetch live news');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        // Fallback to initial display
        renderNews();
        alert('Real-time sync failed. Displaying cached intelligence.');
    }
}

function renderNews() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;
    grid.innerHTML = newsData.map(item => createNewsCard(item)).join('');
}

// Event Listeners
document.getElementById('read-latest')?.addEventListener('click', () => {
    fetchLatestNews();
});

document.getElementById('market-pulse')?.addEventListener('click', () => {
    document.getElementById('market').scrollIntoView({ behavior: 'smooth' });
});

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (window.scrollY > 50) {
        header.style.padding = '0.5rem 0';
        header.style.background = 'rgba(5, 5, 5, 0.9)';
    } else {
        header.style.padding = '1rem 0';
        header.style.background = 'var(--glass)';
    }
});

// Smooth scroll for nav links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Search functionality
document.querySelector('.search-box input')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.news-card');

    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        const summary = card.querySelector('p').innerText.toLowerCase();
        if (title.includes(term) || summary.includes(term)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderNews();
    if (window.lucide) {
        lucide.createIcons();
    }
});
