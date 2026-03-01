import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const ORG_PATH = path.join(process.cwd(), 'data', 'org-config.json');

async function loadOrg() {
  try {
    const data = await fs.readFile(ORG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    throw new Error('org-config.json not found. Run: npm run data:init');
  }
}

async function saveOrg(org: unknown) {
  try {
    await fs.writeFile(ORG_PATH, JSON.stringify(org, null, 2));
  } catch {
    throw new Error('Failed to save org-config.json');
  }
}

// POST /api/org/hire — Hire a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hiringManagerId, name, fullName, role, emoji, color, authority, responsibilities } = body;

    if (!hiringManagerId || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields: hiringManagerId, name, role' }, { status: 400 });
    }

    const VALID_ID = /^[a-z0-9_-]{1,32}$/;
    if (!VALID_ID.test(hiringManagerId)) {
      return NextResponse.json({ error: 'Invalid hiringManagerId format' }, { status: 400 });
    }

    const org = await loadOrg();
    const agents = org.agents as Array<{ id: string; status: string }>;
    const activeAgents = agents.filter((a) => a.status === 'active');

    if (activeAgents.length >= org.maxAgents) {
      return NextResponse.json(
        { error: `Max agents reached (${org.maxAgents}). Fire an agent before hiring.` },
        { status: 400 }
      );
    }

    const hiringSlot = org.hiringSlots[hiringManagerId];
    if (!hiringSlot) {
      return NextResponse.json({ error: `Agent ${hiringManagerId} cannot hire` }, { status: 400 });
    }
    if (!hiringSlot.canHire) {
      return NextResponse.json({ error: `Agent ${hiringManagerId} has no hiring slots` }, { status: 400 });
    }
    if (hiringSlot.hiredAgentId) {
      return NextResponse.json(
        { error: `${hiringManagerId} already hired ${hiringSlot.hiredAgentId}` },
        { status: 400 }
      );
    }

    const newAgentId = `${hiringManagerId}-hire-${Date.now()}`;
    const newAgent = {
      id: newAgentId,
      name,
      fullName: fullName || name,
      emoji: emoji || '🤖',
      color: color || '#666666',
      role: 'hired',
      reportsTo: hiringManagerId,
      managedBy: hiringManagerId,
      authority: authority || 'Defined by hiring manager',
      responsibilities: responsibilities || [],
      kpis: [],
      personality: '',
      joinedAt: new Date().toISOString(),
      status: 'active',
    };

    // Add to agents list
    org.agents.push(newAgent);

    // Update hiring slot
    org.hiringSlots[hiringManagerId].hiredAgentId = newAgentId;

    // Add to rotation (after the hiring manager's slot + 1)
    const managerSlot = (org.rotation as Array<{ agentId: string; slot: number; cronMinute: number }>)
      .find((r) => r.agentId === hiringManagerId);
    const newSlot = managerSlot ? managerSlot.slot + 0.5 : org.rotation.length;
    const newCronMinute = managerSlot ? (managerSlot.cronMinute + 7) % 60 : 7;

    org.rotation.push({
      agentId: newAgentId,
      slot: newSlot,
      cronMinute: newCronMinute,
      cronExpression: `${newCronMinute} * * * *`,
    });

    org.updatedAt = new Date().toISOString();
    await saveOrg(org);

    return NextResponse.json({ success: true, agent: newAgent }, { status: 201 });
  } catch (error) {
    console.error('Failed to hire agent:', error);
    return NextResponse.json({ error: 'Failed to hire agent' }, { status: 500 });
  }
}

// DELETE /api/org/hire?agentId=xxx — Fire/remove a hired agent
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json({ error: 'agentId required' }, { status: 400 });
    }

    const org = await loadOrg();
    const agents = org.agents as Array<{ id: string; role: string; status: string; reportsTo: string }>;
    const agent = agents.find((a) => a.id === agentId);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    if (agent.role === 'founder') {
      return NextResponse.json({ error: 'Cannot fire a founder agent' }, { status: 400 });
    }

    // Mark as terminated (preserve history)
    agent.status = 'terminated';

    // Free up hiring slot
    const hiringManagerId = agent.reportsTo;
    if (hiringManagerId && org.hiringSlots[hiringManagerId]) {
      org.hiringSlots[hiringManagerId].hiredAgentId = null;
    }

    // Remove from rotation
    org.rotation = (org.rotation as Array<{ agentId: string }>).filter((r) => r.agentId !== agentId);

    org.updatedAt = new Date().toISOString();
    await saveOrg(org);

    return NextResponse.json({ success: true, firedAgent: agentId });
  } catch (error) {
    console.error('Failed to fire agent:', error);
    return NextResponse.json({ error: 'Failed to fire agent' }, { status: 500 });
  }
}
