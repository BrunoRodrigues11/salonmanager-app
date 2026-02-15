import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Activity, 
  Users, CheckCircle 
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Collaborator, Procedure, ServiceRecord, ServiceStatus } from '../types';
import clsx from 'clsx';

// --- HELPERS PARA DATA ---
// Garante que pegamos o Mês Local do usuário, não o UTC
const getCurrentMonthISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

// Formata data sem sofrer com fuso horário (D-1)
const formatDateSimple = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}`; // Apenas Dia/Mês para economizar espaço
};

// ... KPICard and ProgressBar components remain same ...
const KPICard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between transition-colors">
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
    </div>
    <div className={clsx("p-3 rounded-lg bg-opacity-10 dark:bg-opacity-20", colorClass.replace('text-', 'bg-').replace('600', '100'))}>
      <Icon className={colorClass} size={24} />
    </div>
  </div>
);

const ProgressBar = ({ label, value, total, color = "bg-primary-600" }: any) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-700 dark:text-slate-300 truncate w-32">{label}</span>
        <span className="text-slate-500 dark:text-slate-400">{value} ({percent}%)</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
        <div className={clsx("h-2.5 rounded-full", color)} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
};

export const DashboardView = () => {
  // Ajuste 1: Pega o mês local correto
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthISO()); 
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, c, p] = await Promise.all([
            storageService.getRecords(),
            storageService.getCollaborators(),
            storageService.getProcedures()
        ]);
        setRecords(r);
        setCollabs(c);
        setProcedures(p);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const monthRecords = useMemo(() => {
    return records.filter(r => r.date.startsWith(currentMonth));
  }, [records, currentMonth]);

  // Ajuste 2: Uso de Number() para garantir soma matemática correta
  const totalValue = monthRecords
    .filter(r => r.status === ServiceStatus.DONE)
    .reduce((acc, r) => acc + Number(r.calculatedValue), 0);

  const totalLostValue = monthRecords
    .filter(r => r.status === ServiceStatus.NOT_DONE)
    .reduce((acc, r) => acc + Number(r.calculatedValue), 0);

  const countDone = monthRecords.filter(r => r.status === ServiceStatus.DONE).length;
  const countNotDone = monthRecords.filter(r => r.status === ServiceStatus.NOT_DONE).length;
  const totalCount = monthRecords.length;

  const proceduresByType = useMemo(() => {
    const counts: Record<string, number> = {};
    monthRecords.forEach(r => {
      const pName = procedures.find(p => p.id === r.procedureId)?.name || 'Outro';
      counts[pName] = (counts[pName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [monthRecords, procedures]);

  const valueByCollab = useMemo(() => {
    const values: Record<string, number> = {};
    monthRecords.forEach(r => {
        const cName = collabs.find(c => c.id === r.collaboratorId)?.name || 'Desc.';
        // Ajuste 2: Number() aqui também
        values[cName] = (values[cName] || 0) + Number(r.calculatedValue);
    });
    return Object.entries(values).sort(([, a], [, b]) => b - a);
  }, [monthRecords, collabs]);

  const getCollabName = (id: string) => collabs.find(c => c.id === id)?.name || 'N/A';
  const getProcName = (id: string) => procedures.find(p => p.id === id)?.name || 'N/A';

  if (loading) return <div className="p-8 text-center animate-pulse">Carregando dashboard...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Visão Geral</h2>
        <input 
          type="month" 
          value={currentMonth} 
          onChange={e => setCurrentMonth(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm font-medium shadow-sm focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white"
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="A Pagar (Fez)" 
          value={`R$ ${totalValue.toFixed(2)}`} 
          subtext={`${countDone} realizados`}
          icon={DollarSign} 
          colorClass="text-green-600 dark:text-green-400" 
        />
        <KPICard 
          title="Não Realizado" 
          value={`R$ ${totalLostValue.toFixed(2)}`} 
          subtext={`${countNotDone} cancelados/não feitos`}
          icon={TrendingDown} 
          colorClass="text-red-500 dark:text-red-400" 
        />
        <KPICard 
          title="Total Procedimentos" 
          value={totalCount} 
          subtext="No período selecionado"
          icon={Activity} 
          colorClass="text-primary-600 dark:text-primary-400" 
        />
        <KPICard 
          title="Colaboradoras Ativas" 
          value={collabs.filter(c => c.active).length} 
          subtext="Cadastradas no sistema"
          icon={Users} 
          colorClass="text-blue-500 dark:text-blue-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Row of Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Procedure Distribution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-primary-600 dark:text-primary-400" />
                Top Procedimentos
              </h3>
              {proceduresByType.length === 0 ? <p className="text-slate-400 text-sm">Sem dados</p> : (
                <div className="space-y-1">
                  {proceduresByType.map(([name, count]) => (
                    <ProgressBar key={name} label={name} value={count} total={totalCount} color="bg-primary-500" />
                  ))}
                </div>
              )}
            </div>

            {/* Status Pie Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                Eficiência
              </h3>
              <div className="flex items-center justify-around">
                <div className="relative w-32 h-32 rounded-full" 
                  style={{ 
                    background: totalCount > 0 
                      ? `conic-gradient(#22c55e ${countDone / totalCount * 100}%, #f87171 0)`
                      : '#e2e8f0' 
                  }}>
                  <div className="absolute inset-0 m-auto w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center flex-col">
                    <span className="text-xs text-slate-400">Total</span>
                    <span className="font-bold text-slate-800 dark:text-white">{totalCount}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Fez: <b>{countDone}</b></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span>Não Fez: <b>{countNotDone}</b></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-yellow-500" />
                Ranking de Faturamento ({new Date(currentMonth + '-02T12:00:00').toLocaleDateString('pt-BR', { month: 'long' })})
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="p-4 text-left">Colaboradora</th>
                  <th className="p-4 text-right">Total Gerado</th>
                  <th className="p-4 w-1/3">Participação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {valueByCollab.length === 0 ? (
                  <tr><td colSpan={3} className="p-4 text-center text-slate-400">Sem lançamentos no período</td></tr>
                ) : valueByCollab.map(([name, value], i) => (
                  <tr key={name} className="dark:text-slate-200">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <span className={clsx(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        i === 0 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400" :
                        i === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300" :
                        i === 2 ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400" : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                      )}>
                        {i + 1}
                      </span>
                      {name}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-300">R$ {value.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(value / totalValue) * 100}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-50 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Últimos Lançamentos
            </h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700 overflow-y-auto max-h-[600px]">
            {records.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Nenhum histórico</div>
            ) : (
              records.slice(0, 8).map(r => (
                <div key={r.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{getProcName(r.procedureId)}</span>
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">R$ {Number(r.calculatedValue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>{getCollabName(r.collaboratorId)}</span>
                      <span>•</span>
                      {/* Ajuste 3: Data segura sem D-1 */}
                      <span>{formatDateSimple(r.date)}</span>
                    </div>
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded",
                      r.status === ServiceStatus.DONE ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    )}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};