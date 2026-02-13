import { HousekeepingTask, PublicArea, TaskStatus, AreaItem } from '../types';
import { supabase } from './supabaseClient';

const TASKS_KEY = 'cleantrack_tasks_v1';
const AREAS_KEY = 'cleantrack_areas_v1';

// Initial Mock Data
const INITIAL_TASKS: HousekeepingTask[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], area: PublicArea.LOBBY, category: 'Indoor', jobDescription: 'Vacuum Carpet', assignee: 'Budi', status: TaskStatus.COMPLETED, remarks: 'Done deeply', photoBefore: '', photoProgress: '', photoAfter: '' },
];

const INITIAL_AREAS: AreaItem[] = [
  { name: PublicArea.LOBBY, category: 'Indoor' },
  { name: PublicArea.RESTROOMS, category: 'Indoor' },
  { name: PublicArea.CORRIDORS, category: 'Indoor' },
  { name: PublicArea.POOL_AREA, category: 'Outdoor' },
  { name: PublicArea.GYM, category: 'Facilities' },
];

export const storageService = {
  // --- Tasks ---
  fetchTasks: async (): Promise<HousekeepingTask[]> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapped: HousekeepingTask[] = data.map(t => ({
          id: t.id,
          date: t.date,
          area: t.area,
          category: t.category,
          jobDescription: t.job_description,
          assignee: t.assignee,
          status: t.status as TaskStatus,
          remarks: t.remarks,
          photoBefore: t.photo_before,
          photoProgress: t.photo_progress,
          photoAfter: t.photo_after
        }));
        localStorage.setItem(TASKS_KEY, JSON.stringify(mapped));
        return mapped;
      }
      
      const stored = localStorage.getItem(TASKS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_TASKS;
    } catch (e) {
      console.warn("Supabase fetch failed, using local storage", e);
      const stored = localStorage.getItem(TASKS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_TASKS;
    }
  },

  upsertTask: async (task: HousekeepingTask) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .upsert({
          id: task.id,
          date: task.date,
          area: task.area,
          category: task.category,
          job_description: task.jobDescription,
          assignee: task.assignee,
          status: task.status,
          remarks: task.remarks,
          photo_before: task.photoBefore,
          photo_progress: task.photoProgress,
          photo_after: task.photoAfter
        });
      if (error) throw error;
    } catch (e) {
      console.error("Supabase upsert failed", e);
    }
  },

  deleteTask: async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error("Supabase delete failed", e);
    }
  },

  // --- Areas ---
  fetchAreas: async (): Promise<AreaItem[]> => {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        localStorage.setItem(AREAS_KEY, JSON.stringify(data));
        return data;
      }
      
      const stored = localStorage.getItem(AREAS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_AREAS;
    } catch (e) {
      const stored = localStorage.getItem(AREAS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_AREAS;
    }
  },

  upsertArea: async (area: AreaItem) => {
    try {
      await supabase.from('areas').upsert({ name: area.name, category: area.category });
    } catch (e) {
      console.error("Supabase area upsert failed", e);
    }
  },

  deleteArea: async (name: string) => {
    try {
      await supabase.from('areas').delete().eq('name', name);
    } catch (e) {
      console.error("Supabase area delete failed", e);
    }
  }
};