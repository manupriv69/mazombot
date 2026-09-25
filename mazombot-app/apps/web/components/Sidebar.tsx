"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bot,
  GitBranch,
  Filter,
  CreditCard,
  Activity,
  Wallet,
  CircleUserRound,
} from "lucide-react";

// Ordem e rótulos exatamente como no protótipo original.
const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/bots", label: "Bots", icon: Bot },
  { href: "/fluxo", label: "Fluxo", icon: GitBranch },
  { href: "/funis", label: "Funis", icon: Filter },
  { href: "/gateways", label: "Gateways", icon: CreditCard },
  { href: "/traqueamento", label: "Traqueamento", icon: Activity },
  { href: "/gerar-pagamento", label: "Gerar Pagamento", icon: Wallet },
  { href: "/conta", label: "Minha Conta", icon: CircleUserRound },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground">
      <div className="mb-8 flex items-center gap-3 px-2">
        <Image src="/mz-logo.png" alt="MazomBot" width={32} height={32} className="rounded-md" />
        <div>
          <p className="font-display text-lg font-semibold leading-none text-neon-cyan">
            MazomBot
          </p>
          <p className="text-[10px] tracking-widest text-muted-foreground">SALES OS</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={18} className={isActive ? "text-neon-cyan" : ""} />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-neon-cyan" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
