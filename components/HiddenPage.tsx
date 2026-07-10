import Link from "next/link";
import CommandBar from "@/components/CommandBar";

// 히든 하위페이지의 공통 셸 (Phase 2에서 각 위젯/내용으로 채움)
export default function HiddenPage({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="relative min-h-dvh px-6 py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-10 flex items-baseline justify-between">
          <Link href="/" className="text-xs tracking-[0.3em] text-neutral-600 transition hover:text-neutral-400">
            woo.moi
          </Link>
          <span className="text-[10px] tracking-widest text-emerald-500/60">● 접속됨</span>
        </div>
        <h1 className="text-2xl font-light tracking-wide text-neutral-100">{title}</h1>
        {desc && <p className="mt-2 text-sm text-neutral-500">{desc}</p>}
        <div className="mt-10">
          {children ?? (
            <div className="rounded-xl border border-dashed border-neutral-800 px-5 py-10 text-center text-sm text-neutral-600">
              곧 채워질 자리예요
            </div>
          )}
        </div>
      </div>
      <CommandBar authed={true} />
    </main>
  );
}
