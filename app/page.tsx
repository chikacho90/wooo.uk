import { cookies } from "next/headers";
import { verifySession, authCookie } from "@/lib/auth";
import CommandBar from "@/components/CommandBar";
import Egg from "@/components/Egg";
import ScrollLock from "@/components/ScrollLock";

export default async function Home() {
  const token = (await cookies()).get(authCookie.name)?.value;
  const session = await verifySession(process.env.SITE_SECRET || "", token);

  return (
    <main className="h-[100svh] w-full">
      <ScrollLock />
      {/* 알+워드마크: 화면 중앙에 고정 — 문서 스크롤/키보드에 안 딸려감 */}
      <div className="pointer-events-none fixed left-1/2 top-[50lvh] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-9">
        <Egg />
        <h1 className="select-none text-sm font-light tracking-[0.4em] text-neutral-600">
          woo.moi
        </h1>
      </div>
      <CommandBar authed={!!session} />
    </main>
  );
}
