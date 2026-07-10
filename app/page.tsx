import { cookies } from "next/headers";
import { verifySession, authCookie } from "@/lib/auth";
import CommandBar from "@/components/CommandBar";

export default async function Home() {
  const token = (await cookies()).get(authCookie.name)?.value;
  const session = await verifySession(process.env.SITE_SECRET || "", token);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center">
      <h1 className="select-none text-sm font-light tracking-[0.4em] text-neutral-500">
        woo.moi
      </h1>
      <CommandBar authed={!!session} />
    </main>
  );
}
