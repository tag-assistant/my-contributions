// Precache script — fetches contributions for example users and saves as static JSON
// Run via: GITHUB_TOKEN=xxx node scripts/precache.js

const fs = require('fs');
const path = require('path');

const EXAMPLES = ['torvalds', 'sindresorhus', 'antfu', 'ljharb', 'gaearon', 'yyx990803', 'austenstone'];
const OUT_DIR = path.join(__dirname, '..', 'public', 'precache');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

async function ghFetch(url, retries = 3) {
  const headers = { Accept: 'application/json', 'User-Agent': 'my-contributions-precache' };
  if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });

  if (res.status === 403 || res.status === 429) {
    const resetHeader = res.headers.get('x-ratelimit-reset');
    const retryAfter = res.headers.get('retry-after');
    let waitMs = 60000; // default 60s

    if (retryAfter) {
      waitMs = parseInt(retryAfter) * 1000;
    } else if (resetHeader) {
      waitMs = Math.max((parseInt(resetHeader) * 1000) - Date.now() + 1000, 5000);
    }

    if (retries > 0) {
      console.log(`    ⏳ Rate limited, waiting ${Math.ceil(waitMs / 1000)}s...`);
      await sleep(waitMs);
      return ghFetch(url, retries - 1);
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${url}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchProfile(username) {
  const data = await ghFetch(`https://api.github.com/users/${username}`);
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

async function fetchContributions(username) {
  console.log(`  Fetching PRs for ${username}...`);
  const allPRs = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Yearly chunks to bypass 1k limit
  let emptyYears = 0;
  for (let y = currentYear; y >= currentYear - 15; y--) {
    const from = `${y}-01-01`;
    const to = y === currentYear ? now.toISOString().split('T')[0] : `${y}-12-31`;
    const q = encodeURIComponent(`type:pr author:${username} is:merged is:public -user:${username} merged:${from}..${to}`);
    let page = 1;
    let chunkItems = [];

    while (true) {
      const data = await ghFetch(`https://api.github.com/search/issues?q=${q}&sort=created&order=desc&per_page=100&page=${page}`);
      chunkItems.push(...data.items);
      if (data.items.length < 100 || chunkItems.length >= data.total_count || page >= 10) break;
      page++;
      await sleep(500);
    }

    allPRs.push(...chunkItems);
    console.log(`    ${y}: ${chunkItems.length} PRs (total: ${allPRs.length})`);

    if (chunkItems.length === 0) { emptyYears++; if (emptyYears >= 3) break; }
    else emptyYears = 0;
    await sleep(200);
  }

  // Dedupe
  const seen = new Set();
  const deduped = allPRs.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });

  // Group by repo
  const repoGroups = new Map();
  for (const item of deduped) {
    const fullName = item.repository_url.replace('https://api.github.com/repos/', '');
    if (!repoGroups.has(fullName)) repoGroups.set(fullName, []);
    repoGroups.get(fullName).push(item);
  }

  const contributions = [];
  const repoNames = Array.from(repoGroups.keys());
  console.log(`  Fetching details for ${repoNames.length} repos...`);

  for (const fullName of repoNames) {
    const [owner, repo] = fullName.split('/');
    const prs = repoGroups.get(fullName);

    try {
      const repoData = await ghFetch(`https://api.github.com/repos/${owner}/${repo}`);
      let languages = [];
      try {
        const langData = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
        languages = Object.keys(langData);
      } catch {}

      const prDetails = prs.map(pr => ({
        title: pr.title,
        number: pr.number,
        url: pr.html_url,
        mergedAt: pr.pull_request?.merged_at || pr.closed_at || pr.created_at,
        additions: 0,
        deletions: 0,
      }));

      const dates = prDetails.map(p => new Date(p.mergedAt).getTime());

      contributions.push({
        repo: {
          owner, name: repo, fullName,
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
    } catch {}

    await sleep(100);
  }

  contributions.sort((a, b) => b.repo.stars - a.repo.stars);
  return contributions;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const username of EXAMPLES) {
    console.log(`\nPrecaching ${username}...`);
    try {
      const profile = await fetchProfile(username);
      const contributions = await fetchContributions(username);
      const data = { profile, contributions, generatedAt: new Date().toISOString() };
      const outFile = path.join(OUT_DIR, `${username}.json`);
      fs.writeFileSync(outFile, JSON.stringify(data));
      const sizeMB = (Buffer.byteLength(JSON.stringify(data)) / 1024).toFixed(1);
      console.log(`  ✅ ${username}: ${contributions.length} repos, ${contributions.reduce((s, c) => s + c.prs.length, 0)} PRs (${sizeMB}KB)`);
    } catch (err) {
      console.error(`  ❌ ${username}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
