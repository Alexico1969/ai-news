/**
 * Flagship model data for the four labs covered on the Models page.
 *
 * Every figure here was read off the vendor's own documentation or announcement
 * post on the date in VERIFIED_ON — the sources are linked per feature so a
 * reader (or the next person to update this file) can check them. Specs the
 * vendor does not publish are deliberately omitted rather than estimated.
 *
 * The page pairs this with live announcement feeds, so the "what shipped since"
 * column stays current on its own; this file needs a refresh when a lab
 * launches a new flagship.
 */

import type { Source } from './news.mts'

export const VERIFIED_ON = '2026-08-31'

export type Spec = { label: string; value: string }
export type Feature = { title: string; detail: string; date?: string; source?: string }
export type Variant = { name: string; role: string; current?: boolean }

export type Provider = {
    id: string
    name: string
    vendor: string
    hue: number
    model: {
        name: string
        apiId?: string
        released: string
        status: string
        tagline: string
    }
    specs: Spec[]
    features: Feature[]
    lineup: Variant[]
    note?: string
    links: { label: string; url: string }[]
    /** Official feed for this lab, where one exists, used for the live updates column. */
    officialFeed?: Source
    /** Used to pick this lab's stories out of the aggregated press feed. */
    matchKeywords: string[]
    /** Narrower terms naming this specific model, used to rank its stories first. */
    modelKeywords: string[]
}

