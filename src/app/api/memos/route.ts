import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const MEMOS_PATH = path.join(process.cwd(), 'data', 'memos.json');

export interface Memo {
  id: string;
  from: string;
  fromType: 'agent' | 'human';
  to: string | 'all';
  subject: string;
  content: string;
  priority: 'normal' | 'urgent' | 'low';
  read: boolean;
  actionRequired: boolean;
  tags: string[];
  timestamp: string;
  readAt?: string;
}

async function loadMemos(): Promise<Memo[]> {
  try {
    const data = await fs.readFile(MEMOS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveMemos(memos: Memo[]) {
  await fs.writeFile(MEMOS_PATH, JSON.stringify(memos, null, 2));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agent = searchParams.get('agent');
    const unreadOnly = searchParams.get('read') === 'false';
    const limit = parseInt(searchParams.get('limit') || '50');

    let memos = await loadMemos();

    if (agent) {
      memos = memos.filter((m) => m.to === agent || m.to === 'all' || m.from === agent);
    }

    if (unreadOnly) {
      memos = memos.filter((m) => !m.read);
    }

    memos.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const sliced = memos.slice(0, limit);

    const unreadCount = agent
      ? (await loadMemos()).filter((m) => !m.read && (m.to === agent || m.to === 'all')).length
      : (await loadMemos()).filter((m) => !m.read).length;

    return NextResponse.json({ memos: sliced, unreadCount, total: memos.length });
  } catch (error) {
    console.error('Failed to get memos:', error);
    return NextResponse.json({ error: 'Failed to get memos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, fromType, to, subject, content, priority, actionRequired, tags } = body;

    if (!from || !to || !subject || !content) {
      return NextResponse.json({ error: 'Missing required: from, to, subject, content' }, { status: 400 });
    }

    const memo: Memo = {
      id: randomUUID(),
      from,
      fromType: fromType || 'agent',
      to,
      subject,
      content,
      priority: priority || 'normal',
      read: false,
      actionRequired: actionRequired || false,
      tags: tags || [],
      timestamp: new Date().toISOString(),
    };

    const memos = await loadMemos();
    memos.unshift(memo);

    // Keep last 500 memos
    if (memos.length > 500) memos.splice(500);

    await saveMemos(memos);
    return NextResponse.json(memo, { status: 201 });
  } catch (error) {
    console.error('Failed to create memo:', error);
    return NextResponse.json({ error: 'Failed to create memo' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, read, action } = body;

    const memos = await loadMemos();

    if (action === 'markAllRead' && body.agent) {
      let count = 0;
      for (const m of memos) {
        if (!m.read && (m.to === body.agent || m.to === 'all')) {
          m.read = true;
          m.readAt = new Date().toISOString();
          count++;
        }
      }
      await saveMemos(memos);
      return NextResponse.json({ success: true, updated: count });
    }

    if (id) {
      const memo = memos.find((m) => m.id === id);
      if (!memo) {
        return NextResponse.json({ error: 'Memo not found' }, { status: 404 });
      }
      memo.read = read !== undefined ? read : true;
      if (memo.read) memo.readAt = new Date().toISOString();
      await saveMemos(memos);
      return NextResponse.json(memo);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update memo:', error);
    return NextResponse.json({ error: 'Failed to update memo' }, { status: 500 });
  }
}
