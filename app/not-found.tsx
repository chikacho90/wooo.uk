import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <p className="text-sm tracking-wide text-neutral-600">그런 페이지 없어요</p>
      <Link href="/" className="text-xs tracking-[0.3em] text-neutral-700 transition hover:text-neutral-500">
        woo.moi
      </Link>
    </main>
  );
}
