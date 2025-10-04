export interface Task {
  id: string;
  title: string;
  dueDate: Date | null;
  dueTime?: string;
  category: string;
  priority: Priority;
  completed: boolean;
  createdAt: Date;
}

export type Priority = 'High' | 'Medium' | 'Low';

export const priorities: Priority[] = ['High', 'Medium', 'Low'];

export type TaskCategory = 'Follow-up' | 'Product' | 'Hiring' | 'General';

export const categories: TaskCategory[] = ['Follow-up', 'Product', 'Hiring', 'General'];
