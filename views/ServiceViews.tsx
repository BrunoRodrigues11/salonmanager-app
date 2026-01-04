import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, CheckCircle, XCircle, Search, ClipboardX, X, Clock, User, Scissors, Tag, FileText, DollarSign } from 'lucide-react';
import { 
  Collaborator, Procedure, PriceConfig, ServiceRecord, ServiceStatus, EXTRA_OPTIONS 
} from '../types';
import { storageService } from '../services/storage';
import { SearchSelect } from '../components/ui/SearchSelect';
import clsx from 'clsx';

function formatDateBR(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export const ServiceEntryView = () => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [prices, setPrices] = useState<PriceConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCollab, setSelectedCollab] = useState('');
  const [selectedProc, setSelectedProc] = useState('');
  const [status, setStatus] = useState<ServiceStatus>(ServiceStatus.DONE);
  const [extras, setExtras] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [calculatedValue, setCalculatedValue] = useState(0);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [c, p, pr] = await Promise.all([
        storageService.getCollaborators(),
        storageService.getProcedures(),
        storageService.getPrices()
      ]);
      setCollabs(c);
      setProcedures(p);
      setPrices(pr);
      setLoading(false);
    };
    init();
  }, []);

  const availableProcedures = useMemo(() => {
    if (!selectedCollab) return [];
    const collab = collabs.find(c => c.id === selectedCollab);
    if (!collab) return [];
    
    // Check if property exists (it comes from a join in API)
    if (!collab.allowedProcedureIds) return procedures.filter(p => p.active);

    return procedures
      .filter(p => collab.allowedProcedureIds.includes(p.id))
      .filter(p => p.active);
  }, [selectedCollab, collabs, procedures]);

  const collabOptions = useMemo(() => 
    collabs.filter(c => c.active).map(c => ({ label: c.name, value: c.id, subLabel: c.role })),
  [collabs]);

  const procedureOptions = useMemo(() => 
    availableProcedures.map(p => ({ label: p.name, value: p.id, subLabel: p.category })),
  [availableProcedures]);

  useEffect(() => {
    if (!selectedProc) {
      setCalculatedValue(0);
      return;
    }
    const priceConfig = prices.find(p => p.procedureId === selectedProc);
    if (!priceConfig) {
      setCalculatedValue(0);
      return;
    }

    let val = status === ServiceStatus.DONE ? priceConfig.valueDone : priceConfig.valueNotDone;
    if (extras.length > 0) val += priceConfig.valueAdditional;
    setCalculatedValue(val);
  }, [selectedProc, status, extras, prices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollab || !selectedProc) return;

    setLoading(true);
    try {
      await storageService.createRecord({
        date,
        collaboratorId: selectedCollab,
        procedureId: selectedProc,
        status,
        extras,
        notes,
        calculatedValue,
      });

      setSelectedProc('');
      setExtras([]);
      setNotes('');
      setStatus(ServiceStatus.DONE);
      alert("Lançamento salvo com sucesso!");
    } catch (err) {
      alert("Erro ao salvar lançamento.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !collabs.length) return <div className="text-center p-8">Carregando formulário...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-primary-100 dark:border-slate-700 p-6 transition-colors">
        <h2 className="text-xl font-bold text-primary-900 dark:text-primary-300 mb-6 flex items-center gap-2">
          <Plus className="bg-primary-100 dark:bg-primary-900/50 p-1 rounded-full text-primary-600 dark:text-primary-400" size={24} />
          Novo Lançamento
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
            <input 
              type="date" 
              required
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 p-2.5"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Colaboradora</label>
            <SearchSelect
              options={collabOptions}
              value={selectedCollab}
              onChange={(val) => {
                setSelectedCollab(val);
                setSelectedProc('');
              }}
              placeholder="Busque a colaboradora..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Procedimento</label>
            <SearchSelect
              options={procedureOptions}
              value={selectedProc}
              onChange={setSelectedProc}
              placeholder={selectedCollab ? "Busque o procedimento..." : "Selecione Colaboradora Primeiro"}
              disabled={!selectedCollab}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className={clsx(
              "border rounded-lg p-3 cursor-pointer text-center transition-all",
              status === ServiceStatus.DONE 
                ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 font-bold" 
                : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 dark:border-slate-600"
            )}>
              <input type="radio" className="hidden" name="status" checked={status === ServiceStatus.DONE} onChange={() => setStatus(ServiceStatus.DONE)} />
              Fez
            </label>
            <label className={clsx(
              "border rounded-lg p-3 cursor-pointer text-center transition-all",
              status === ServiceStatus.NOT_DONE 
                ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400 font-bold" 
                : "bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 dark:border-slate-600"
            )}>
              <input type="radio" className="hidden" name="status" checked={status === ServiceStatus.NOT_DONE} onChange={() => setStatus(ServiceStatus.NOT_DONE)} />
              Não Fez
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Adicionais</label>
            <div className="space-y-2">
              {EXTRA_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="rounded text-primary-600 focus:ring-primary-500 dark:bg-slate-700 dark:border-slate-500"
                    checked={extras.includes(opt)}
                    onChange={e => {
                      setExtras(prev => e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt));
                    }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
            <textarea 
              className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm p-2.5"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Valor Calculado</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">R$ {calculatedValue.toFixed(2)}</div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary-600 dark:bg-primary-700 text-white py-3 rounded-lg font-bold hover:bg-primary-700 dark:hover:bg-primary-600 shadow-md transition-colors disabled:opacity-50">
            {loading ? 'Salvando...' : 'Confirmar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ... RecordDetailModal component remains same, omitted for brevity ...
const RecordDetailModal = ({ record, onClose, onDelete, getCollabName, getProcName }: any) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
         <div className="flex justify-between mb-4">
            <h3 className="font-bold text-lg dark:text-white">Detalhes</h3>
            <button onClick={onClose}><X /></button>
         </div>
         <p className="dark:text-slate-300">Colaboradora: {getCollabName(record.collaboratorId)}</p>
         <p className="dark:text-slate-300">Procedimento: {getProcName(record.procedureId)}</p>
         <p className="dark:text-slate-300">Valor: R$ {record.calculatedValue}</p>
         <div className="mt-4 flex justify-end">
            <button onClick={() => { onDelete(record.id); onClose(); }} className="text-red-500 flex gap-2"><Trash2 size={16}/> Excluir</button>
         </div>
      </div>
  </div>
);

export const HistoryView = () => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingRecord, setViewingRecord] = useState<ServiceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [r, c, p] = await Promise.all([
      storageService.getRecords(),
      storageService.getCollaborators(),
      storageService.getProcedures()
    ]);
    setRecords(r);
    setCollabs(c);
    setProcedures(p);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const deleteRecord = async (id: string) => {
    await storageService.deleteRecord(id);
    loadData();
  };

  const getCollabName = (id: string) => collabs.find(c => c.id === id)?.name || 'N/A';
  const getProcName = (id: string) => procedures.find(p => p.id === id)?.name || 'N/A';

  const filteredRecords = records.filter(rec => {
    const term = searchTerm.toLowerCase();
    return (
      getCollabName(rec.collaboratorId).toLowerCase().includes(term) ||
      getProcName(rec.procedureId).toLowerCase().includes(term) ||
      rec.date.includes(term)
    );
  });

  if (loading) return <div className="p-8 text-center">Carregando histórico...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="text-primary-600 dark:text-primary-400" size={28} /> 
          Histórico de Procedimentos
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center animate-fade-in">
          <div className="bg-white dark:bg-slate-700 p-4 rounded-full mb-4 shadow-sm">
            <ClipboardX size={48} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum lançamento ainda'}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map(rec => (
            <div 
              key={rec.id} 
              onClick={() => setViewingRecord(rec)}
              className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary-300 dark:hover:border-primary-500 transition-all cursor-pointer hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
                    {formatDateBR(rec.date)}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{getCollabName(rec.collaboratorId)}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{getProcName(rec.procedureId)}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1", 
                    rec.status === ServiceStatus.DONE ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  )}>
                    {rec.status === ServiceStatus.DONE ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                    {rec.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t dark:border-slate-700 md:border-t-0 pt-3 md:pt-0 mt-3 md:mt-0">
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Valor</div>
                  <div className="font-bold text-lg text-slate-800 dark:text-white">R$ {rec.calculatedValue.toFixed(2)}</div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    if(confirm('Excluir?')) deleteRecord(rec.id);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingRecord && (
        <RecordDetailModal 
          record={viewingRecord} 
          onClose={() => setViewingRecord(null)} 
          onDelete={deleteRecord}
          getCollabName={getCollabName}
          getProcName={getProcName}
        />
      )}
    </div>
  );
};
