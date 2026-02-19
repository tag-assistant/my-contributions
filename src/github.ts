import { Octokit } from '@octokit/rest';
import type { Contribution, UserProfile, HeroStats, Badge } from './types';
import { getCached, setCached, getRepoCached, setRepoCached } from './cache';

export type DateRange = 'all' | '1y' | '3y' | '5y';

export async function fetchUserProfile(token: string | null, username?: string): Promise<UserProfile> {
  const octokit = new Octokit({ auth: token || undefined });
  const { data } = username
    ? await octokit.users.getByUsername({ username })
    : await octokit.users.getAuthenticated();
  return {
    login: data.login,
    name: data.name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    followers: data.followers,
    following: data.following,
    publicRepos: data.public_repos,
    url: data.html_url,
  };
}

function getDateRangeFilter(range: DateRange): string {
  if (range === 'all') return '';
  const now = new Date();
  const years = range === '1y' ? 1 : range === '3y' ? 3 : 5;
  const from = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
  return ` merged:>=${from.toISOString().split('T')[0]}`;
}

function getYearlyChunks(): { from: string; to: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const chunks: { from: string; to: string }[] = [];
  // Go back 15 years max
  for (let y = currentYear; y >= currentYear - 15; y--) {
    chunks.push({
      from: `${y}-01-01`,
      to: y === currentYear ? now.toISOString().split('T')[0] : `${y}-12-31`,
    });
  }
  return chunks;
}

export async function fetchContributions(
  token: string | null,
  username: string,
  onProgress?: (msg: string, pct: number) => void,
  dateRange: DateRange = 'all'
): Promise<Contribution[]> {
  const octokit = new Octokit({ auth: token || undefined });
  const contributionMap = new Map<string, Contribution>();

  // Check localStorage cache first
  const cached = getCached<Contribution[]>('contributions', username, dateRange);
  if (cached) {
    onProgress?.('Loaded from cache!', 100);
    return cached;
  }

  // Check precached static data (for example profiles)
  if (dateRange === 'all') {
    try {
      const precacheUrl = `${import.meta.env.BASE_URL || '/'}precache/${username}.json`;
      const res = await fetch(precacheUrl);
      if (res.ok) {
        const precached = await res.json();
        onProgress?.('Loaded!', 100);
        setCached(precached.contributions, 'contributions', username, dateRange);
        return precached.contributions;
      }
    } catch { /* not precached, continue */ }
  }

  onProgress?.('Searching for merged pull requests...', 5);

  const allPRItems: any[] = [];

  if (dateRange === 'all') {
    // Use yearly chunks to bypass 1k search limit
    const chunks = getYearlyChunks();
    let emptyYearsInRow = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const dateFilter = ` merged:${chunk.from}..${chunk.to}`;
      const q = `type:pr author:${username} is:merged is:public -user:${username}${dateFilter}`;

      let page = 1;
      let chunkItems: any[] = [];

      while (true) {
        const { data } = await octokit.search.issuesAndPullRequests({
          q,
          sort: 'created',
          order: 'desc',
          per_page: 100,
          page,
        });

        chunkItems.push(...data.items);
        onProgress?.(
          `Scanning ${chunk.from.slice(0, 4)}... found ${allPRItems.length + chunkItems.length} PRs total`,
          5 + (i / chunks.length) * 65
        );

        if (data.items.length < 100 || chunkItems.length >= data.total_count) break;
        if (page >= 10) break; // 1k per chunk max
        page++;
        await sleep(200);
      }

      allPRItems.push(...chunkItems);

      if (chunkItems.length === 0) {
        emptyYearsInRow++;
        if (emptyYearsInRow >= 3) break; // Stop if 3 consecutive empty years
      } else {
        emptyYearsInRow = 0;
      }

      await sleep(100);
    }
  } else {
    // Single query with date filter
    const dateFilter = getDateRangeFilter(dateRange);
    const q = `type:pr author:${username} is:merged is:public -user:${username}${dateFilter}`;
    let page = 1;

    while (true) {
      const { data } = await octokit.search.issuesAndPullRequests({
        q,
        sort: 'created',
        order: 'desc',
        per_page: 100,
        page,
      });

      allPRItems.push(...data.items);
      onProgress?.(
        `Found ${allPRItems.length} of ${data.total_count} PRs...`,
        Math.min(10 + (allPRItems.length / Math.max(data.total_count, 1)) * 60, 70)
      );

      if (data.items.length < 100 || allPRItems.length >= data.total_count) break;
      if (page >= 10) break;
      page++;
      await sleep(200);
    }
  }

  onProgress?.(`Processing ${allPRItems.length} contributions...`, 75);

  // Deduplicate (yearly chunks may have overlap at boundaries)
  const seen = new Set<number>();
  const dedupedItems = allPRItems.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  // Group by repo and fetch repo details
  const repoGroups = new Map<string, any[]>();
  for (const item of dedupedItems) {
    const repoUrl = item.repository_url;
    const repoFullName = repoUrl.replace('https://api.github.com/repos/', '');
    if (!repoGroups.has(repoFullName)) repoGroups.set(repoFullName, []);
    repoGroups.get(repoFullName)!.push(item);
  }

  const repoNames = Array.from(repoGroups.keys());
  let processed = 0;

  for (const fullName of repoNames) {
    const [owner, repo] = fullName.split('/');
    const prs = repoGroups.get(fullName)!;

    try {
      // Check repo cache first
      const cachedRepo = getRepoCached(fullName);
      let repoData: any;
      let languages: string[];

      if (cachedRepo) {
        repoData = cachedRepo.repoData;
        languages = cachedRepo.languages;
      } else {
        const { data } = await octokit.repos.get({ owner, repo });
        repoData = data;

        languages = [];
        try {
          const { data: langData } = await octokit.repos.listLanguages({ owner, repo });
          languages = Object.keys(langData);
        } catch { /* ignore */ }

        setRepoCached(fullName, { repoData: { description: data.description, stargazers_count: data.stargazers_count, forks_count: data.forks_count, language: data.language, owner: { avatar_url: data.owner.avatar_url }, html_url: data.html_url }, languages });
      }

      const prDetails = prs.map((pr: any) => ({
        title: pr.title,
        number: pr.number,
        url: pr.html_url,
        mergedAt: pr.pull_request?.merged_at || pr.closed_at || pr.created_at,
        additions: 0,
        deletions: 0,
      }));

      const dates = prDetails.map((p: any) => new Date(p.mergedAt).getTime());

      contributionMap.set(fullName, {
        repo: {
          owner,
          name: repo,
          fullName,
          description: repoData.description,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          language: repoData.language,
          avatarUrl: repoData.owner.avatar_url,
          url: repoData.html_url,
        },
        prs: prDetails,
        totalCommits: prs.length,
        languages,
        firstContribution: new Date(Math.min(...dates)).toISOString(),
        lastContribution: new Date(Math.max(...dates)).toISOString(),
      });
    } catch {
      // Repo may have been deleted or made private
    }

    processed++;
    onProgress?.(`Fetching repo details... ${processed}/${repoNames.length}`, 75 + (processed / repoNames.length) * 20);
    await sleep(100);
  }

  onProgress?.('Done!', 100);

  // Sort by stars descending
  const results = Array.from(contributionMap.values()).sort((a, b) => b.repo.stars - a.repo.stars);

  // Cache results
  setCached(results, 'contributions', username, dateRange);

  return results;
}

