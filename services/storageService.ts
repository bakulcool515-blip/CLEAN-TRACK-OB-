import { HousekeepingTask, PublicArea, TaskStatus, AreaItem } from '../types';

const TASKS_KEY = 'cleantrack_tasks_v1';
const AREAS_KEY = 'cleantrack_areas_v1';

// Mock Data for first-time initialization
const INITIAL_TASKS: HousekeepingTask[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], area: PublicArea.LOBBY, category: 'Indoor', jobDescription: 'Vacuum Carpet', assignee: 'Budi', status: TaskStatus.COMPLETED, remarks: 'Done deeply' },
  { id: '2', date: new Date().toISOString().split('T')[0], area: PublicArea.RESTROOMS, category: 'Indoor', jobDescription: 'Sanitize Sinks', assignee: 'Siti', status: TaskStatus.IN_PROGRESS, remarks: 'Refill soap pending' },
  { id: '3', date: new Date().toISOString().split('T')[0], area: PublicArea.CORRIDORS, category: 'Indoor', jobDescription: 'Mop Floor', assignee: 'Joko', status: TaskStatus.PENDING, remarks: '' },
  { id: '4', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], area: PublicArea.GYM, category: 'Facilities', jobDescription: 'Wipe Machines', assignee: 'Budi', status: TaskStatus.INSPECTED, remarks: 'Good job' },
  { id: '5', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], area: PublicArea.POOL_AREA, category: 'Outdoor', jobDescription: 'Clean Filters', assignee: 'Agus', status: TaskStatus.COMPLETED, remarks: '' },
];

const INITIAL_AREAS: AreaItem[] = [
  { name: PublicArea.LOBBY, category: 'Indoor' },
  { name: PublicArea.RESTROOMS, category: 'Indoor' },
  { name: PublicArea.CORRIDORS, category: 'Indoor' },
  { name: PublicArea.POOL_AREA, category: 'Outdoor' },
  { name: PublicArea.GYM, category: 'Facilities' },
  { name: PublicArea.RESTAURANT, category: 'F&B' },
  { name: PublicArea.PARKING, category: 'Outdoor' },
];

export const storageService = {
  getTasks: (): HousekeepingTask[] => {
    try {
      const stored = localStorage.getItem(TASKS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_TASKS;
    } catch (error) {
      console.error("Failed to load tasks from storage", error);
      return INITIAL_TASKS;
    }
  },

  saveTasks: (tasks: HousekeepingTask[]) => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks to storage", error);
    }
  },

  getAreas: (): AreaItem[] => {
    try {
      const stored = localStorage.getItem(AREAS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration logic: if stored as strings
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
           return parsed.map((name: string) => ({ name, category: 'General' }));
        }
        return parsed;
      }
      return INITIAL_AREAS;
    } catch (error) {
      console.error("Failed to load areas from storage", error);
      return INITIAL_AREAS;
    }
  },

  saveAreas: (areas: AreaItem[]) => {
    try {
      localStorage.setItem(AREAS_KEY, JSON.stringify(areas));
    } catch (error) {
      console.error("Failed to save areas to storage", error);
    }
  }
};