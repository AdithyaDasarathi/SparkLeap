import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../src/utils/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const tasks = await DatabaseService.getTasksByUser(userId);
    
    return NextResponse.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to get tasks' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { task, userId } = await request.json();

    if (!userId || !task) {
      return NextResponse.json({ 
        error: 'User ID and task data are required' 
      }, { status: 400 });
    }

    const newTask = await DatabaseService.createTask({ ...task, userId });
    
    return NextResponse.json({
      success: true,
      task: newTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    await DatabaseService.clearUserTasks(userId);
    
    return NextResponse.json({
      success: true,
      message: 'All tasks cleared'
    });
  } catch (error) {
    console.error('Error clearing tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to clear tasks' 
    }, { status: 500 });
  }
}
