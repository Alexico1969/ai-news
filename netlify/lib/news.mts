/**
 * Fetches and normalises AI news from a curated list of reputable feeds.
 * Shared by the on-demand `ai-news` endpoint and the scheduled `refresh-news` warmer.
 */

export type Source = {
    id: string
    name: string
    url: string
    kind: 'press' | 'research' | 'lab'
}

export type NewsItem = {
    id: string
    title: string
    link: string
    summary: string
    image: string | null
    source: string
    sourceId: string
    kind: Source['kind']
    published: string
}

export type NewsPayload = {
    items: NewsItem[]
    fetchedAt: string
    sources: { name: string; ok: boolean; count: number }[]
}

/**
 * Curated, AI-specific feeds from established newsrooms, research institutions
 * and the labs themselves. Every entry is a topic feed, so items arrive
 * pre-filtered for AI relevance.
 */
export const SOURCES: Source[] = [
    { id: 'arstechnica', name: 'Ars Technica', url: 'https://arstechnica.com/ai/feed/', kind: 'press' },
    { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', kind: 'press' },
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', kind: 'press' },
    { id: 'wired', name: 'WIRED', url: 'https://www.wired.com/feed/tag/ai/latest/rss', kind: 'press' },
    { id: 'venturebeat', name: 'VentureBeat', url: 'https://venturebeat.com/category/ai/feed/', kind: 'press' },
    { id: 'techreview', name: 'MIT Tech Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', kind: 'research' },
    { id: 'ieee', name: 'IEEE Spectrum', url: 'https://spectrum.ieee.org/topic/artificial-intelligence/feed', kind: 'research' },
    { id: 'mitnews', name: 'MIT News', url: 'https://news.mit.edu/rss/topic/artificial-intelligence2', kind: 'research' },
    { id: 'openai', name: 'OpenAI', url: 'https://openai.com/news/rss.xml', kind: 'lab' },
    { id: 'deepmind', name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', kind: 'lab' },
]

const USER_AGENT = 'AIHorizonBot/1.0 (+https://ai-news-site.netlify.app)'
const FEED_TIMEOUT_MS = 8_000
const MAX_ITEMS = 30
const MAX_PER_SOURCE = 6
const MAX_AGE_DAYS = 45

const NAMED_ENTITIES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
    mdash: '—', ndash: '–', hellip: '…', eacute: 'é',
}

function decodeEntities(input: string): string {
    return input
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match)
}

