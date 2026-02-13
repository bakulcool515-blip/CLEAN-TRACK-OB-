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

  // Initial Data Load from Supabase
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const [fetchedTasks, fetchedAreas] = await Promise.all([
        storageService.fetchTasks(),
        storageService.fetchAreas()
      ]);
      setTasks(fetchedTasks);
      setAvailableAreas(fetchedAreas);
      setIsLoading(false);
    };
    initData();
  }, []);

  // Sync to LocalStorage (as cache)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cleantrack_tasks_v1', JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cleantrack_areas_v1', JSON.stringify(availableAreas));
    }
  }, [availableAreas, isLoading]);

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

  const chartData = useMemo(() => {
    const data = availableAreas.map(area => ({
      name: area.name,
      tasks: filteredTasks.filter(t => t.area === area.name).length
    }));
    return data.filter(d => d.tasks > 0);
  }, [filteredTasks, availableAreas]);

  // Handlers with Supabase Sync
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
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
      await storageService.deleteTask(id);
    }
  };

  const handleAddArea = async (area: AreaItem) => {
    if (!availableAreas.find(a => a.name === area.name)) {
      setAvailableAreas([...availableAreas, area]);
      await storageService.upsertArea(area);
    } else {
      alert("Area name already exists!");
    }
  };

  const handleDeleteArea = async (name: string) => {
    if (confirm(`Delete area "${name}"?`)) {
      setAvailableAreas(availableAreas.filter(a => a.name !== name));
      await storageService.deleteArea(name);
    }
  };

  const handleEditArea = async (oldName: string, newArea: AreaItem) => {
    if (oldName !== newArea.name && availableAreas.find(a => a.name === newArea.name)) {
      alert("Area name already exists!");
      return;
    }
    setAvailableAreas(availableAreas.map(a => a.name === oldName ? newArea : a));
    await storageService.deleteArea(oldName);
    await storageService.upsertArea(newArea);
    setTasks(tasks.map(t => t.area === oldName ? { ...t, area: newArea.name, category: newArea.category } : t));
  };

  const handleExport = () => {
    const filename = `Housekeeping_Report_${filterPeriod}_${currentDate}`;
    exportToExcel(filteredTasks, filename);
  };

  const handleExportPdf = () => {
    const title = `CleanTrack Report - ${filterPeriod.charAt(0).toUpperCase() + filterPeriod.slice(1)}`;
    const filename = `CleanTrack_Report_${filterPeriod}_${currentDate}`;
    exportToPdf(filteredTasks, title, filename);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case TaskStatus.INSPECTED: return 'bg-blue-100 text-blue-800';
      case TaskStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.PENDING: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-600 font-medium">Connecting to Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
            <span className="text-blue-400">✨</span> CleanTrack
          </h1>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {['daily', 'weekly', 'monthly', 'yearly', 'all'].map((p) => (
            <button 
              key={p}
              onClick={() => { setFilterPeriod(p as FilterPeriod); if(p === 'daily') setCurrentDate(new Date().toISOString().split('T')[0]); }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 capitalize ${filterPeriod === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              {p === 'daily' ? '📅' : p === 'weekly' ? '📆' : p === 'monthly' ? '🗓️' : p === 'yearly' ? '📅' : '📂'} {p} Report
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
           <button 
            onClick={() => setIsAreaManagerOpen(true)}
            className="w-full text-left px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            ⚙️ Manage Locations
          </button>
          <div className="mt-2 text-[10px] text-slate-500 text-center uppercase tracking-widest flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online Database
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{filterPeriod} Overview</h2>
            <p className="text-gray-500 text-sm mt-1">
              {filterPeriod === 'daily' && formatDate(currentDate)}
              {filterPeriod === 'weekly' && `Week Range: ${formatDate(getWeekRange(currentDate).start)} - ${formatDate(getWeekRange(currentDate).end)}`}
              {filterPeriod === 'monthly' && new Date(currentDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              {filterPeriod === 'yearly' && `Year ${new Date(currentDate).getFullYear()}`}
              {filterPeriod === 'all' && 'All historical data synced'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
             <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition">
              Excel
            </button>
            <button onClick={handleExportPdf} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition">
              PDF
            </button>
            <button 
              onClick={() => { setEditingTask(undefined); setIsFormOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition"
            >
              + Add Task
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Tasks" value={stats.total} icon="📊" colorClass="bg-blue-500" />
          <StatsCard title="Completed" value={stats.completed} icon="✅" colorClass="bg-green-500" />
          <StatsCard title="Pending" value={stats.pending} icon="⏳" colorClass="bg-red-500" />
          <StatsCard title="In Progress" value={stats.inProgress} icon="⚡" colorClass="bg-yellow-500" />
        </div>

        <div className="mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Task Distribution by Area</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="tasks" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                  <th className="p-4 w-40">Evidence (B/P/A)</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Area</th>
                  <th className="p-4">Job Description</th>
                  <th className="p-4">Staff</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                       <div className="flex gap-1">
                          {task.photoBefore ? (
                            <button onClick={() => setViewPhotoUrl(task.photoBefore!)} className="w-10 h-10 rounded border border-gray-200 overflow-hidden relative">
                              <img src={task.photoBefore} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[6px] text-white text-center py-0.5 font-bold uppercase">B</div>
                            </button>
                          ) : <div className="w-10 h-10 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[6px] text-gray-400 font-bold uppercase">B</div>}
                          
                          {task.photoProgress ? (
                            <button onClick={() => setViewPhotoUrl(task.photoProgress!)} className="w-10 h-10 rounded border border-blue-200 overflow-hidden relative">
                              <img src={task.photoProgress} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-blue-600/60 text-[6px] text-white text-center py-0.5 font-bold uppercase">P</div>
                            </button>
                          ) : <div className="w-10 h-10 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[6px] text-gray-400 font-bold uppercase">P</div>}

                          {task.photoAfter ? (
                            <button onClick={() => setViewPhotoUrl(task.photoAfter!)} className="w-10 h-10 rounded border border-gray-200 overflow-hidden relative">
                              <img src={task.photoAfter} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-green-600/60 text-[6px] text-white text-center py-0.5 font-bold uppercase">A</div>
                            </button>
                          ) : <div className="w-10 h-10 rounded bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[6px] text-gray-400 font-bold uppercase">A</div>}
                       </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-medium">{formatDate(task.date)}</td>
                    <td className="p-4 text-sm text-gray-800 font-bold">{task.area}</td>
                    <td className="p-4 text-sm text-gray-600">{task.jobDescription}</td>
                    <td className="p-4 text-sm text-gray-600">{task.assignee}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { setEditingTask(task); setIsFormOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan={7} className="p-12 text-center text-gray-400">No synced data for this period.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>

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
        onAdd={handleAddArea}
        onDelete={handleDeleteArea}
        onEdit={handleEditArea}
        onEditCategory={() => {}} 
        onDeleteCategory={() => {}} 
      />

      {viewPhotoUrl && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setViewPhotoUrl(null)}>
          <div className="relative max-w-full max-h-full">
            <img src={viewPhotoUrl} className="rounded-lg shadow-2xl border border-white/10" />
            <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;