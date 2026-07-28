/**
 * A throttled, retrying audio-buffer fetcher, for use as `smplr`'s
 * `AudioBuffersLoader` (`Sampler({ buffers: makeThrottledLoader(urls) })`).
 *
 * smplr's own built-in fetching kicks off every sample at once via
 * `Promise.all`, which can overwhelm slower connections, aggressive
 * per-origin connection caps, or flaky proxies — and a single fetch()
 * rejection there isn't caught, so one bad connection can take down the
 * whole batch. This loads a few at a time, retries once on failure, and
 * never throws: samples that still fail are just left out, exactly like
 * smplr's own "silently omit failed samples" contract.
 */
export function makeThrottledLoader(
  urls: Record<string, string>,
  opts: { concurrency?: number; retries?: number } = {},
): (context: BaseAudioContext, buffers: Record<string, AudioBuffer | undefined>) => Promise<void> {
  const concurrency = opts.concurrency ?? 4;
  const retries = opts.retries ?? 1;

  return async (context, buffers) => {
    const entries = Object.entries(urls);
    let cursor = 0;

    async function fetchOne(key: string, url: string): Promise<void> {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const arrayBuffer = await response.arrayBuffer();
          buffers[key] = await context.decodeAudioData(arrayBuffer);
          return;
        } catch {
          // fall through to retry, or give up silently after the last attempt
        }
      }
    }

    async function worker(): Promise<void> {
      while (cursor < entries.length) {
        const [key, url] = entries[cursor++];
        await fetchOne(key, url);
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()));
  };
}
