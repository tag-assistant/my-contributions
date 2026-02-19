export interface Contribution {
  repo: {
    owner: string;
    name: string;
    fullName: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
    avatarUrl: string;
    url: string;
  };
  prs: {
    title: string;
    number: number;
    url: string;
    mergedAt: string;
    additions: number;
    deletions: number;
  }[];
  totalCommits: number;
  languages: string[];
  firstContribution: string;
  lastContribution: string;
}

export interface UserProfile {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  url: string;
}

export interface HeroStats {
  totalRepos: number;
  combinedStars: number;
  totalPRs: number;
  languagesUsed: string[];
  topProject: Contribution | null;
}

export interface Badge {
  label: string;
  icon: string;
  color: string;
  description: string;
}