function unwrapCdata(input: string): string {
    return input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function clean(input: string): string {
    return decodeEntities(unwrapCdata(input))
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/** Reads the text content of the first `<name>` element in a block. */
function readTag(block: string, name: string): string | null {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
    return match ? match[1] : null
}

/** Reads an attribute from the first `<name ...>` element in a block. */
function readAttr(block: string, name: string, attr: string): string | null {
    const match = block.match(new RegExp(`<${name}(\\s[^>]*?)/?>`, 'i'))
    if (!match) return null
    const attrMatch = match[1].match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i'))
    return attrMatch ? decodeEntities(attrMatch[1]) : null
}

function truncate(text: string, limit = 220): string {
    if (text.length <= limit) return text
    const cut = text.slice(0, limit)
    const lastSpace = cut.lastIndexOf(' ')
    return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`
}

function extractLink(block: string): string | null {
    // RSS uses <link>url</link>; Atom uses <link rel="alternate" href="url" />.
    const rssLink = readTag(block, 'link')
    if (rssLink) {
        const value = clean(rssLink)
        if (value.startsWith('http')) return value
    }
    const alternate = block.match(/<link[^>]*rel=["']alternate["'][^>]*>/i)
    if (alternate) {
        const href = alternate[0].match(/href\s*=\s*["']([^"']+)["']/i)
        if (href) return decodeEntities(href[1])
    }
    return readAttr(block, 'link', 'href')
}

function looksLikeImage(url: string | null): boolean {
    return !!url && /^https?:\/\//i.test(url) && !/\.(mp3|mp4|m4a|wav|pdf)(\?|$)/i.test(url)
}

function extractImage(block: string): string | null {
    const thumbnail = readAttr(block, 'media:thumbnail', 'url')
    if (looksLikeImage(thumbnail)) return thumbnail

    const mediaContent = block.match(/<media:content[^>]*>/gi) ?? []
    for (const tag of mediaContent) {
        const type = tag.match(/(?:type|medium)\s*=\s*["']([^"']+)["']/i)?.[1] ?? ''
        const url = tag.match(/url\s*=\s*["']([^"']+)["']/i)?.[1]
        if (url && (/image/i.test(type) || /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url))) {
            return decodeEntities(url)
        }
    }

    const enclosure = block.match(/<enclosure[^>]*>/i)?.[0]
    if (enclosure && /image/i.test(enclosure)) {
        const url = enclosure.match(/url\s*=\s*["']([^"']+)["']/i)?.[1]
        if (looksLikeImage(url ?? null)) return decodeEntities(url!)
    }

    // Fall back to the first inline image in the article body.
    const body = readTag(block, 'content:encoded') ?? readTag(block, 'content') ?? readTag(block, 'description') ?? ''
    const inline = unwrapCdata(body).match(/<img[^>]*src\s*=\s*["']([^"']+)["']/i)?.[1]
    return looksLikeImage(inline ?? null) ? decodeEntities(inline!) : null
}

/** Strips tracking parameters so the same story from one source dedupes cleanly. */
function canonicalise(link: string): string {
    try {
        const url = new URL(link)
        for (const key of [...url.searchParams.keys()]) {
            if (/^(utm_|ref|source|guccounter)/i.test(key)) url.searchParams.delete(key)
        }
        return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}`
    } catch {
        return link
    }
}

function parseFeed(xml: string, source: Source, limit = MAX_PER_SOURCE): NewsItem[] {
    const blocks = xml.match(/<(item|entry)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi) ?? []
    const items: NewsItem[] = []

    for (const block of blocks) {
        const rawTitle = readTag(block, 'title')
        const link = extractLink(block)
        if (!rawTitle || !link) continue

        const title = clean(rawTitle)
        if (!title) continue

        const rawDate =
            readTag(block, 'pubDate') ??
            readTag(block, 'published') ??
            readTag(block, 'updated') ??
            readTag(block, 'dc:date')
        const parsed = rawDate ? new Date(clean(rawDate)) : null
        const published = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null
        if (!published) continue

        const rawSummary =
            readTag(block, 'description') ??
            readTag(block, 'summary') ??
            readTag(block, 'content:encoded') ??
            readTag(block, 'content') ??
            ''

        items.push({
            id: canonicalise(link),
            title,
            link,
            summary: truncate(clean(rawSummary)),
            image: extractImage(block),
            source: source.name,
            sourceId: source.id,
            kind: source.kind,
            published: published.toISOString(),
        })
    }

    return items
        .sort((a, b) => Date.parse(b.published) - Date.parse(a.published))
        .slice(0, limit)
}

/** Fetches and parses a single feed. Exported so other endpoints can read one source directly. */
export async function fetchFeedItems(source: Source, limit?: number): Promise<NewsItem[]> {
    const response = await fetch(source.url, {
        headers: { 'user-agent': USER_AGENT, accept: 'application/rss+xml, application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`${source.name} responded ${response.status}`)
    return parseFeed(await response.text(), source, limit)
}

/**
 * Fetches every source in parallel and merges the results into a single,
 * de-duplicated, newest-first feed. A source that fails or times out is
 * reported in `sources` and simply left out of the results.
 */
export async function collectNews(): Promise<NewsPayload> {
    const settled = await Promise.allSettled(SOURCES.map((source) => fetchFeedItems(source)))
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000

    const sources = settled.map((result, index) => ({
        name: SOURCES[index].name,
        ok: result.status === 'fulfilled',
        count: result.status === 'fulfilled' ? result.value.length : 0,
    }))

    for (const [index, result] of settled.entries()) {
        if (result.status === 'rejected') {
            console.warn(`Feed failed: ${SOURCES[index].name} — ${result.reason}`)
        }
    }

    const seen = new Set<string>()
    const items: NewsItem[] = []

    for (const result of settled) {
        if (result.status !== 'fulfilled') continue
        for (const item of result.value) {
            if (Date.parse(item.published) < cutoff) continue
            const titleKey = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
            if (seen.has(item.id) || seen.has(titleKey)) continue
            seen.add(item.id)
            seen.add(titleKey)
            items.push(item)
        }
    }

    items.sort((a, b) => Date.parse(b.published) - Date.parse(a.published))

    return {
        items: items.slice(0, MAX_ITEMS),
        fetchedAt: new Date().toISOString(),
        sources,
    }
}
