export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  INSPECTED = 'Inspected'
}

export enum PublicArea {
  LOBBY = 'Lobby',
  RESTROOMS = 'Restrooms',
  CORRIDORS = 'Corridors',
  POOL_AREA = 'Pool Area',
  GYM = 'Gym',
  RESTAURANT = 'Restaurant',
  PARKING = 'Parking'
}

export interface AreaItem {
  name: string;
  category: string;
}

export interface HousekeepingTask {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  area: PublicArea | string;
  category?: string; // New field for categorization
  jobDescription: string;
  assignee: string;
  status: TaskStatus;
  remarks: string;
  photoBefore?: string;   // Base64 Data URL for Before work
  photoProgress?: string; // Base64 Data URL for Progress work
  photoAfter?: string;    // Base64 Data URL for After work
}

export type FilterPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface FilterState {
  period: FilterPeriod;
  date: string; // Reference date for the filter
}