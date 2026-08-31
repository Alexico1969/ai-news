import { getStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'
import { SOURCES, fetchFeedItems, type NewsItem, type NewsPayload, type Source } from '../lib/news.mts'
import { PROVIDERS, VERIFIED_ON, type Provider } from '../lib/model-data.mts'

const STORE = 'news-cache'
const KEY = 'models-v1'
const NEWS_KEY = 'latest-v1'
const FRESH_FOR_MS = 30 * 60 * 1000
const MIN_REFRESH_INTERVAL_MS = 60 * 1000
/** Feeds are read deep, because a source's six newest posts may not mention a given model at all. */
const OFFICIAL_FEED_ITEMS = 40
const PRESS_FEED_ITEMS = 25
const UPDATES_PER_PROVIDER = 4

type ProviderPayload = Omit<Provider, 'officialFeed' | 'matchKeywords' | 'modelKeywords'> & {
    updates: NewsItem[]
    updatesFrom: 'official' | 'press' | 'none'
}

type ModelsPayload = {
    providers: ProviderPayload[]
    verifiedOn: string
    fetchedAt: string
}

function ageOf(payload: ModelsPayload): number {
    return Date.now() - Date.parse(payload.fetchedAt)
}

function matches(item: NewsItem, keywords: string[]): boolean {
    const haystack = `${item.title} ${item.summary}`.toLowerCase()
    return keywords.some((keyword) => haystack.includes(keyword))
}

/**
 * Picks a provider's most relevant recent stories: anything naming the model
 * itself comes first, then anything naming the lab, newest first within each
 * group. Stories that mention neither are dropped.
 */
function rank(items: NewsItem[], provider: Provider): NewsItem[] {
    return items
        .map((item) => ({
            item,
            score: matches(item, provider.modelKeywords) ? 2 : matches(item, provider.matchKeywords) ? 1 : 0,
        }))
        .filter((scored) => scored.score > 0)
        .sort((a, b) => b.score - a.score || Date.parse(b.item.published) - Date.parse(a.item.published))
        .slice(0, UPDATES_PER_PROVIDER)
        .map((scored) => scored.item)
}

async function readFeed(source: Source, limit: number): Promise<NewsItem[]> {
    try {
        return await fetchFeedItems(source, limit)
    } catch (error) {
        console.warn(`Could not read the ${source.name} feed:`, error)
        return []
    }
}

/**
 * Anthropic and xAI publish no feed we can reach, so their updates come from
 * press and research coverage — read deeper than the news page needs, since a
 * single lab may only surface a handful of times across all of them.
 */
async function pressCoverage(store: ReturnType<typeof getStore>): Promise<NewsItem[]> {
    const feeds = SOURCES.filter((source) => source.kind !== 'lab')
    const results = await Promise.all(feeds.map((source) => readFeed(source, PRESS_FEED_ITEMS)))
    const items = results.flat()
    if (items.length) return items

    // Every press feed failed; the news page's cache is better than nothing.
    try {
        const cached: NewsPayload | null = await store.get(NEWS_KEY, { type: 'json' })
        return cached?.items ?? []
    } catch (error) {
        console.warn('Could not read the news cache:', error)
        return []
    }
}

async function buildPayload(store: ReturnType<typeof getStore>): Promise<ModelsPayload> {
    const needsPress = PROVIDERS.some((provider) => !provider.officialFeed)
    const [press, officials] = await Promise.all([
        needsPress ? pressCoverage(store) : Promise.resolve<NewsItem[]>([]),
        Promise.all(
            PROVIDERS.map((provider) =>
                provider.officialFeed
                    ? readFeed(provider.officialFeed, OFFICIAL_FEED_ITEMS)
                    : Promise.resolve<NewsItem[]>([]),
            ),
        ),
    ])

    const providers = PROVIDERS.map((provider, index): ProviderPayload => {
        const { officialFeed, matchKeywords, modelKeywords, ...rest } = provider
        const updates = rank(officialFeed ? officials[index] : press, provider)
        return {
            ...rest,
            updates,
            updatesFrom: updates.length ? (officialFeed ? 'official' : 'press') : 'none',
        }
    })

    return { providers, verifiedOn: VERIFIED_ON, fetchedAt: new Date().toISOString() }
}

export default async (req: Request, context: Context) => {
    const store = getStore(STORE)
    const forced = new URL(req.url).searchParams.get('refresh') === '1'

    let cached: ModelsPayload | null = null
    try {
        cached = await store.get(KEY, { type: 'json' })
    } catch (error) {
        console.warn('Could not read models cache:', error)
    }

    if (cached?.providers?.length) {
        const age = ageOf(cached)
        if (age < FRESH_FOR_MS || (forced && age < MIN_REFRESH_INTERVAL_MS)) {
            return json({ ...cached, cached: true, ageSeconds: Math.round(age / 1000) })
        }
    }

    try {
        const payload = await buildPayload(store)

        context.waitUntil(
            store.setJSON(KEY, payload).catch((error) => console.warn('Could not write models cache:', error)),
        )

        return json({ ...payload, cached: false, ageSeconds: 0 })
    } catch (error) {
        console.error('Model data refresh failed:', error)

        if (cached?.providers?.length) {
            return json({ ...cached, cached: true, stale: true, ageSeconds: Math.round(ageOf(cached) / 1000) })
        }

        // The curated specs stand on their own; only the live updates are lost.
        return json({
            providers: PROVIDERS.map(({ officialFeed, matchKeywords, modelKeywords, ...rest }) => ({
                ...rest,
                updates: [],
                updatesFrom: 'none' as const,
            })),
            verifiedOn: VERIFIED_ON,
            fetchedAt: new Date().toISOString(),
            cached: false,
            ageSeconds: 0,
            degraded: true,
        })
    }
}

function json(body: unknown, status = 200) {
    return Response.json(body, {
        status,
        headers: { 'cache-control': status === 200 ? 'public, max-age=300' : 'no-store' },
    })
}

export const config: Config = {
    path: '/api/models',
}
