import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const TASKS_PATH = path.join(process.cwd(), 'data', 'tasks.json');
const MEMOS_PATH = path.join(process.cwd(), 'data', 'memos.json');

async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function loadMemos() {
  try {
    const data = await fs.readFile(MEMOS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// GET /api/mentions?agent=ceo — Get all mentions of a specific agent/user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get('agent');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    if (!agent) {
      return NextResponse.json({ error: 'agent parameter required' }, { status: 400 });
    }

    const mentions: Array<{
      id: string;
      source: 'task_thread' | 'memo';
      sourceId: string;
      sourceTitle: string;
      from: string;
      content: string;
      timestamp: string;
    }> = [];

    // Search task threads
    const tasks = await loadTasks();
    for (const task of tasks) {
      for (const msg of task.thread || []) {
        if ((msg.mentions || []).includes(agent)) {
          mentions.push({
            id: msg.id,
            source: 'task_thread',
            sourceId: task.id,
            sourceTitle: task.title,
            from: msg.author,
            content: msg.content,
            timestamp: msg.timestamp,
          });
        }
      }
    }

    // Search memos content for @mentions
    const memos = await loadMemos();
    for (const memo of memos) {
      const mentionMatch = memo.content?.includes(`@${agent}`) || memo.content?.includes(`@human:${agent}`);
      if (mentionMatch) {
        mentions.push({
          id: memo.id,
          source: 'memo',
          sourceId: memo.id,
          sourceTitle: memo.subject,
          from: memo.from,
          content: memo.content,
          timestamp: memo.timestamp,
        });
      }
    }

    mentions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      mentions: mentions.slice(0, limit),
      total: mentions.length,
    });
  } catch (error) {
    console.error('Failed to get mentions:', error);
    return NextResponse.json({ error: 'Failed to get mentions' }, { status: 500 });
  }
}
