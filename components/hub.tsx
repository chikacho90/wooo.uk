import Link from "next/link";
import CommandBar from "@/components/CommandBar";

// 히든 페이지 공통 셸 (상단바 + 커맨드바)
export function HubShell({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh px-5 pb-28 pt-14">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-baseline justify-between">
          <Link href="/" className="text-xs tracking-[0.3em] text-neutral-600 transition hover:text-neutral-400">
            woo.moi
          </Link>
          <span className="text-[10px] tracking-widest text-emerald-500/60">● 접속됨</span>
        </div>
        <h1 className="text-2xl font-light tracking-wide text-neutral-100">{title}</h1>
        {desc && <p className="mt-1.5 text-sm text-neutral-500">{desc}</p>}
        <div className="mt-8">{children}</div>
      </div>
      <CommandBar authed={true} />
    </main>
  );
}

// 대시보드 위젯 카드
export function WidgetCard({
  href,
  label,
  hint,
  stat,
  accent,
}: {
  href: string;
  label: string;
  hint: string;
  stat?: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 transition hover:border-neutral-700 hover:bg-neutral-900/70"
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-sm text-neutral-300">{label}</span>
        {stat != null && (
          <span className={`text-lg font-semibold ${accent ?? "text-neutral-100"}`}>{stat}</span>
        )}
      </div>
      <span className="mt-6 text-xs text-neutral-600 group-hover:text-neutral-500">{hint}</span>
    </Link>
  );
}

// 섹션 제목
export function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{title}</h2>
        {count != null && <span className="text-xs text-neutral-600">{count}</span>}
      </div>
      {children}
    </section>
  );
}

// 타입 배지 색
export const TYPE_COLOR: Record<string, string> = {
  Decision: "text-sky-400 bg-sky-500/10",
  Preference: "text-violet-400 bg-violet-500/10",
  Context: "text-neutral-400 bg-neutral-500/10",
  Reference: "text-amber-400 bg-amber-500/10",
  Todo: "text-emerald-400 bg-emerald-500/10",
  Idea: "text-pink-400 bg-pink-500/10",
};

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-800 px-5 py-8 text-center text-sm text-neutral-600">
      {children}
    </div>
  );
}
