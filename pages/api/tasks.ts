import type { NextApiRequest, NextApiResponse } from 'next';
import { SupabaseDatabaseService } from '../../src/lib/supabase-database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ 
          error: 'User ID is required' 
        });
      }

      const tasks = await SupabaseDatabaseService.getTasksByUser(userId);
      
      return res.status(200).json({
        success: true,
        tasks
      });
    } catch (error) {
      console.error('Error getting tasks:', error);
      return res.status(500).json({ 
        error: 'Failed to get tasks' 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { task, userId } = req.body;

      if (!task || !userId) {
        return res.status(400).json({ 
          error: 'Task and user ID are required' 
        });
      }

      const createdTask = await SupabaseDatabaseService.createTask({
        ...task,
        userId
      });
      
      return res.status(201).json({
        success: true,
        task: createdTask
      });
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ 
        error: 'Failed to create task' 
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, updates } = req.body;

      if (!id || !updates) {
        return res.status(400).json({ 
          error: 'Task ID and updates are required' 
        });
      }

      const updatedTask = await SupabaseDatabaseService.updateTask(id, updates);
      
      if (!updatedTask) {
        return res.status(404).json({ 
          error: 'Task not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        task: updatedTask
      });
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ 
        error: 'Failed to update task' 
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ 
          error: 'Task ID is required' 
        });
      }

      const success = await SupabaseDatabaseService.deleteTask(id);
      
      if (!success) {
        return res.status(404).json({ 
          error: 'Task not found' 
        });
      }
      
      return res.status(200).json({
        success: true
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      return res.status(500).json({ 
        error: 'Failed to delete task' 
      });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}