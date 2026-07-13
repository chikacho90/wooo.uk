// 프로젝트 데이터 — GitHub(커밋·이슈) + Vercel(배포) 집계. 서버 전용.
import "server-only";

const GH = "https://api.github.com";
const OWNER = "chikacho90";

// repo 실제 이름 → 화면 표시 이름 (필요 시 오버라이드; 기본은 그대로)
const DISPLAY_NAMES: Record<string, string> = {};
export function displayName(repo: string): string {
  return DISPLAY_NAMES[repo] ?? repo;
}
// GitHub에 없는 프로젝트(회사 업무 등 로컬 전용) — 여기에 수동 등록하면 목록·상세·피드백에 뜬다.
// 커밋/이슈/배포 데이터는 없으므로 설명·작업위치만 보여준다.
export type ExternalProject = {
  name: string; // URL 슬러그
  title: string; // 표시 이름
  description: string;
  where: string; // 실제 작업 위치
  started: string; // 시작 시점(ISO)
};
export const EXTERNAL_PROJECTS: ExternalProject[] = [
  {
    name: "samsung-figma-plugin",
    title: "Samsung Figma Plugin",
    description: "삼성전자 표준 Asset Figma 플러그인 PoC (아이콘·글로서리)",
    where: "회사맥 ~/Desktop/2606_Samsung_FigmaPlugin",
    started: "2026-06-01",
  },
];
export function getExternalProject(name: string): ExternalProject | null {
  return EXTERNAL_PROJECTS.find((p) => p.name === name) ?? null;
}

const ghHeaders = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function gh<T>(path: string, revalidate = 120): Promise<T | null> {
  try {
    const r = await fetch(`${GH}${path}`, { headers: ghHeaders, next: { revalidate } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export type Repo = {
  name: string;
  description: string | null;
  pushed_at: string;
  private: boolean;
  html_url: string;
  open_issues_count: number;
  language: string | null;
};
export type Commit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } };
};
export type Issue = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  pull_request?: unknown;
};

// 진행중 프로젝트 = 최근 푸시 repo (아카이브·포크 제외)
// /user/repos = 인증 사용자 소유 repo (비공개 포함). /users/{owner}/repos 는 공개만.
export async function getProjects(): Promise<Repo[]> {
  const repos = await gh<Repo[]>(`/user/repos?affiliation=owner&sort=pushed&per_page=30`);
  if (!repos) return [];
  return repos
    .filter((r) => !(r as unknown as { archived?: boolean }).archived && !(r as unknown as { fork?: boolean }).fork)
    .slice(0, 18);
}

export async function getRepo(name: string): Promise<Repo | null> {
  return gh<Repo>(`/repos/${OWNER}/${name}`);
}

export async function getCommits(name: string, perPage = 30): Promise<Commit[]> {
  return (await gh<Commit[]>(`/repos/${OWNER}/${name}/commits?per_page=${perPage}`, 60)) ?? [];
}

export async function getIssues(name: string): Promise<Issue[]> {
  const all = (await gh<Issue[]>(`/repos/${OWNER}/${name}/issues?state=open&per_page=30`, 60)) ?? [];
  return all.filter((i) => !i.pull_request); // PR 제외한 순수 이슈
}

// 최근 8주 주간 커밋 수 (활동 그래프)
export async function getWeeklyActivity(name: string): Promise<number[]> {
  const commits = await getCommits(name, 100);
  const weeks = new Array(8).fill(0);
  const now = Date.now();
  const wk = 7 * 24 * 3600 * 1000;
  for (const c of commits) {
    const t = new Date(c.commit.author.date).getTime();
    const idx = Math.floor((now - t) / wk);
    if (idx >= 0 && idx < 8) weeks[7 - idx] += 1; // 오래된→최신 순
  }
  return weeks;
}

// ── Vercel 배포 상태
const V_TOKEN = process.env.VERCEL_API_TOKEN || "";
const V_TEAM = process.env.VERCEL_TEAM_ID || "";
export type Deploy = { uid: string; state: string; url: string; createdAt: number; commitMsg?: string };

export async function getDeployments(project: string, limit = 8): Promise<Deploy[]> {
  if (!V_TOKEN) return [];
  try {
    const r = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${project}&teamId=${V_TEAM}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${V_TOKEN}` }, next: { revalidate: 60 } },
    );
    if (!r.ok) return [];
    const d = await r.json();
    return (d.deployments ?? []).map((x: Record<string, unknown>) => ({
      uid: x.uid as string,
      state: x.state as string,
      url: x.url as string,
      createdAt: x.createdAt as number,
      commitMsg: (x.meta as Record<string, string>)?.githubCommitMessage,
    }));
  } catch {
    return [];
  }
}

// Vercel 프로젝트로 등록돼 있는 repo 이름들 (배포상태 붙일지 판단)
export async function getVercelProjectNames(): Promise<Set<string>> {
  if (!V_TOKEN) return new Set();
  try {
    const r = await fetch(`https://api.vercel.com/v9/projects?teamId=${V_TEAM}&limit=50`, {
      headers: { Authorization: `Bearer ${V_TOKEN}` },
      next: { revalidate: 300 },
    });
    if (!r.ok) return new Set();
    const d = await r.json();
    return new Set((d.projects ?? []).map((p: { name: string }) => p.name));
  } catch {
    return new Set();
  }
}
