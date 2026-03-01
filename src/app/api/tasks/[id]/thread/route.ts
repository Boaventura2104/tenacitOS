import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

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

function parseMentions(content: string): string[] {
  const matches = content.matchAll(/@([\w:]+)/g);
  return [...matches].map((m) => m[1]);
}

// POST /api/tasks/[id]/thread — Add a thread message
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { author, authorType, content, attachments } = body;

    if (!author || !content) {
      return NextResponse.json({ error: 'Missing required: author, content' }, { status: 400 });
    }

    const tasks = await loadTasks();
    const task = tasks.find((t: { id: string }) => t.id === params.id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const mentions = parseMentions(content);

    const message = {
      id: randomUUID(),
      author,
      authorType: authorType || 'agent',
      content,
      timestamp: new Date().toISOString(),
      mentions,
      attachments: attachments || [],
    };

    task.thread.push(message);
    task.updatedAt = new Date().toISOString();

    // Auto-subscribe mentioned agents/humans
    for (const mention of mentions) {
      if (!task.subscribers.includes(mention)) {
        task.subscribers.push(mention);
      }
    }

    await saveTasks(tasks);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Failed to add thread message:', error);
    return NextResponse.json({ error: 'Failed to add thread message' }, { status: 500 });
  }
}
