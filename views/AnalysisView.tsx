import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Calendar, DollarSign, TrendingUp, Users, 
  PieChart, ArrowUpRight, ArrowDownRight, Filter 
} from 'lucide-react';
import { storageService } from '../services/storage';
import { Collaborator, Procedure, ServiceRecord, ServiceStatus } from '../types';
import clsx from 'clsx';

// --- Componentes Auxiliares ---

const StatCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <Icon className="text-primary-600 dark:text-primary-400" size={24} />
      </div>
      {trend && (
        <div className={clsx(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
          trend > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">{title}</h3>
      <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{subtext}</p>
    </div>
  </div>
);

// Gráfico de Barras Vertical Simples (CSS puro)
const SimpleBarChart = ({ data }: { data: { label: string, value: number, tooltip: string }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid div by zero

  return (
    <div className="h-64 flex items-end gap-2 pt-8">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
            {d.tooltip}
          </div>
          
          <div 
            className="w-full bg-primary-500 dark:bg-primary-600 rounded-t-sm hover:bg-primary-400 dark:hover:bg-primary-500 transition-all cursor-pointer min-h-[4px]"
            style={{ height: `${(d.value / maxValue) * 100}%` }}
          ></div>
          <div className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-2 truncate w-full">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Gráfico de Barras Horizontal (Ranking)
const HorizontalBarChart = ({ data, color = "bg-blue-500" }: { data: { label: string, value: number, displayValue: string }[], color?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">{d.label}</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">{d.displayValue}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className={clsx("h-full rounded-full transition-all duration-500", color)} 
              style={{ width: `${(d.value / maxValue) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const AnalysisView = () => {
  // Estado de Filtro
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [r, c, p] = await Promise.all([
          storageService.getRecords(),
          storageService.getCollaborators(),
          storageService.getProcedures()
        ]);
        setRecords(r);
        setCollabs(c);
        setProcedures(p);
      } catch (e) {
        console.error("Erro ao carregar dados de análise:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filtragem
  const filteredRecords = useMemo(() => {
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  }, [records, startDate, endDate]);

  const doneRecords = filteredRecords.filter(r => r.status === ServiceStatus.DONE);

  // --- KPIs ---
  const totalRevenue = doneRecords.reduce((acc, r) => acc + r.calculatedValue, 0);
  const totalServices = filteredRecords.length;
  const servicesDone = doneRecords.length;
  const servicesCancelled = totalServices - servicesDone;
  const avgTicket = servicesDone > 0 ? totalRevenue / servicesDone : 0;
  const efficiencyRate = totalServices > 0 ? Math.round((servicesDone / totalServices) * 100) : 0;

  // --- Gráfico: Faturamento Diário ---
  const dailyRevenueData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    
    // Inicializa todos os dias do intervalo com 0 (para o gráfico não ficar buraco)
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dailyMap.set(d.toISOString().split('T')[0], 0);
    }

    doneRecords.forEach(r => {
      const current = dailyMap.get(r.date) || 0;
      dailyMap.set(r.date, current + r.calculatedValue);
    });

    return Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, val]) => {
        const [y, m, d] = date.split('-');
        return {
          label: `${d}/${m}`,
          value: val,
          tooltip: `${d}/${m}: R$ ${val.toFixed(2)}`
        };
      });
  }, [startDate, endDate, doneRecords]);

  // --- Gráfico: Top Colaboradoras (Ranking) ---
  const collabRanking = useMemo(() => {
    const map = new Map<string, number>();
    doneRecords.forEach(r => {
      const name = collabs.find(c => c.id === r.collaboratorId)?.name || 'Desconhecido';
      map.set(name, (map.get(name) || 0) + r.calculatedValue);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1]) // Descending
      .slice(0, 5) // Top 5
      .map(([name, val]) => ({
        label: name,
        value: val,
        displayValue: `R$ ${val.toFixed(2)}`
      }));
  }, [doneRecords, collabs]);

  // --- Gráfico: Top Procedimentos (Volume) ---
  const procedureRanking = useMemo(() => {
    const map = new Map<string, number>();
    doneRecords.forEach(r => {
      const name = procedures.find(p => p.id === r.procedureId)?.name || 'Desconhecido';
      map.set(name, (map.get(name) || 0) + 1);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        label: name,
        value: count,
        displayValue: `${count} realizados`
      }));
  }, [doneRecords, procedures]);

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500">Carregando análise e estatísticas...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header e Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-primary-600 dark:text-primary-400" />
            Análise e Estatísticas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Visão detalhada do desempenho operacional e financeiro.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Início</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Fim</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
             <button className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg h-[38px] w-[38px] flex items-center justify-center transition-colors">
               <Filter size={18} />
             </button>
          </div>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Faturamento Total" 
          value={`R$ ${totalRevenue.toFixed(2)}`} 
          subtext="No período selecionado"
          icon={DollarSign}
        />
        <StatCard 
          title="Ticket Médio" 
          value={`R$ ${avgTicket.toFixed(2)}`} 
          subtext="Por atendimento realizado"
          icon={TrendingUp}
        />
        <StatCard 
          title="Total Atendimentos" 
          value={servicesDone} 
          subtext={`${servicesCancelled} cancelados/não feitos`}
          icon={Users}
        />
        <StatCard 
          title="Taxa de Eficiência" 
          value={`${efficiencyRate}%`} 
          subtext="Agendamentos concluídos"
          icon={PieChart}
          trend={efficiencyRate >= 90 ? 5 : efficiencyRate < 70 ? -5 : 0}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal - Timeline de Faturamento */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Evolução do Faturamento</h3>
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Diário</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Valores arrecadados por dia dentro do período.</p>
          
          {dailyRevenueData.length > 0 && dailyRevenueData.some(d => d.value > 0) ? (
            <SimpleBarChart data={dailyRevenueData} />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-lg">
              Sem dados financeiros no período
            </div>
          )}
        </div>

        {/* Coluna Lateral - Rankings */}
        <div className="space-y-6">
          {/* Top Colaboradoras */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Top Faturamento</h3>
            {collabRanking.length > 0 ? (
               <HorizontalBarChart data={collabRanking} color="bg-primary-500" />
            ) : (
               <p className="text-slate-400 text-sm">Nenhum dado disponível</p>
            )}
          </div>

          {/* Top Procedimentos */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Procedimentos Populares</h3>
            {procedureRanking.length > 0 ? (
               <HorizontalBarChart data={procedureRanking} color="bg-purple-500" />
            ) : (
               <p className="text-slate-400 text-sm">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};