export const PROVIDERS: Provider[] = [
    {
        id: 'google',
        name: 'Google',
        vendor: 'Google DeepMind',
        hue: 210,
        model: {
            name: 'Gemini 3.7 Flash',
            apiId: 'gemini-3.7-flash',
            released: 'August 13, 2026',
            status: 'Generally available',
            tagline: "Google's most intelligent workhorse model yet for coding and agents.",
        },
        specs: [
            { label: 'Model ID', value: 'gemini-3.7-flash' },
            { label: 'Released', value: 'Aug 13, 2026' },
            { label: 'Status', value: 'GA' },
            { label: 'Price / 1M', value: '$0.75 in · $3.75 out' },
            { label: 'After Jan 1, 2027', value: '$1.50 in · $7.50 out' },
            { label: 'Pro tier', value: 'Gemini 3.1 Pro (preview)' },
        ],
        features: [
            {
                title: 'Substantially stronger coding',
                detail: 'Better debugging and issue resolution than 3.6 Flash, with higher first-pass accuracy and more production-ready output. FrontierCode 1.1 rises to 43.6% from 34.4%, and DeepSWE v1.1 to 65.3% from 49.0%.',
                date: 'Aug 13, 2026',
                source: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/',
            },
            {
                title: 'Web apps from fewer prompts',
                detail: 'Builds more functional layouts and feature-complete apps with less prompting, scoring 1588 Elo on WebDev Arena against 1538 for 3.6 Flash.',
                date: 'Aug 13, 2026',
                source: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/',
            },
            {
                title: 'UI generation from a reference',
                detail: 'Follows a supplied screenshot, image or an entire design system closely when generating interfaces.',
                date: 'Aug 13, 2026',
                source: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/',
            },
            {
                title: 'More deliberate agent planning',
                detail: 'Applies more reasoning to multi-step planning and tool calls, asks clarifying questions about intent, and follows instructions more faithfully — Google frames this as needing less manual oversight and fewer retries.',
                date: 'Aug 13, 2026',
                source: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/',
            },
            {
                title: 'Denser domain reasoning',
                detail: 'Improved handling of finance, law and bioscience material. Complex document processing (GDP.pdf) reaches 34.0% from 22.0%, and AutomationBench, covering real business workflows, 30.4% from 17.0%.',
                date: 'Aug 13, 2026',
                source: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/',
            },
            {
                title: 'Now powers Gemini Spark',
                detail: 'The around-the-clock personal agent runs on 3.7 Flash for AI Pro and Ultra subscribers in more than 160 countries, with better Google Workspace tool use on multi-skill tasks.',
                date: 'Aug 13, 2026',
                source: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/',
            },
            {
                title: 'Refreshed Frontier Safety safeguards',
                detail: 'Ships with updated protections against CBRN and cyber-offence misuse while still allowing beneficial use, with a published model card.',
                date: 'Aug 13, 2026',
                source: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/',
            },
        ],
        lineup: [
            { name: 'Gemini 3.7 Flash', role: 'Newest model — coding and agents', current: true },
            { name: 'Gemini 3.1 Pro', role: 'Top reasoning tier, still in preview' },
            { name: 'Gemini Omni 1.1 Flash', role: 'Conversational video generation and editing (GA Aug 27)' },
            { name: 'Gemini 3.5 Flash-Lite', role: 'Low-latency, high-volume subagent work' },
        ],
        note: 'Google now ships Flash faster than Pro: 3.7 Flash arrived just three weeks after 3.6 Flash, while the Pro line is still on Gemini 3.1 Pro in preview. Two other models went GA the same fortnight — Gemini Omni 1.1 Flash for video, adding video extension, first/last-frame interpolation and 360p to 4K output, and Gemini 3.5 Transcribe for speech.',
        links: [
            { label: 'Announcement', url: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/' },
            { label: 'API changelog', url: 'https://ai.google.dev/gemini-api/docs/changelog' },
        ],
        officialFeed: { id: 'deepmind', name: 'Google DeepMind', url: 'https://deepmind.google/blog/rss.xml', kind: 'lab' },
        matchKeywords: ['gemini', 'deepmind', 'google ai'],
        modelKeywords: ['gemini 3.7'],
    },
    {
        id: 'openai',
        name: 'OpenAI',
        vendor: 'OpenAI',
        hue: 160,
        model: {
            name: 'GPT-5.6 Sol',
            released: 'July 9, 2026',
            status: 'Generally available',
            tagline: 'Frontier intelligence that scales with your ambition — the flagship of the GPT-5.6 family.',
        },
        specs: [
            { label: 'Released', value: 'Jul 9, 2026 (GA)' },
            { label: 'Previewed', value: 'Jun 26, 2026' },
            { label: 'Status', value: 'Flagship, generally available' },
            { label: 'Family', value: 'Sol · Terra · Luna' },
            { label: 'ChatGPT', value: 'Paid plans; Luna on free tier' },
        ],
        features: [
            {
                title: 'Frontier intelligence, frontier efficiency',
                detail: 'Positioned around more intelligence per token and stronger performance per dollar, with state-of-the-art results in coding, knowledge work, cybersecurity and science while spending fewer tokens.',
                date: 'Jul 29, 2026',
                source: 'https://openai.com/index/gpt-5-6-frontier-intelligence-efficiency',
            },
            {
                title: 'Ultrafast mode preview',
                detail: 'A new API service tier runs GPT-5.6 Sol up to 14× faster, reaching up to 750 output tokens per second, powered by Cerebras.',
                date: 'Aug 13, 2026',
                source: 'https://openai.com/index/previewing-ultrafast',
            },
            {
                title: 'Improved Sol in ChatGPT',
                detail: 'An updated Sol landed in ChatGPT with better accuracy and consistency, alongside expanded free-tier access to Luna including unlimited everyday chats.',
                date: 'Aug 6, 2026',
                source: 'https://openai.com/index/improving-gpt-5-6-sol-in-chatgpt',
            },
            {
                title: 'New agent capabilities in the Responses API',
                detail: 'OpenAI documented how to build faster, more cost-efficient agents on GPT-5.6 with smarter model selection across Sol, Terra and Luna plus new Responses API features.',
                date: 'Aug 13, 2026',
                source: 'https://openai.com/index/builders-guide-to-gpt-5-6',
            },
            {
                title: 'Sharp price cuts on the smaller tiers',
                detail: 'Luna dropped 80% and Terra 20%, pushing the price-performance frontier for high-volume enterprise workflows.',
                date: 'Jul 30, 2026',
                source: 'https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6',
            },
            {
                title: 'Strongest cybersecurity model to date',
                detail: 'Previewed with stronger coding, science and cybersecurity capability paired with OpenAI’s most advanced safety stack, aimed at defensive work such as threat modelling, code review and patching.',
                date: 'Jun 26, 2026',
                source: 'https://openai.com/index/previewing-gpt-5-6-sol',
            },
            {
                title: 'Default across Microsoft 365 Copilot',
                detail: 'Became the preferred model in Microsoft 365 Copilot, covering Word, Excel, PowerPoint, Chat and Cowork, and has since rolled out to developer tools including Kiro.',
                date: 'Jul 9, 2026',
                source: 'https://openai.com/index/gpt-5-6-preferred-model-microsoft-365-copilot',
            },
        ],
        lineup: [
            { name: 'GPT-5.6 Sol', role: 'Flagship for complex reasoning, coding and agents', current: true },
            { name: 'GPT-5.6 Terra', role: 'Balanced model for everyday work' },
            { name: 'GPT-5.6 Luna', role: 'Fastest and most cost-efficient; ChatGPT free-tier default' },
        ],
        note: 'OpenAI does not publish a context window for the GPT-5.6 family on its announcement pages, so none is listed here rather than guessed.',
        links: [
            { label: 'Announcement', url: 'https://openai.com/index/gpt-5-6' },
            { label: 'All GPT-5.6 posts', url: 'https://openai.com/news' },
        ],
        officialFeed: { id: 'openai', name: 'OpenAI', url: 'https://openai.com/news/rss.xml', kind: 'lab' },
        matchKeywords: ['openai', 'chatgpt', 'gpt-5', 'gpt‑5'],
        modelKeywords: ['gpt-5.6', 'gpt‑5.6'],
    },
    {
        id: 'anthropic',
        name: 'Claude',
        vendor: 'Anthropic',
        hue: 25,
        model: {
            name: 'Claude Opus 5',
            apiId: 'claude-opus-5',
            released: 'July 24, 2026',
            status: 'Active (latest)',
            tagline: 'For complex agentic coding and enterprise work — a step change over Opus 4.8.',
        },
        specs: [
            { label: 'Model ID', value: 'claude-opus-5' },
            { label: 'Released', value: 'Jul 24, 2026' },
            { label: 'Context window', value: '1M tokens' },
            { label: 'Max output', value: '128K (300K on Batch API beta)' },
            { label: 'Price / 1M', value: '$5 in · $25 out' },
            { label: 'Knowledge cutoff', value: 'May 2026' },
        ],
        features: [
            {
                title: 'Step change in deep reasoning',
                detail: 'The largest gains over Opus 4.8 are in deep reasoning, agentic and long-horizon tasks, and test-time compute scaling — at the same $5 / $25 pricing as its predecessor.',
                date: 'Jul 24, 2026',
                source: 'https://platform.claude.com/docs/en/models/opus-5/whats-new-opus-5',
            },
            {
                title: 'Adaptive thinking on by default',
                detail: 'Thinking is enabled out of the box and the model decides how much to use. Disabling it is only allowed at effort high or below — a breaking change for code written against Opus 4.8.',
                date: 'Jul 24, 2026',
                source: 'https://platform.claude.com/docs/en/build-with-claude/thinking',
            },
            {
                title: 'Effort is the primary control',
                detail: 'Supports the full ladder — low, medium, high, xhigh and max — with high as the default and max reserved for capability-critical work.',
                date: 'Jul 24, 2026',
                source: 'https://platform.claude.com/docs/en/build-with-claude/effort',
            },
            {
                title: 'Mid-conversation tool changes',
                detail: 'Tools can be added or removed between turns of a conversation while keeping the prompt cache intact, via the mid-conversation-tool-changes-2026-07-01 beta header.',
                date: 'Jul 24, 2026',
                source: 'https://platform.claude.com/docs/en/models/opus-5/whats-new-opus-5',
            },
            {
                title: 'Computer use and browser use toolsets',
                detail: 'The computer_toolset_20260801 and browser_toolset_20260801 toolsets became available for Opus 5 on the Claude API, and on Google Cloud the following day.',
                date: 'Aug 19, 2026',
                source: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool',
            },
            {
                title: 'Fast mode research preview',
                detail: 'A lower-latency Opus 5 is available on the Claude API as a research preview, priced separately from standard speed.',
                date: 'Jul 24, 2026',
                source: 'https://platform.claude.com/docs/en/build-with-claude/fast-mode',
            },
            {
                title: 'Supported by Dreams',
                detail: 'Anthropic’s Dreams research preview for managed agents added Opus 5 support a week after launch.',
                date: 'Aug 1, 2026',
                source: 'https://platform.claude.com/docs/en/managed-agents/dreams',
            },
        ],
        lineup: [
            { name: 'Claude Opus 5', role: 'Newest release — agentic coding and enterprise work', current: true },
            { name: 'Claude Fable 5', role: 'Highest available capability, for long-running agents' },
            { name: 'Claude Sonnet 5', role: 'Best balance of speed and intelligence' },
            { name: 'Claude Haiku 4.5', role: 'Fastest, with near-frontier intelligence' },
        ],
        note: 'Opus 5 is the newest Claude model and the recommended starting point, but Claude Fable 5 sits above it as the highest-capability model in the lineup at $10 / $50 per million tokens.',
        links: [
            { label: 'Model overview', url: 'https://platform.claude.com/docs/en/models/opus-5/overview' },
            { label: 'Announcement', url: 'https://www.anthropic.com/news/claude-opus-5' },
        ],
        matchKeywords: ['claude', 'anthropic'],
        modelKeywords: ['opus 5', 'claude opus'],
    },
    {
        id: 'xai',
        name: 'Grok',
        vendor: 'xAI',
        hue: 285,
        model: {
            name: 'Grok 4.6',
            apiId: 'grok-4.6',
            released: 'August 2026',
            status: 'Frontier model',
            tagline: 'Built for long-running agents and more ambitious interactive and visual work.',
        },
        specs: [
            { label: 'Model ID', value: 'grok-4.6' },
            { label: 'Released', value: 'Aug 2026' },
            { label: 'Context window', value: '500K tokens' },
            { label: 'Price / 1M', value: '$2 in · $6 out' },
            { label: 'Modalities', value: 'Text + image in, text out' },
            { label: 'Knowledge cutoff', value: 'Jan 2026' },
        ],
        features: [
            {
                title: 'Tuned for long-running agents',
                detail: 'Sustains multi-step work — research, analysis, codebase changes and building polished apps — rather than single exchanges.',
                date: 'Aug 2026',
                source: 'https://x.ai/news/grok-4-6',
            },
            {
                title: 'New xhigh reasoning effort',
                detail: 'Adds an xhigh setting above low, medium and high (the default), where Grok 4.5 topped out at high.',
                date: 'Aug 2026',
                source: 'https://docs.x.ai/developers/grok-4-6',
            },
            {
                title: 'Checks its own work',
                detail: 'On longer runs xAI observed more self-testing and verification, with the model validating results before moving on.',
                date: 'Aug 2026',
                source: 'https://x.ai/news/grok-4-6',
            },
            {
                title: 'Establishes visual structure in one pass',
                detail: 'Better first attempts on visual and interactive projects, setting an application’s structure and visual language in a single pass before refinement rounds.',
                date: 'Aug 2026',
                source: 'https://x.ai/news/grok-4-6',
            },
            {
                title: 'Matches GPT-5.6 Sol on the AA index',
                detail: 'Scores 61 on the Artificial Analysis Intelligence Index, level with GPT-5.6 Sol and up from 56 for Grok 4.5. DeepSWE v1.1 rises to 65.9% from 54%, Terminal-Bench v3.0 to 26% from 15.7%, and APEX-Agents to 57.5% from 47.1%.',
                date: 'Aug 2026',
                source: 'https://x.ai/news/grok-4-6',
            },
            {
                title: 'Built-in tools and no output cap',
                detail: 'Supports function calling, web search, X search and code execution across the Responses API and Chat Completions, with no stated limit on generated text length.',
                date: 'Aug 2026',
                source: 'https://docs.x.ai/developers/grok-4-6',
            },
            {
                title: 'Widest-ever pre-deployment testing',
                detail: 'Safeguards were recalibrated to the model’s capabilities, with what xAI calls its broadest pre-deployment test suite plus post-deployment and third-party evaluation.',
                date: 'Aug 2026',
                source: 'https://x.ai/news/grok-4-6',
            },
        ],
        lineup: [
            { name: 'Grok 4.6', role: 'Frontier model for coding, agents and knowledge work', current: true },
            { name: 'Grok 4.5', role: 'Previous flagship, 1.5T-parameter mixture of experts' },
            { name: 'Grok Build', role: 'Terminal coding agent, defaults to Grok 4.6' },
            { name: 'Grok 4.3', role: '1M context with native video input' },
        ],
        note: 'xAI’s release notes date Grok 4.6 only to the month, so no day is given here. Input above 200K prompt tokens is billed at a higher tier, and a fast variant costs double the standard rate.',
        links: [
            { label: 'Announcement', url: 'https://x.ai/news/grok-4-6' },
            { label: 'API docs', url: 'https://docs.x.ai/developers/grok-4-6' },
        ],
        matchKeywords: ['grok', 'xai', 'x.ai'],
        modelKeywords: ['grok 4.6'],
    },
]
