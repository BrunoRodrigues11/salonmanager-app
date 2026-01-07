import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Edit2, Trash2, Save, X, Check, Inbox, Users, Scissors, DollarSign, Upload, FileSpreadsheet, Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Collaborator, Procedure, PriceConfig, Role, ProcedureCategory, 
  ServiceStatus 
} from '../types';
import { storageService } from '../services/storage';
import { SearchSelect } from '../components/ui/SearchSelect';
import clsx from 'clsx';

// --- Shared Components ---
const Button = ({ children, onClick, variant = 'primary', className, disabled }: any) => {
  const base = "px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600",
    secondary: "bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600",
    danger: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50",
    success: "bg-green-600 text-white hover:bg-green-700"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={clsx(base, styles[variant as keyof typeof styles], className)}>
      {children}
    </button>
  );
};

const Card = ({ title, children, action }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ">
    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description, action }: any) => (
  <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center animate-fade-in">
    <div className="bg-white dark:bg-slate-700 p-4 rounded-full mb-4 shadow-sm">
      <Icon size={48} className="text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
    {action}
  </div>
);

// --- Import Modal (Omitted for brevity as logic remains similar but implementation needs async adaptation if used) ---
// Simplified for this response to focus on API integration
const ImportModal = ({ isOpen, onClose }: any) => isOpen ? <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center text-white">Importação em massa requer adaptação da API.</div> : null;


