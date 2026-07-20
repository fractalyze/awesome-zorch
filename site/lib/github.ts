// GitHub fetches. Stars revalidate every 5 min via ISR (pages stay
// static-fast, numbers stop freezing at deploy time); READMEs still snapshot
// at build.
// Everything degrades gracefully: while a repo is still private (pre-launch)
// README/stars simply come back null.

function apiHeaders(accept: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

function ownerRepo(repoUrl: string): string | null {
  const m = repoUrl.match(/^https:\/\/github\.com\/([^/?#]+\/[^/?#]+)/);
  return m ? m[1] : null;
}

export async function fetchReadme(repoUrl: string): Promise<string | null> {
  const slug = ownerRepo(repoUrl);
  if (!slug) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}/readme`, {
      headers: apiHeaders("application/vnd.github.raw+json"),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export async function fetchStars(repoUrl: string): Promise<number | null> {
  const slug = ownerRepo(repoUrl);
  if (!slug) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}`, {
      headers: apiHeaders("application/vnd.github+json"),
      // ISR: serve the cached count, refresh server-side every 5 minutes.
      // (Client-side fetching was rejected: it leaks no token so it rides the
      // anonymous 60 req/h/IP limit, and the count pops in after paint.)
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { stargazers_count?: number };
    return json.stargazers_count ?? null;
  } catch {
    return null;
  }
}

export function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}
