import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const GOALS_PATH = path.join(process.cwd(), 'data', 'financial-goals.json');

async function loadGoals() {
  const data = await fs.readFile(GOALS_PATH, 'utf-8');
  return JSON.parse(data);
}

async function saveGoals(goals: unknown) {
  await fs.writeFile(GOALS_PATH, JSON.stringify(goals, null, 2));
}

export async function GET() {
  try {
    const goals = await loadGoals();
    const bootstrap = goals.bootstrapGoal;
    const progress = bootstrap.targetAmount > 0
      ? Math.min(100, (bootstrap.currentRevenue / bootstrap.targetAmount) * 100)
      : 0;

    return NextResponse.json({
      ...goals,
      bootstrapGoal: {
        ...bootstrap,
        progressPercent: Math.round(progress * 10) / 10,
        remaining: Math.max(0, bootstrap.targetAmount - bootstrap.currentRevenue),
      },
    });
  } catch (error) {
    console.error('Failed to get goals:', error);
    return NextResponse.json({ error: 'Failed to get goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // POST registers a revenue event
    const { amount, source, description, agentId } = body;

    if (!amount || !source) {
      return NextResponse.json({ error: 'Missing required: amount, source' }, { status: 400 });
    }

    const validSources = ['tiktok_creator_fund', 'affiliate', 'tiktok_shop', 'sponsorship', 'other'];
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: `Invalid source. Must be: ${validSources.join(', ')}` }, { status: 400 });
    }

    const goals = await loadGoals();

    const event = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      amount: Number(amount),
      source,
      description: description || '',
      agentId: agentId || 'unknown',
    };

    goals.revenueLog.unshift(event);
    goals.revenueSources[source].total += Number(amount);
    goals.totalRevenue += Number(amount);
    goals.netProfit = goals.totalRevenue - goals.totalApiCosts;
    goals.bootstrapGoal.currentRevenue += Number(amount);

    // Check milestones
    for (const milestone of goals.bootstrapGoal.milestones) {
      if (!milestone.reached && goals.bootstrapGoal.currentRevenue >= milestone.amount) {
        milestone.reached = true;
        milestone.reachedAt = new Date().toISOString();
      }
    }

    goals.updatedAt = new Date().toISOString();
    await saveGoals(goals);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Failed to log revenue:', error);
    return NextResponse.json({ error: 'Failed to log revenue' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const goals = await loadGoals();

    if (body.totalApiCosts !== undefined) {
      goals.totalApiCosts = Number(body.totalApiCosts);
      goals.netProfit = goals.totalRevenue - goals.totalApiCosts;
    }

    goals.updatedAt = new Date().toISOString();
    await saveGoals(goals);

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Failed to update goals:', error);
    return NextResponse.json({ error: 'Failed to update goals' }, { status: 500 });
  }
}
