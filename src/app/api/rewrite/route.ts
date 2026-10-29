import { NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/ai/provider';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getWords } from '@/lib/ai/text-analysis';

const RewriteInputSchema = z.object({
  sentence: z.string().min(1, 'Please select or provide a sentence').max(1000, 'Sentence is too long for rewrite assistant (max 1,000 characters)'),
  tone: z.enum([
    'professional',
    'polite',
    'confident',
    'natural',
    'shorter',
    'clearer',
    'friendly',
    'formal',
  ]).default('professional'),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const identifier = user ? user.id : clientIp;
    const rateCheck = checkRateLimit(identifier, Boolean(user));

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = RewriteInputSchema.parse(body);

    const result = await aiService.rewriteSentence(validated.sentence, validated.tone);

    try {
      await prisma.usageRecord.create({
        data: {
          userId: user?.id,
          guestIp: user ? null : clientIp,
          requestType: 'rewrite',
          wordCount: getWords(validated.sentence).length,
        },
      });
    } catch {
      // Ignore background analytics logging errors
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || 'Invalid rewrite parameters' },
        { status: 400 }
      );
    }
    console.error('Rewrite error:', err);
    return NextResponse.json(
      { error: 'Failed to rewrite sentence. Please try again.' },
      { status: 500 }
    );
  }
}
