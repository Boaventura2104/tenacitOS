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
    return null;
  }
}

async function saveOrg(org: unknown) {
  await fs.writeFile(ORG_PATH, JSON.stringify(org, null, 2));
}

export async function GET() {
  try {
    const org = await loadOrg();
    if (!org) {
      return NextResponse.json({ error: 'Org config not found' }, { status: 404 });
    }

    // Compute rotation status: who acts next
    const now = new Date();
    const currentMinute = now.getMinutes();
    const rotation = org.rotation as Array<{ agentId: string; slot: number; cronMinute: number }>;

    // Find which slot we're currently in or next
    const slots = rotation.map((r) => r.cronMinute).sort((a, b) => a - b);
    let nextSlotMinute = slots.find((m) => m > currentMinute);
    let nextSlotHourOffset = 0;
    if (nextSlotMinute === undefined) {
      nextSlotMinute = slots[0]; // wraps to next hour
      nextSlotHourOffset = 1;
    }

    const nextRotation = rotation.find((r) => r.cronMinute === nextSlotMinute);
    const currentSlot = rotation.find((r) => {
      const prevSlots = slots.filter((m) => m <= currentMinute);
      if (prevSlots.length === 0) return false;
      return r.cronMinute === Math.max(...prevSlots);
    });

    const minutesUntilNext = nextSlotHourOffset * 60 + nextSlotMinute - currentMinute;

    return NextResponse.json({
      ...org,
      rotationStatus: {
        currentAgent: currentSlot?.agentId || null,
        nextAgent: nextRotation?.agentId || null,
        minutesUntilNext,
        lastUpdated: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get org config:', error);
    return NextResponse.json({ error: 'Failed to get org config' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await loadOrg();
    if (!org) {
      return NextResponse.json({ error: 'Org config not found' }, { status: 404 });
    }

    // Allow updating culture, rules, mission, vision
    const allowedFields = ['culture', 'rules', 'mission', 'vision', 'tagline'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updated = { ...org, ...updates, updatedAt: new Date().toISOString() };
    await saveOrg(updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update org config:', error);
    return NextResponse.json({ error: 'Failed to update org config' }, { status: 500 });
  }
}
