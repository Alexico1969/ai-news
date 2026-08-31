import { getStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'
import { collectNews, type NewsPayload } from '../lib/news.mts'

const STORE = 'news-cache'
const KEY = 'latest-v1'
const FRESH_FOR_MS = 15 * 60 * 1000
const MIN_REFRESH_INTERVAL_MS = 60 * 1000

function ageOf(payload: NewsPayload): number {
    return Date.now() - Date.parse(payload.fetchedAt)
}

export default async (req: Request, context: Context) => {
    const store = getStore(STORE)
    const forced = new URL(req.url).searchParams.get('refresh') === '1'

    let cached: NewsPayload | null = null
    try {
        cached = await store.get(KEY, { type: 'json' })
    } catch (error) {
        console.warn('Could not read news cache:', error)
    }

    if (cached?.items?.length) {
        const age = ageOf(cached)
        // Serve the cache while it is fresh, and also shield the upstream feeds
        // from a visitor repeatedly hitting refresh.
        if (age < FRESH_FOR_MS || (forced && age < MIN_REFRESH_INTERVAL_MS)) {
            return json({ ...cached, cached: true, ageSeconds: Math.round(age / 1000) })
        }
    }

    try {
        const payload = await collectNews()
        if (!payload.items.length) throw new Error('every source returned zero usable items')

        context.waitUntil(
            store.setJSON(KEY, payload).catch((error) => console.warn('Could not write news cache:', error)),
        )

        return json({ ...payload, cached: false, ageSeconds: 0 })
    } catch (error) {
        console.error('News refresh failed:', error)

        if (cached?.items?.length) {
            return json({
                ...cached,
                cached: true,
                stale: true,
                ageSeconds: Math.round(ageOf(cached) / 1000),
            })
        }

        return json({ error: 'Could not reach the news sources. Please try again shortly.' }, 503)
    }
}

function json(body: unknown, status = 200) {
    return Response.json(body, {
        status,
        headers: { 'cache-control': status === 200 ? 'public, max-age=60' : 'no-store' },
    })
}

export const config: Config = {
    path: '/api/ai-news',
}
