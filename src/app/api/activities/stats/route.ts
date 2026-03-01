/**
 * Activity Stats API
 * GET /api/activities/stats
 * Returns heatmap data, counts by type, status, and recent trend
 */
import { NextResponse } from 'next/server';
import {
  getActivityStats,
  getActivityHeatmap,
  getActivityTrend,
  getHourlyActivity,
} from '@/lib/activities-db';

export async function GET() {
  try {
    const stats = getActivityStats();
    const heatmap = getActivityHeatmap();
    const trend = getActivityTrend();
    const hourly = getHourlyActivity();

    return NextResponse.json({
      ...stats,
      heatmap,
      trend,
      hourly,
    });
  } catch (error) {
    console.error('[activities/stats] Error:', error);
    return NextResponse.json({
      total: 0,
      today: 0,
      byType: {},
      byStatus: {},
      heatmap: [],
      trend: [],
      hourly: [],
      error: 'Failed to get stats',
    });
  }
}
