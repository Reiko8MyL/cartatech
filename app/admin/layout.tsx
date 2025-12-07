import { ReactNode } from "react";
import type { Metadata } from "next";
import { generateMetadata as genMeta } from "@/lib/metadata";

export const metadata: Metadata = genMeta({
  title: "Panel de Administración",
  description: "Panel de administración de CartaTech",
  path: "/admin",
  noindex: true, // No indexar páginas de administración
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

