import { Search, Calendar, Bell } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { SalesAreaChart } from "../components/SalesAreaChart";
import { PaymentsBarChart } from "../components/PaymentsBarChart";
import { TopList } from "../components/TopList";

// TODO: trocar pelos dados reais de GET /api/dashboard/overview,
// /top-bots e /top-gateways assim que a API estiver no ar.
// Os nomes de campo já batem com o que a rota devolve — é troca direta.
const overview = {
  salesToday: 4218,
  salesMonth: 82940,
  salesYear: 612300,
  revenue: 1040000,
  avgTicket: 87.4,
  conversionRate: 11.2,
  leadsTotal: 24812,
  activeCustomers: 6184,
  converted: 2781,
  lost: 1421,
};

const currency = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão global das suas operações</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Search size={16} />
            Buscar...
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <Calendar size={16} />
            Últimos 7 dias
          </button>
          <button className="rounded-lg border border-border bg-card p-2">
            <Bell size={16} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-4">
        <KpiCard label="Vendas hoje" value={currency(overview.salesToday)} delta="+18,2%" />
        <KpiCard label="Vendas do mês" value={currency(overview.salesMonth)} delta="+12,4%" />
        <KpiCard label="Vendas do ano" value={currency(overview.salesYear)} delta="+34,1%" />
        <KpiCard label="Faturamento" value={currency(overview.revenue)} delta="+22,8%" />
        <KpiCard label="Ticket médio" value={currency(overview.avgTicket)} delta="+4,1%" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Conversão geral" value={`${overview.conversionRate}%`} delta="+1,8%" />
        <KpiCard label="Total de leads" value={overview.leadsTotal.toLocaleString("pt-BR")} />
        <KpiCard label="Leads ativos" value={overview.activeCustomers.toLocaleString("pt-BR")} />
        <KpiCard label="Convertidos" value={overview.converted.toLocaleString("pt-BR")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-sm font-semibold">Vendas por dia</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Receita e leads nos últimos 14 dias
          </p>
          <SalesAreaChart />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-sm font-semibold">Pagamentos</h2>
          <p className="mb-4 text-xs text-muted-foreground">Gerados vs Aprovados</p>
          <PaymentsBarChart />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <TopList
          title="Top Bots Vendedores"
          items={[
            { name: "VendasPro Bot", sub: "Conv. 12,4%", value: "R$ 48.220" },
            { name: "Funil Black Bot", sub: "Conv. 10,8%", value: "R$ 36.780" },
            { name: "VIP Closer Bot", sub: "Conv. 9,2%", value: "R$ 28.140" },
          ]}
        />
        <TopList
          title="Top Funis"
          items={[
            { name: "Funil Black 7D", sub: "Conv. 14,1%", value: "R$ 31.420" },
            { name: "Funil VSL Pro", sub: "Conv. 11,9%", value: "R$ 22.110" },
            { name: "Funil Upsell", sub: "Conv. 8,7%", value: "R$ 18.300" },
          ]}
        />
        <TopList
          title="Top Gateways"
          items={[
            { name: "Omega Pay", sub: "", value: "R$ 62.100" },
            { name: "WiinPay", sub: "", value: "R$ 41.500" },
            { name: "SyncPay", sub: "", value: "R$ 28.900" },
          ]}
        />
      </div>
    </div>
  );
}
