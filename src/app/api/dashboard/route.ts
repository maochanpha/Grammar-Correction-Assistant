import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getWords } from '@/lib/ai/text-analysis';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Real document counts
    const totalDocuments = await prisma.document.count({
      where: { userId: user.id },
    });

    // Real recent documents
    const recentDocuments = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        currentText: true,
        language: true,
        updatedAt: true,
      },
    });

    // Real usage records (corrected words)
    const usageRecords = await prisma.usageRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalWordsCorrected = usageRecords.reduce((acc, curr) => acc + curr.wordCount, 0);

    // Mode usage breakdown
    const sessions = await prisma.correctionSession.findMany({
      where: { userId: user.id },
      select: { writingMode: true },
    });

    const modeCounts: Record<string, number> = {};
    for (const s of sessions) {
      modeCounts[s.writingMode] = (modeCounts[s.writingMode] || 0) + 1;
    }

    const docsWithWordCount = recentDocuments.map((doc) => ({
      ...doc,
      wordCount: getWords(doc.currentText).length,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalDocuments,
        totalWordsCorrected,
        totalSessions: sessions.length,
        modeCounts,
      },
      recentDocuments: docsWithWordCount,
      recentActivity: usageRecords.slice(0, 5),
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: 'Failed to retrieve dashboard metrics' }, { status: 500 });
  }
}
