import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const TASKS_PATH = path.join(process.cwd(), 'data', 'tasks.json');

async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    throw new Error('tasks.json not found. Run: npm run data:init');
  }
}

async function saveTasks(tasks: unknown[]) {
  try {
    await fs.writeFile(TASKS_PATH, JSON.stringify(tasks, null, 2));
  } catch {
    throw new Error('Failed to save tasks.json');
  }
}

// POST /api/tasks/[id]/subscribe — Toggle subscription
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing required: userId' }, { status: 400 });
    }

    const tasks = await loadTasks();
    const task = tasks.find((t: { id: string }) => t.id === params.id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const idx = task.subscribers.indexOf(userId);
    if (idx === -1) {
      task.subscribers.push(userId);
    } else {
      task.subscribers.splice(idx, 1);
    }

    task.updatedAt = new Date().toISOString();
    await saveTasks(tasks);

    return NextResponse.json({
      subscribed: idx === -1,
      subscribers: task.subscribers,
    });
  } catch (error) {
    console.error('Failed to toggle subscription:', error);
    return NextResponse.json({ error: 'Failed to toggle subscription' }, { status: 500 });
  }
}
