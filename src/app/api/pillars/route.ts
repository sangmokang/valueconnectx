import { NextResponse } from 'next/server';
import { servicePillars } from '@/data/service-pillars';

export async function GET() {
  return NextResponse.json(servicePillars);
}
