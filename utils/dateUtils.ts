import { HousekeepingTask, FilterPeriod } from '../types';

export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const getWeekRange = (dateString: string) => {
  const curr = new Date(dateString);
  const first = curr.getDate() - curr.getDay(); 
  const last = first + 6;

  const firstDay = new Date(curr.setDate(first));
  const lastDay = new Date(curr.setDate(last));

  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0],
  };
};

export const filterTasks = (tasks: HousekeepingTask[], period: FilterPeriod, refDate: string): HousekeepingTask[] => {
  if (period === 'all') return tasks;

  const targetDate = new Date(refDate);
  
  return tasks.filter(task => {
    const taskDate = new Date(task.date);

    if (period === 'daily') {
      return task.date === refDate;
    }

    if (period === 'weekly') {
      const { start, end } = getWeekRange(refDate);
      return task.date >= start && task.date <= end;
    }

    if (period === 'monthly') {
      return (
        taskDate.getMonth() === targetDate.getMonth() &&
        taskDate.getFullYear() === targetDate.getFullYear()
      );
    }

    if (period === 'yearly') {
      return taskDate.getFullYear() === targetDate.getFullYear();
    }
    
    return true;
  });
};