import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bumblebee — woo.moi",
  description:
    "Talk to a bot that can't speak in his own words — he answers with movie lines, song lyrics, and famous phrases.",
};

export default function BumblebeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
