import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { HousekeepingTask, FilterPeriod, TaskStatus, PublicArea, AreaItem } from './types';
import { StatsCard } from './components/StatsCard';
import { TaskForm } from './components/TaskForm';
import { AreaManager } from './components/AreaManager';
import { filterTasks, formatDate, getWeekRange } from './utils/dateUtils';
import { exportToExcel, exportToPdf } from './utils/exportUtils';
import { generateReportSummary } from './services/geminiService';
import { storageService } from './services/storageService';
import ReactMarkdown from 'react-markdown';

const App = () => {
  // Initialize state from Storage Service
  const [tasks, setTasks] = useState<HousekeepingTask[]>(() => storageService.getTasks());
  const [availableAreas, setAvailableAreas] = useState<AreaItem[]>(() => storageService.getAreas());

  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('daily');
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<HousekeepingTask | undefined>(undefined);
  
  // Public Areas State
  const [isAreaManagerOpen, setIsAreaManagerOpen] = useState(false);

  // Photo Lightbox State
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

  // AI State
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Persistence Effects
  useEffect(() => {
    storageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storageService.saveAreas(availableAreas);
  }, [availableAreas]);

  // Derived Data
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
    // Chart data based on Categories now? Or Areas? Let's do Categories for higher level view.
    // Or keep areas but sorted. Let's stick to Area Names for detailed view.
    const data = availableAreas.map(area => ({
      name: area.name,
      category: area.category,
      tasks: filteredTasks.filter(t => t.area === area.name).length
    }));
    return data.filter(d => d.tasks > 0);
  }, [filteredTasks, availableAreas]);

  // Handlers
  const handleAddTask = (newTask: HousekeepingTask) => {
    if (editingTask) {
      setTasks(tasks.map(t => t.id === newTask.id ? newTask : t));
    } else {
      setTasks([newTask, ...tasks]);
    }
    setEditingTask(undefined);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleEdit = (task: HousekeepingTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
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

  const handleAiAnalysis = async () => {
    setIsGeneratingAi(true);
    setAiSummary('');
    const summary = await generateReportSummary(filteredTasks, filterPeriod);
    setAiSummary(summary);
    setIsGeneratingAi(false);
  };

  const handleAddArea = (area: AreaItem) => {
    if (!availableAreas.find(a => a.name === area.name)) {
      setAvailableAreas([...availableAreas, area]);
    } else {
      alert("Area name already exists!");
    }
  };

  const handleDeleteArea = (name: string) => {
    if (confirm(`Delete area "${name}"?`)) {
      setAvailableAreas(availableAreas.filter(a => a.name !== name));
    }
  };

  const handleEditArea = (oldName: string, newArea: AreaItem) => {
    if (oldName !== newArea.name && availableAreas.find(a => a.name === newArea.name)) {
      alert("Area name already exists!");
      return;
    }
    // Update List
    setAvailableAreas(availableAreas.map(a => a.name === oldName ? newArea : a));
    
    // Update existing tasks to preserve data integrity and update Category
    setTasks(tasks.map(t => t.area === oldName ? { ...t, area: newArea.name, category: newArea.category } : t));
  };

  const handleEditCategory = (oldCategory: string, newCategory: string) => {
    if (oldCategory === newCategory) return;
    
    // Update all areas with this category
    setAvailableAreas(prev => prev.map(a => 
      a.category === oldCategory ? { ...a, category: newCategory } : a
    ));

    // Update historical tasks to reflect the category rename
    setTasks(prev => prev.map(t => 
      t.category === oldCategory ? { ...t, category: newCategory } : t
    ));
  };

  const handleDeleteCategory = (category: string) => {
    if (confirm(`Delete all areas in category "${category}"? This action cannot be undone.`)) {
      setAvailableAreas(prev => prev.filter(a => a.category !== category));
    }
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
          <button 
            onClick={() => { setFilterPeriod('daily'); setCurrentDate(new Date().toISOString().split('T')[0]); }}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${filterPeriod === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            📅 Daily Report
          </button>
          <button 
            onClick={() => setFilterPeriod('weekly')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${filterPeriod === 'weekly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            📆 Weekly Report
          </button>
          <button 
            onClick={() => setFilterPeriod('monthly')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${filterPeriod === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            🗓️ Monthly Report
          </button>
          <button 
            onClick={() => setFilterPeriod('yearly')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${filterPeriod === 'yearly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            📅 Yearly Report
          </button>
          <button 
            onClick={() => setFilterPeriod('all')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${filterPeriod === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            📂 All Records
          </button>
        </nav>
        
        {/* Settings Area */}
        <div className="p-4 border-t border-slate-800">
           <button 
            onClick={() => setIsAreaManagerOpen(true)}
            className="w-full text-left px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Manage Locations & Categories
          </button>
          <div className="mt-2 text-xs text-slate-500 text-center">
            Database: Local Storage (Auto-Saved)
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{filterPeriod} Overview</h2>
            <p className="text-gray-500 text-sm mt-1">
              {filterPeriod === 'daily' && formatDate(currentDate)}
              {filterPeriod === 'weekly' && `Week of ${formatDate(getWeekRange(currentDate).start)} - ${formatDate(getWeekRange(currentDate).end)}`}
              {filterPeriod === 'monthly' && new Date(currentDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              {filterPeriod === 'yearly' && `Year ${new Date(currentDate).getFullYear()}`}
              {filterPeriod === 'all' && 'All historical data'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
             <button 
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition"
              title="Download as Excel CSV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel
            </button>
            <button 
              onClick={handleExportPdf}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition"
              title="Download as PDF Report"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v15a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            <button 
              onClick={() => { setEditingTask(undefined); setIsFormOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm flex items-center gap-2 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Task
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Tasks" value={stats.total} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} colorClass="bg-blue-500" />
          <StatsCard title="Completed" value={stats.completed} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} colorClass="bg-green-500" />
          <StatsCard title="Pending" value={stats.pending} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-red-500" />
          <StatsCard title="In Progress" value={stats.inProgress} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} colorClass="bg-yellow-500" />
        </div>

        {/* Charts Section - Full width now */}
        <div className="mb-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tasks by Area</h3>
            <div className="h-80">
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium w-16">Photo</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Area</th>
                  <th className="p-4 font-medium">Job Description</th>
                  <th className="p-4 font-medium">Assignee</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Remarks</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                       {task.photo ? (
                         <button 
                          onClick={() => setViewPhotoUrl(task.photo!)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-blue-500 transition"
                         >
                           <img src={task.photo} alt="Task" className="w-full h-full object-cover" />
                         </button>
                       ) : (
                         <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         </div>
                       )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 font-medium">{formatDate(task.date)}</td>
                    <td className="p-4 text-sm font-semibold text-gray-500">{task.category || '-'}</td>
                    <td className="p-4 text-sm text-gray-800 font-bold">{task.area}</td>
                    <td className="p-4 text-sm text-gray-600">{task.jobDescription}</td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {task.assignee.charAt(0)}
                        </div>
                        {task.assignee}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 italic max-w-xs truncate">{task.remarks || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(task)} className="p-1 hover:bg-blue-100 rounded text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="p-1 hover:bg-red-100 rounded text-red-600">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">
                      No tasks found for this period.
                    </td>
                  </tr>
                )}
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
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Lightbox Modal */}
      {viewPhotoUrl && (
        <div 
          className="fixed inset-0 z-[70] bg-black bg-opacity-90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setViewPhotoUrl(null)}
        >
          <button 
             onClick={() => setViewPhotoUrl(null)}
             className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img 
            src={viewPhotoUrl} 
            alt="Full size evidence" 
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default App;