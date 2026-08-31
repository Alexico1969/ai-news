import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'
import { collectNews } from '../lib/news.mts'

/**
 * Keeps the cached feed warm so visitors almost always get an instant response
 * instead of waiting on ten upstream feeds.
 */
export default async () => {
    const payload = await collectNews()

    if (!payload.items.length) {
        console.warn('Scheduled refresh found no items; keeping the previous cache.')
        return
    }

    await getStore('news-cache').setJSON('latest-v1', payload)
    console.log(`Cached ${payload.items.length} stories from ${payload.sources.filter((s) => s.ok).length} sources.`)
}

export const config: Config = {
    schedule: '*/15 * * * *',
}
