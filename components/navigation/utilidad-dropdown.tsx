"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const utilidadLinks = [
  { href: "/utilidad/ban-list", label: "Ban List" },
  { href: "/utilidad/pbx-101", label: "PBX 101" },
  { href: "/utilidad/comunidad-vota", label: "La Comunidad Vota" },
];

export function UtilidadDropdown() {
  const pathname = usePathname();
  const isUtilidadActive = pathname.startsWith("/utilidad");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors duration-200",
          "text-muted-foreground hover:text-foreground",
          "outline-none focus-visible:ring-0",
          isUtilidadActive && "text-foreground"
        )}
      >
        Utilidad
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {utilidadLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <DropdownMenuItem key={link.href} asChild>
              <Link
                href={link.href}
                className={cn(
                  "w-full cursor-pointer",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}







