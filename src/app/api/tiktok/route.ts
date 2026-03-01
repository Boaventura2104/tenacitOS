import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const TIKTOK_PATH = path.join(process.cwd(), 'data', 'tiktok-pipeline.json');

async function loadTikTok() {
  const data = await fs.readFile(TIKTOK_PATH, 'utf-8');
  return JSON.parse(data);
}

async function saveTikTok(data: unknown) {
  await fs.writeFile(TIKTOK_PATH, JSON.stringify(data, null, 2));
}

const PIPELINE_STAGES = ['idea', 'scripting', 'production', 'review', 'published', 'monetized'] as const;
type Stage = typeof PIPELINE_STAGES[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') as Stage | null;

    const data = await loadTikTok();

    if (stage && PIPELINE_STAGES.includes(stage)) {
      return NextResponse.json(data.pipeline[stage] || []);
    }

    // Return full pipeline with counts
    const pipelineCounts: Record<string, number> = {};
    for (const s of PIPELINE_STAGES) {
      pipelineCounts[s] = (data.pipeline[s] || []).length;
    }

    return NextResponse.json({
      ...data,
      pipelineCounts,
    });
  } catch (error) {
    console.error('Failed to get TikTok data:', error);
    return NextResponse.json({ error: 'Failed to get TikTok data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, niche, strategy, hook, format, estimatedViews, addedBy, stage } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing required: title' }, { status: 400 });
    }

    const targetStage: Stage = (stage as Stage) || 'idea';
    if (!PIPELINE_STAGES.includes(targetStage)) {
      return NextResponse.json({ error: `Invalid stage. Must be: ${PIPELINE_STAGES.join(', ')}` }, { status: 400 });
    }

    const data = await loadTikTok();

    const newItem = {
      id: `content-${randomUUID().slice(0, 8)}`,
      title,
      niche: niche || 'tech',
      strategy: strategy || 'creator_fund',
      hook: hook || '',
      format: format || 'unknown',
      estimatedViews: estimatedViews || 0,
      addedBy: addedBy || 'unknown',
      addedAt: new Date().toISOString(),
    };

    data.pipeline[targetStage].push(newItem);
    data.updatedAt = new Date().toISOString();
    await saveTikTok(data);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Failed to add TikTok content:', error);
    return NextResponse.json({ error: 'Failed to add TikTok content' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, fromStage, toStage, revenue, views, accountUpdate } = body;

    const data = await loadTikTok();

    // Update account stats
    if (accountUpdate) {
      data.account = { ...data.account, ...accountUpdate };
    }

    // Move content through pipeline
    if (contentId && fromStage && toStage) {
      if (!PIPELINE_STAGES.includes(fromStage) || !PIPELINE_STAGES.includes(toStage)) {
        return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
      }

      const fromList = data.pipeline[fromStage] as Array<{ id: string; [key: string]: unknown }>;
      const itemIndex = fromList.findIndex((c) => c.id === contentId);

      if (itemIndex === -1) {
        return NextResponse.json({ error: 'Content not found in stage' }, { status: 404 });
      }

      const [item] = fromList.splice(itemIndex, 1);
      const updatedItem = {
        ...item,
        movedToStageAt: new Date().toISOString(),
        ...(views !== undefined && { views }),
        ...(revenue !== undefined && { revenue }),
      };
      data.pipeline[toStage].push(updatedItem);

      if (toStage === 'published') {
        data.publishedContent.push(updatedItem);
        data.totalViews += views || 0;
      }
      if (toStage === 'monetized') {
        data.totalRevenue += revenue || 0;
      }
    }

    // Update revenue for strategy
    if (revenue && body.strategy) {
      const strategy = data.strategies[body.strategy];
      if (strategy) {
        strategy.totalRevenue += Number(revenue);
      }
    }

    data.updatedAt = new Date().toISOString();
    await saveTikTok(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to update TikTok pipeline:', error);
    return NextResponse.json({ error: 'Failed to update TikTok pipeline' }, { status: 500 });
  }
}
