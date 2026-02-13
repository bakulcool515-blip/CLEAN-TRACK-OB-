import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HousekeepingTask, FilterPeriod, TaskStatus, AreaItem } from './types';
import { StatsCard } from './components/StatsCard';
import { TaskForm } from './components/TaskForm';
import { AreaManager } from './components/AreaManager';
import { filterTasks, formatDate, getWeekRange } from './utils/dateUtils';
import { exportToExcel, exportToPdf } from './utils/exportUtils';
import { storageService } from './services/storageService';

const App = () => {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [availableAreas, setAvailableAreas] = useState<AreaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('daily');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<HousekeepingTask | undefined>(undefined);
  
  const [isAreaManagerOpen, setIsAreaManagerOpen] = useState(false);
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const [fetchedTasks, fetchedAreas] = await Promise.all([
        storageService.fetchTasks(),
        storageService.fetchAreas()
      ]);
      setTasks(fetchedTasks || []);
      setAvailableAreas(fetchedAreas || []);
      setIsLoading(false);
    };
    initData();
  }, []);

  const filteredTasks = useMemo(() => 
    filterTasks(tasks, filterPeriod, currentDate), 
  [tasks, filterPeriod, currentDate]);

  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      completed: filteredTasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.INSPECTED).length,
      pending: filteredTasks.filter(t => t.status === TaskStatus.PENDING).length,
      inProgress: filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    };
  }, [filteredTasks]);

  const handleAddTask = async (newTask: HousekeepingTask) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === newTask.id ? newTask : t));
    } else {
      setTasks([newTask, ...tasks]);
    }
    await storageService.upsertTask(newTask);
    setEditingTask(undefined);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this report?')) {
      setTasks(tasks.filter(t => t.id !== id));
      await storageService.deleteTask(id);
    }
  };

  const handleExport = () => exportToExcel(filteredTasks, `Report_${filterPeriod}_${currentDate}`);
  const handleExportPdf = () => exportToPdf(filteredTasks, `Housekeeping Report ${filterPeriod.toUpperCase()}`, `Report_${filterPeriod}_${currentDate}`);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800';
      case TaskStatus.INSPECTED: return 'bg-blue-100 text-blue-800';
      case TaskStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-800';
      case TaskStatus.PENDING: return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900 z-[100]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-blue-100 font-bold tracking-widest text-xs uppercase">Initialising CleanTrack</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 bg-slate-900 text-white flex-col flex-shrink-0">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3">
            <span className="p-1.5 bg-blue-500 rounded-lg">✨</span>
            CLEANTRACK
          </h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {['daily', 'weekly', 'monthly', 'yearly', 'all'].map((p) => (
            <button 
              key={p}
              onClick={() => { setFilterPeriod(p as FilterPeriod); if(p === 'daily') setCurrentDate(new Date().toISOString().split('T')[0]); }}
              className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all flex items-center gap-4 capitalize text-sm font-bold ${filterPeriod === p ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span className="text-xl">{p === 'daily' ? '📅' : p === 'weekly' ? '📆' : p === 'monthly' ? '🗓️' : '📊'}</span>
              {p} Report
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
           <button onClick={() => setIsAreaManagerOpen(true)} className="w-full text-slate-400 hover:text-white flex items-center gap-3 text-sm font-bold transition-colors">
            ⚙️ Settings & Areas
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white p-5 pt-7 sticky top-0 z-30 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-lg font-black tracking-tighter">CLEANTRACK</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Housekeeping AI</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsAreaManagerOpen(true)} className="p-2 bg-slate-800 rounded-full">⚙️</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 main-content overflow-x-hidden">
        {/* Android Date Picker & Quick Actions Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{filterPeriod} Report</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                {filterPeriod === 'daily' ? formatDate(currentDate) : filterPeriod}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 scroll-hide">
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-white border-0 shadow-sm rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            />
            <button onClick={handleExport} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 shrink-0">🟢 Excel</button>
            <button onClick={handleExportPdf} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 shrink-0">🔴 PDF</button>
          </div>
        </div>

        {/* Material Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatsCard title="Total" value={stats.total} icon="📝" colorClass="bg-blue-600 shadow-blue-200" />
          <StatsCard title="Done" value={stats.completed} icon="✅" colorClass="bg-emerald-600 shadow-emerald-200" />
          <StatsCard title="Wait" value={stats.pending} icon="⏳" colorClass="bg-rose-600 shadow-rose-200" />
          <StatsCard title="Progress" value={stats.inProgress} icon="⚡" colorClass="bg-amber-600 shadow-amber-200" />
        </div>

        {/* Task Feed (Android List View) */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Job History</h3>
          {filteredTasks.length === 0 ? (
             <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
               <span className="text-4xl block mb-4">📭</span>
               <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No reports for this period</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="bg-white p-4 md:p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col gap-4 android-card">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-lg shadow-inner">
                        {task.area.toString().toLowerCase().includes('lobby') ? '🏢' : 
                         task.area.toString().toLowerCase().includes('pool') ? '🏊' : '🧹'}
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 leading-none">{task.area}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{task.category} • {task.assignee}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 font-medium px-1">{task.jobDescription}</p>

                  <div className="grid grid-cols-3 gap-2">
                    {['photoBefore', 'photoProgress', 'photoAfter'].map((key) => {
                      const url = task[key as keyof HousekeepingTask] as string;
                      const label = key.replace('photo', '').toUpperCase();
                      return url ? (
                        <div key={key} onClick={() => setViewPhotoUrl(url)} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group">
                          <img src={url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 group-active:bg-black/40 transition-colors"></div>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-[6px] text-white px-1.5 py-0.5 rounded-full font-black">{label}</div>
                        </div>
                      ) : (
                        <div key={key} className="aspect-[4/3] bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[7px] text-slate-300 font-black uppercase">{label}</div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Updated {formatDate(task.date)}</div>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditingTask(task); setIsFormOpen(true); }} className="p-2.5 bg-blue-50 text-blue-600 rounded-full active:scale-90 transition-transform">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                       </button>
                       <button onClick={() => handleDelete(task.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-full active:scale-90 transition-transform">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Android FAB */}
      <button 
        onClick={() => { setEditingTask(undefined); setIsFormOpen(true); }}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-blue-600 text-white rounded-[22px] shadow-2xl flex items-center justify-center text-3xl z-40 active:scale-90 transition-transform shadow-blue-600/40"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
      </button>

      {/* Android Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center h-20 px-4 pb-2 z-40 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)]">
        {[
          { id: 'daily', icon: '📅', label: 'Day' },
          { id: 'weekly', icon: '📆', label: 'Week' },
          { id: 'monthly', icon: '🗓️', label: 'Month' },
          { id: 'all', icon: '📂', label: 'History' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => { setFilterPeriod(item.id as FilterPeriod); if(item.id === 'daily') setCurrentDate(new Date().toISOString().split('T')[0]); }}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`px-5 py-1.5 rounded-2xl transition-all ${filterPeriod === item.id ? 'bg-blue-100 text-blue-600' : 'text-slate-400 group-active:bg-slate-100'}`}>
              <span className="text-xl">{item.icon}</span>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${filterPeriod === item.id ? 'text-blue-600' : 'text-slate-400'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <TaskForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleAddTask}
        initialData={editingTask}
        availableAreas={availableAreas}
      />

      <AreaManager 
        isOpen={isAreaManagerOpen}
        onClose={() => setIsAreaManagerOpen(false)}
        areas={availableAreas}
        onAdd={async (a) => { setAvailableAreas([...availableAreas, a]); await storageService.upsertArea(a); }}
        onDelete={async (n) => { setAvailableAreas(availableAreas.filter(a => a.name !== n)); await storageService.deleteArea(n); }}
        onEdit={async (o, n) => { 
          setAvailableAreas(availableAreas.map(a => a.name === o ? n : a));
          await storageService.deleteArea(o);
          await storageService.upsertArea(n);
        }}
        onEditCategory={() => {}} 
        onDeleteCategory={() => {}} 
      />

      {/* Photo Overlay */}
      {viewPhotoUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 animate-in fade-in zoom-in" onClick={() => setViewPhotoUrl(null)}>
          <div className="relative max-w-full max-h-[80vh]">
            <img src={viewPhotoUrl} className="rounded-[40px] shadow-2xl border border-white/10" />
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest">Tap to close</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;