// --- Collaborators View ---
export const CollaboratorView = () => {
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  // Use Partial for editing because ID might be missing on new items
  const [editing, setEditing] = useState<Partial<Collaborator> | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        storageService.getCollaborators(),
        storageService.getProcedures()
      ]);
      setCollabs(c);
      setProcedures(p);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const save = async (c: Partial<Collaborator>) => {
    if (!c.name) return;
    setLoading(true);
    try {
      if (c.id) {
        // Update
        await storageService.updateCollaborator(c.id, {
          name: c.name,
          role: c.role || Role.BOTH,
          active: c.active !== false,
          allowedProcedureIds: c.allowedProcedureIds || []
        });
      } else {
        // Create
        await storageService.createCollaborator({
          name: c.name,
          role: c.role || Role.BOTH,
          active: c.active !== false,
          allowedProcedureIds: c.allowedProcedureIds || []
        });
      }
      await loadData();
      setEditing(null);
    } catch (e) {
      alert("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if(!confirm('Tem certeza que deseja excluir?')) return;
    setLoading(true);
    try {
      await storageService.deleteCollaborator(id);
      await loadData();
    } catch (e) { alert("Erro ao excluir"); }
    finally { setLoading(false); }
  };

  if (loading && !collabs.length) return <div className="p-10 text-center">Carregando dados...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Colaboradoras</h1>
        <div className="flex gap-2">
          {/* Import disabled for now */}
          <Button onClick={() => setEditing({ name: '', role: Role.BOTH, active: true, allowedProcedureIds: [] })}>
            <Plus size={16} /> Nova
          </Button>
        </div>
      </div>

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      {editing && (
        <Card title={editing.id ? 'Editar Colaboradora' : 'Nova Colaboradora'}>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nome</label>
              <input 
                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white"
                value={editing.name} 
                onChange={e => setEditing({...editing, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Função</label>
                <select 
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white"
                  value={editing.role}
                  onChange={e => setEditing({...editing, role: e.target.value as Role})}
                >
                  {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Status</label>
                <select 
                  className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white"
                  value={editing.active ? 'true' : 'false'}
                  onChange={e => setEditing({...editing, active: e.target.value === 'true'})}
                >
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-slate-300">Procedimentos Habilitados</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-slate-300 dark:border-slate-600 p-4 rounded bg-slate-50 dark:bg-slate-700/50">
                {procedures.filter(p => p.active).map(proc => (
                  <label key={proc.id} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer text-slate-900 dark:text-slate-200">
                    <input 
                      type="checkbox"
                      checked={editing.allowedProcedureIds?.includes(proc.id)}
                      onChange={e => {
                        const current = editing.allowedProcedureIds || [];
                        const newIds = e.target.checked
                          ? [...current, proc.id]
                          : current.filter(id => id !== proc.id);
                        setEditing({...editing, allowedProcedureIds: newIds});
                      }}
                      className="rounded text-primary-600 focus:ring-primary-500 dark:bg-slate-600 dark:border-slate-500"
                    />
                    <span className="text-sm">{proc.name} <span className="text-xs text-slate-500 dark:text-slate-400">({proc.category})</span></span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => save(editing)} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {collabs.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="Nenhuma Colaboradora" 
          description="Cadastre as manicures e cabeleireiras do salão."
          action={
            <Button onClick={() => setEditing({ name: '', role: Role.BOTH, active: true, allowedProcedureIds: [] })}>
               <Plus size={16} /> Nova
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collabs.map(c => (
            <div key={c.id} className={clsx("bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-4 transition-colors", c.active ? "border-primary-500" : "border-slate-300 dark:border-slate-600 opacity-75")}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{c.name}</h3>
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">{c.role}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(c)} className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => remove(c.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {c.allowedProcedureIds?.length || 0} procedimentos habilitados
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Procedures View ---
export const ProcedureView = () => {
  const [procs, setProcs] = useState<Procedure[]>([]);
  const [editing, setEditing] = useState<Partial<Procedure> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const p = await storageService.getProcedures();
    setProcs(p);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const save = async (p: Partial<Procedure>) => {
    if (!p.name) return;
    setLoading(true);
    if (p.id) {
      await storageService.updateProcedure(p.id, {
        name: p.name,
        category: p.category || ProcedureCategory.MANICURE,
        active: p.active !== false
      });
    } else {
      await storageService.createProcedure({
        name: p.name,
        category: p.category || ProcedureCategory.MANICURE,
        active: p.active !== false
      });
    }
    await loadData();
    setEditing(null);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Procedimentos</h1>
        <Button onClick={() => setEditing({ name: '', category: ProcedureCategory.MANICURE, active: true })}>
          <Plus size={16} /> Novo
        </Button>
      </div>

      {editing && (
        <Card title={editing.id ? 'Editar Procedimento' : 'Novo Procedimento'}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nome</label>
              <input className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Categoria</label>
              <select className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={editing.category} onChange={e => setEditing({...editing, category: e.target.value as ProcedureCategory})}>
                {Object.values(ProcedureCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                  type="checkbox"
                  checked={editing.active !== false}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })}
                />
                <label>Ativo</label>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={() => save(editing)} disabled={loading}>Salvar</Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {procs.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="p-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                <td className="p-4 text-slate-500 dark:text-slate-400">{p.category}</td>
                <td className="p-4">
                  <span className={clsx("px-2 py-1 rounded text-xs", p.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300")}>
                    {p.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => setEditing({ ...p })}><Edit2 size={16} className="text-primary-600 dark:text-primary-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Prices View ---
export const PriceView = () => {
  const [prices, setPrices] = useState<PriceConfig[]>([]);
  const [procs, setProcs] = useState<Procedure[]>([]);
  const [editing, setEditing] = useState<Partial<PriceConfig> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [pr, pc] = await Promise.all([storageService.getPrices(), storageService.getProcedures()]);
    setPrices(pr);
    setProcs(pc);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const save = async (p: Partial<PriceConfig>) => {
    if (!p.procedureId) return;
    setLoading(true);
    if (p.id) {
      await storageService.updatePrice(p.id, {
        procedureId: p.procedureId,
        valueDone: p.valueDone || 0,
        valueNotDone: p.valueNotDone || 0,
        valueAdditional: p.valueAdditional || 0,
        active: true
      });
    } else {
      await storageService.createPrice({
        procedureId: p.procedureId,
        valueDone: p.valueDone || 0,
        valueNotDone: p.valueNotDone || 0,
        valueAdditional: p.valueAdditional || 0,
        active: true
      });
    }
    await loadData();
    setEditing(null);
    setLoading(false);
  };

  const getProcedureName = (id: string) => procs.find(p => p.id === id)?.name || 'Desconhecido';

  const handleNewConfig = () => {
    const usedIds = prices.map(p => p.procedureId);
    const available = procs.filter(p => !usedIds.includes(p.id));
    
    if (available.length === 0) {
      alert("Todos os procedimentos já possuem configuração.");
      return;
    }
    setEditing({
      procedureId: available[0].id,
      valueDone: 0,
      valueNotDone: 0,
      valueAdditional: 0,
      active: true
    });
  };

  const procedureOptions = useMemo(() => 
    procs.map(p => ({ label: p.name, value: p.id, subLabel: p.category })),
  [procs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Valores</h1>
        <Button onClick={handleNewConfig}>
          <Plus size={16} /> Nova
        </Button>
      </div>

      {editing && (
        <Card title={editing.id ? "Editar Valores" : "Configurar Valores"}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Procedimento</label>
              {editing.id ? (
                 <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                    {getProcedureName(editing.procedureId!)}
                 </div>
              ) : (
                <SearchSelect
                  options={procedureOptions}
                  value={editing.procedureId || ''}
                  onChange={val => setEditing({...editing, procedureId: val})}
                  placeholder="Selecione o procedimento..."
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Valor (Fez)</label>
              <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={editing.valueDone} onChange={e => setEditing({...editing, valueDone: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Valor (Não Fez)</label>
              <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={editing.valueNotDone} onChange={e => setEditing({...editing, valueNotDone: parseFloat(e.target.value) || 0})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Valor Adicional</label>
              <input type="number" step="0.01" className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={editing.valueAdditional} onChange={e => setEditing({...editing, valueAdditional: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => save(editing)} disabled={loading}>Salvar Valores</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </Card>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium">
            <tr>
              <th className="p-4">Procedimento</th>
              <th className="p-4">Valor (Fez)</th>
              <th className="p-4">Valor (N/Fez)</th>
              <th className="p-4">Adicional</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {prices.sort((a, b) => getProcedureName(a.procedureId).localeCompare(getProcedureName(b.procedureId))).map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="p-4 font-medium text-slate-900 dark:text-white">{getProcedureName(p.procedureId)}</td>
                <td className="p-4 font-mono text-green-600 dark:text-green-400">R$ {p.valueDone.toFixed(2)}</td>
                <td className="p-4 font-mono text-slate-500 dark:text-slate-400">R$ {p.valueNotDone.toFixed(2)}</td>
                <td className="p-4 font-mono text-primary-600 dark:text-primary-400">+ R$ {p.valueAdditional.toFixed(2)}</td>
                <td className="p-4 text-right">
                  <button onClick={() => setEditing({ ...p })} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded"><Edit2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