export function computeHeroStats(contributions: Contribution[]): HeroStats {
  const allLanguages = new Set<string>();
  let totalPRs = 0;
  let combinedStars = 0;

  for (const c of contributions) {
    totalPRs += c.prs.length;
    combinedStars += c.repo.stars;
    c.languages.forEach(l => allLanguages.add(l));
  }

  return {
    totalRepos: contributions.length,
    combinedStars,
    totalPRs,
    languagesUsed: Array.from(allLanguages),
    topProject: contributions[0] || null,
  };
}

export function computeBadges(contributions: Contribution[], stats: HeroStats): Badge[] {
  const badges: Badge[] = [];

  if (stats.topProject && stats.topProject.repo.stars >= 50000) {
    badges.push({ label: '50k+ ⭐ Contributor', icon: '🏆', color: '#ffd700', description: `Contributed to ${stats.topProject.repo.fullName}` });
  } else if (stats.topProject && stats.topProject.repo.stars >= 10000) {
    badges.push({ label: '10k+ ⭐ Contributor', icon: '🌟', color: '#f0883e', description: `Contributed to ${stats.topProject.repo.fullName}` });
  } else if (stats.topProject && stats.topProject.repo.stars >= 1000) {
    badges.push({ label: '1k+ ⭐ Contributor', icon: '⭐', color: '#d29922', description: `Contributed to ${stats.topProject.repo.fullName}` });
  }

  if (stats.totalRepos >= 50) {
    badges.push({ label: 'Prolific Contributor', icon: '🔥', color: '#f85149', description: `${stats.totalRepos} projects contributed to` });
  } else if (stats.totalRepos >= 20) {
    badges.push({ label: 'Active Contributor', icon: '💪', color: '#58a6ff', description: `${stats.totalRepos} projects contributed to` });
  }

  if (stats.languagesUsed.length >= 10) {
    badges.push({ label: 'Polyglot', icon: '🌍', color: '#bc8cff', description: `${stats.languagesUsed.length} languages` });
  }

  if (stats.totalPRs >= 100) {
    badges.push({ label: 'PR Machine', icon: '🚀', color: '#3fb950', description: `${stats.totalPRs} merged PRs` });
  } else if (stats.totalPRs >= 25) {
    badges.push({ label: 'PR Veteran', icon: '📦', color: '#3fb950', description: `${stats.totalPRs} merged PRs` });
  }

  const hasMultiYears = contributions.some(c => {
    const first = new Date(c.firstContribution).getFullYear();
    const last = new Date(c.lastContribution).getFullYear();
    return last - first >= 3;
  });
  if (hasMultiYears) {
    badges.push({ label: 'Long-Term Contributor', icon: '🕰️', color: '#8b949e', description: 'Contributing for 3+ years' });
  }

  return badges;
}

export function getLanguageColor(lang: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Rust: '#dea584',
    Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600',
    Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF', PHP: '#4F5D95',
    Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c', Dart: '#00B4AB',
    Scala: '#c22d40', Elixir: '#6e4a7e', Haskell: '#5e5086', Lua: '#000080',
    Zig: '#ec915c', Vue: '#41b883', SCSS: '#c6538c', Svelte: '#ff3e00',
  };
  return colors[lang] || '#8b949e';
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
