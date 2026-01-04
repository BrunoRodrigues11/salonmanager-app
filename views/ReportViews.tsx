import React, { useState, useEffect, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { Download, Search, AlertCircle, Calendar, FileText, List } from 'lucide-react';
import { Collaborator, ServiceRecord, Procedure, ServiceStatus } from '../types';
import { storageService } from '../services/storage';
import { SearchSelect } from '../components/ui/SearchSelect';

export const ReportView = () => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [procs, setProcs] = useState<Procedure[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters
  const [selectedCollab, setSelectedCollab] = useState('');
  const [filterType, setFilterType] = useState<'month' | 'day'>('month');
  const [filterValue, setFilterValue] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reportType, setReportType] = useState<'detailed' | 'simple'>('detailed');

  const reportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [c, p, r] = await Promise.all([
          storageService.getCollaborators(),
          storageService.getProcedures(),
          storageService.getRecords()
        ]);
        setCollabs(c);
        setProcs(p);
        setRecords(r);
      } catch (e) {
        console.error("Erro ao carregar dados para relatórios:", e);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, []);

  // Filter Logic
  const filteredRecords = records.filter(r => {
    if (r.collaboratorId !== selectedCollab) return false;
    
    if (filterType === 'month') {
      return r.date.startsWith(filterValue); // YYYY-MM match
    } else {
      return r.date === filterValue; // YYYY-MM-DD match
    }
  }).sort((a, b) => a.date.localeCompare(b.date));

  const collabOptions = useMemo(() => 
    collabs.map(c => ({ label: c.name, value: c.id })),
  [collabs]);

  // --- Grouping Logic ---
  type DayGroup = {
    date: string;
    records: ServiceRecord[];
    totalValue: number;
    countDone: number;
    countNotDone: number;
  };

  const groupedRecords: DayGroup[] = [];
  const groupsMap = new Map<string, DayGroup>();

  filteredRecords.forEach(rec => {
    if (!groupsMap.has(rec.date)) {
      groupsMap.set(rec.date, { 
        date: rec.date, 
        records: [], 
        totalValue: 0,
        countDone: 0,
        countNotDone: 0
      });
    }
    const group = groupsMap.get(rec.date)!;
    group.records.push(rec);
    group.totalValue += rec.calculatedValue;
    
    if (rec.status === ServiceStatus.DONE) {
      group.countDone++;
    } else {
      group.countNotDone++;
    }
  });

  // Convert Map to Array and Sort by Date
  Array.from(groupsMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(g => groupedRecords.push(g));

  // --- Global Totals ---
  const totalValue = filteredRecords.reduce((acc, r) => acc + r.calculatedValue, 0);
  const totalDone = filteredRecords.filter(r => r.status === ServiceStatus.DONE).length;
  const totalNotDone = filteredRecords.filter(r => r.status === ServiceStatus.NOT_DONE).length;

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `relatorio-${reportType}-${collabName}-${filterValue}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar imagem.');
    } finally {
      setGenerating(false);
    }
  };

  const getProcName = (id: string) => procs.find(p => p.id === id)?.name || 'Desconhecido';
  const collabName = collabs.find(c => c.id === selectedCollab)?.name || '';

  if (loadingData) return <div className="p-10 text-center animate-pulse text-slate-500">Carregando dados...</div>;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
          <Search size={20} className="text-primary-600 dark:text-primary-400" /> Filtros do Relatório
        </h2>
        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Colaboradora</label>
            <SearchSelect
              options={collabOptions}
              value={selectedCollab}
              onChange={setSelectedCollab}
              placeholder="Selecione a colaboradora..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Tipo de Relatório</label>
            <div className="flex border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
              <button 
                className={`flex-1 p-2 text-sm flex items-center justify-center gap-1 transition-colors ${reportType === 'detailed' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 font-bold' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                onClick={() => setReportType('detailed')}
                title="Lista todos os procedimentos"
              >
                <List size={16} /> Detalhado
              </button>
              <button 
                className={`flex-1 p-2 text-sm flex items-center justify-center gap-1 transition-colors ${reportType === 'simple' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200 font-bold' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                onClick={() => setReportType('simple')}
                title="Apenas totais por dia"
              >
                <FileText size={16} /> Simples
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              {filterType === 'month' ? 'Mês de Referência' : 'Data Específica'}
            </label>
            <div className="flex gap-2">
              <button 
                 className={`p-2 rounded border transition-colors ${filterType === 'month' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'}`}
                 onClick={() => { setFilterType('month'); setFilterValue(new Date().toISOString().slice(0, 7)); }}
                 title="Filtrar por Mês"
              >
                Mês
              </button>
              <button 
                 className={`p-2 rounded border transition-colors ${filterType === 'day' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'}`}
                 onClick={() => { setFilterType('day'); setFilterValue(new Date().toISOString().split('T')[0]); }}
                 title="Filtrar por Dia"
              >
                Dia
              </button>
              <input 
                type={filterType === 'month' ? 'month' : 'date'}
                className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white"
                value={filterValue}
                onChange={e => setFilterValue(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={!selectedCollab || filteredRecords.length === 0 || generating}
            onClick={handleDownload}
            className="bg-primary-600 text-white p-2 rounded font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors dark:bg-primary-700 dark:hover:bg-primary-600 h-[42px]"
          >
            <Download size={18} />
            {generating ? '...' : 'PNG'}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      {!selectedCollab ? (
        <div className="text-center py-20 text-slate-400">Selecione uma colaboradora para visualizar o relatório.</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center gap-2">
          <AlertCircle size={32} className="text-slate-300 dark:text-slate-500" />
          <span>Nenhum lançamento encontrado para este período.</span>
        </div>
      ) : (
        <div className="overflow-auto bg-slate-200 dark:bg-slate-900 p-4 rounded-lg flex justify-center border border-slate-300 dark:border-slate-700">
          {/* Printable Area - ALWAYS LIGHT THEME FOR PNG EXPORT */}
          <div 
            id="report-content" 
            ref={reportRef}
            className="bg-white w-[800px] min-h-[600px] p-8 shadow-xl text-slate-800"
          >
            {/* Header */}
            <div className="border-b-2 border-primary-600 pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">{collabName}</h1>
                <p className="text-slate-500">Relatório {reportType === 'detailed' ? 'Detalhado' : 'Resumido (Diário)'}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Período de Referência</div>
                <div className="font-bold text-lg capitalize">
                  {filterType === 'month' 
                    ? new Date(filterValue + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    : new Date(filterValue + 'T12:00:00').toLocaleDateString('pt-BR')
                  }
                </div>
              </div>
            </div>

            {/* Table Content Switch */}
            {reportType === 'detailed' ? (
              // DETAILED TABLE
              <table className="w-full text-sm mb-8 border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-left bg-white">
                    <th className="py-2 pl-2 font-bold text-slate-700">Procedimento</th>
                    <th className="py-2 font-bold text-slate-700">Status</th>
                    <th className="py-2 font-bold text-slate-700">Observações</th>
                    <th className="py-2 pr-2 font-bold text-slate-700 text-right">Valor</th>
                  </tr>
                </thead>
                {groupedRecords.map((group) => (
                  <tbody key={group.date} className="border-b-4 border-transparent">
                    <tr className="bg-slate-100">
                      <td colSpan={4} className="py-2 px-3 font-bold text-primary-900 border-l-4 border-primary-500 flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(group.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                    </tr>
                    {group.records.map((rec) => (
                      <tr key={rec.id} className="border-b border-slate-100">
                        <td className="py-2 pl-3 font-medium text-slate-700">{getProcName(rec.procedureId)}</td>
                        <td className="py-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${rec.status === 'Fez' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-slate-500">
                          {rec.extras.length > 0 && (
                            <span className="font-semibold text-primary-600 mr-1">[{rec.extras.join(', ')}]</span>
                          )}
                          {rec.notes}
                        </td>
                        <td className="py-2 pr-2 text-right font-mono text-slate-800">R$ {rec.calculatedValue.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-primary-50/50">
                      <td colSpan={4} className="py-2 px-3 text-right">
                        <div className="flex justify-end items-center gap-4 text-xs text-slate-600">
                          <span><strong className="text-green-700">{group.countDone}</strong> Feitos</span>
                          <span className="border-r border-slate-300 h-3"></span>
                          <span><strong className="text-red-700">{group.countNotDone}</strong> N/Feitos</span>
                          <span className="border-r border-slate-300 h-3"></span>
                          <span className="font-bold text-sm text-primary-800">Total do Dia: R$ {group.totalValue.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                ))}
              </table>
            ) : (
              // SIMPLE TABLE (DAILY AGGREGATE)
              <table className="w-full text-sm mb-8 border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-left bg-white">
                    <th className="py-3 pl-2 font-bold text-slate-700 w-32">Data</th>
                    <th className="py-3 font-bold text-slate-700 w-32">Status</th>
                    <th className="py-3 font-bold text-slate-700">Observações / Adicionais</th>
                    <th className="py-3 pr-2 font-bold text-slate-700 text-right w-32">Total do Dia</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRecords.map((group) => {
                    // Aggregate Notes and Extras for the day
                    const dailyExtras = Array.from(new Set(group.records.flatMap(r => r.extras)));
                    const dailyNotes = group.records.filter(r => r.notes).map(r => r.notes);
                    const hasContent = dailyExtras.length > 0 || dailyNotes.length > 0;

                    return (
                      <tr key={group.date} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 pl-2 align-top">
                          <div className="font-bold text-slate-700">
                            {new Date(group.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {new Date(group.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                          </div>
                        </td>
                        <td className="py-4 align-top">
                          <div className="flex flex-col gap-1 items-start">
                            {group.countDone > 0 && (
                              <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                {group.countDone} Feitos
                              </span>
                            )}
                            {group.countNotDone > 0 && (
                              <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                {group.countNotDone} Não Fez
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 align-top text-slate-600 text-xs">
                          {!hasContent ? (
                            <span className="text-slate-300 italic">Sem observações</span>
                          ) : (
                            <div className="space-y-1">
                              {dailyExtras.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {dailyExtras.map(ex => (
                                    <span key={ex} className="border border-primary-100 bg-primary-50 text-primary-700 px-1.5 rounded">
                                      {ex}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {dailyNotes.length > 0 && (
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                                  {dailyNotes.map((note, idx) => (
                                    <li key={idx}>{note}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 pr-2 text-right align-top">
                          <div className="font-bold text-lg text-primary-800 font-mono bg-primary-50 px-2 py-1 rounded inline-block">
                            R$ {group.totalValue.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Footer Summary (Common for both) */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b border-slate-200 pb-2">Resumo Geral do Período</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-2 rounded border border-green-100">
                  <span className="block text-xs text-green-700 uppercase font-semibold">Procedimentos Feitos</span>
                  <span className="text-xl font-bold text-green-800">{totalDone}</span>
                </div>
                <div className="bg-red-50 p-2 rounded border border-red-100">
                  <span className="block text-xs text-red-700 uppercase font-semibold">Não Feitos / Cancelados</span>
                  <span className="text-xl font-bold text-red-800">{totalNotDone}</span>
                </div>
                <div className="bg-primary-50 p-2 rounded border border-primary-100">
                  <span className="block text-xs text-primary-700 uppercase font-semibold">Valor Total a Pagar</span>
                  <span className="text-xl font-bold text-primary-800">R$ {totalValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400 border-t pt-4">
              Gerado automaticamente pelo sistema SalonManager Pro em {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};