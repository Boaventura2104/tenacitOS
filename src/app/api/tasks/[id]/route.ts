import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TASKS_PATH = path.join(process.cwd(), 'data', 'tasks.json');

async function loadTasks() {
  const data = await fs.readFile(TASKS_PATH, 'utf-8');
  return JSON.parse(data);
}

async function saveTasks(tasks: unknown[]) {
  await fs.writeFile(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tasks = await loadTasks();
    const task = tasks.find((t: { id: string }) => t.id === params.id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get task' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tasks = await loadTasks();
    const index = tasks.findIndex((t: { id: string }) => t.id === params.id);
    if (index === -1) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    tasks.splice(index, 1);
    await saveTasks(tasks);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
