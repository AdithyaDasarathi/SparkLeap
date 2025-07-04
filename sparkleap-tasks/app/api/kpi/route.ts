import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '../../../src/utils/database';
import { KPIMetric } from '../../../src/types/kpi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const metricName = searchParams.get('metricName') as KPIMetric;
    const days = parseInt(searchParams.get('days') || '30');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (metricName) {
      // Get trend data for specific metric
      let trends = await DatabaseService.getKPITrends(userId, metricName, days);
      
      // If no data exists, seed sample data
      if (trends.length === 0) {
        await DatabaseService.seedSampleData(userId);
        trends = await DatabaseService.getKPITrends(userId, metricName, days);
      }
      
      return NextResponse.json({ trends });
    } else {
      // Get all KPIs for user
      let kpis = await DatabaseService.getKPIsByUser(userId);
      
      // If no data exists, seed sample data
      if (kpis.length === 0) {
        await DatabaseService.seedSampleData(userId);
        kpis = await DatabaseService.getKPIsByUser(userId);
      }
      
      return NextResponse.json({ kpis });
    }
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, metricName, value, source = 'Manual' } = body;

    if (!userId || !metricName || value === undefined) {
      return NextResponse.json(
        { error: 'userId, metricName, and value are required' },
        { status: 400 }
      );
    }

    const kpi = await DatabaseService.createKPI({
      userId,
      metricName,
      source,
      value: parseFloat(value),
      timestamp: new Date(),
      lastSyncedAt: new Date(),
      isManualOverride: false,
      status: 'active'
    });

    return NextResponse.json({ kpi }, { status: 201 });
  } catch (error) {
    console.error('Error creating KPI:', error);
    return NextResponse.json(
      { error: 'Failed to create KPI' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, value, isManualOverride = true } = body;

    if (!id || value === undefined) {
      return NextResponse.json(
        { error: 'id and value are required' },
        { status: 400 }
      );
    }

    const updates: any = {
      isManualOverride,
      lastSyncedAt: new Date()
    };

    if (isManualOverride) {
      updates.overrideValue = parseFloat(value);
      updates.overrideTimestamp = new Date();
    } else {
      updates.value = parseFloat(value);
    }

    const kpi = await DatabaseService.updateKPI(id, updates);
    
    if (!kpi) {
      return NextResponse.json(
        { error: 'KPI not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ kpi });
  } catch (error) {
    console.error('Error updating KPI:', error);
    return NextResponse.json(
      { error: 'Failed to update KPI' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const success = await DatabaseService.deleteKPI(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'KPI not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting KPI:', error);
    return NextResponse.json(
      { error: 'Failed to delete KPI' },
      { status: 500 }
    );
  }
} 