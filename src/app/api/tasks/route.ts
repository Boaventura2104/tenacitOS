import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const TASKS_PATH = path.join(process.cwd(), 'data', 'tasks.json');

export interface TaskDoc {
  id: string;
  name: string;
  content?: string;
  path?: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskMedia {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'file';
  createdBy: string;
  createdAt: string;
}

export interface ThreadMessage {
  id: string;
  author: string;
  authorType: 'agent' | 'human';
  content: string;
  timestamp: string;
  mentions: string[];
  attachments: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'planning' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  owner: string;
  tags: string[];
  subscribers: string[];
  thread: ThreadMessage[];
  docs: TaskDoc[];
  media: TaskMedia[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
}

async function loadTasks(): Promise<Task[]> {
  try {
    const data = await fs.readFile(TASKS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTasks(tasks: Task[]) {
  await fs.writeFile(TASKS_PATH, JSON.stringify(tasks, null, 2));
}

function parseMentions(content: string): string[] {
  const matches = content.matchAll(/@([\w:]+)/g);
  return [...matches].map((m) => m[1]);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const owner = searchParams.get('owner');
    const subscriber = searchParams.get('subscriber');
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '100');

    let tasks = await loadTasks();

    if (status) tasks = tasks.filter((t) => t.status === status);
    if (owner) tasks = tasks.filter((t) => t.owner === owner);
    if (subscriber) tasks = tasks.filter((t) => t.subscribers.includes(subscriber));
    if (tag) tasks = tasks.filter((t) => t.tags.includes(tag));

    tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ tasks: tasks.slice(0, limit), total: tasks.length });
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return NextResponse.json({ error: 'Failed to get tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, priority, owner, tags, subscribers, createdBy, dueDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing required: title' }, { status: 400 });
    }

    const task: Task = {
      id: `task-${randomUUID().slice(0, 8)}`,
      title,
      description: description || '',
      status: status || 'backlog',
      priority: priority || 'Medium',
      owner: owner || 'ceo',
      tags: tags || [],
      subscribers: subscribers || [],
      thread: [],
      docs: [],
      media: [],
      createdBy: createdBy || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: dueDate || null,
    };

    const tasks = await loadTasks();
    tasks.unshift(task);
    await saveTasks(tasks);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }

    const tasks = await loadTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const allowedUpdates = ['title', 'description', 'status', 'priority', 'owner', 'tags', 'dueDate'];
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        (task as Record<string, unknown>)[field] = updates[field];
      }
    }
    task.updatedAt = new Date().toISOString();

    await saveTasks(tasks);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
