import { NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/ai/provider';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getWords } from '@/lib/ai/text-analysis';

const CorrectInputSchema = z.object({
  text: z.string().min(1, 'Please enter text to check').max(15000, 'Text exceeds maximum length (15,000 characters)'),
  mode: z.enum([
    'grammar_fix',
    'improve_writing',
    'professional',
    'casual',
    'formal',
    'simplify',
    'shorten',
    'expand',
    'academic',
    'friendly',
  ]).default('grammar_fix'),
  language: z.enum(['en-US', 'en-GB']).default('en-US'),
  explanationLevel: z.enum(['simple', 'detailed']).default('simple'),
  explanationLanguage: z.enum(['en', 'km']).default('en'),
  documentId: z.string().optional(),
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
        {
          error: `Rate limit reached. Please wait ${rateCheck.resetInSeconds} seconds or sign in for higher limits.`,
          resetInSeconds: rateCheck.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetInSeconds),
          },
        }
      );
    }

    const body = await request.json();
    const validated = CorrectInputSchema.parse(body);

    const result = await aiService.correctGrammar(
      validated.text,
      validated.mode,
      validated.language,
      validated.explanationLevel,
      validated.explanationLanguage
    );

    const wordCount = getWords(validated.text).length;

    // Record usage in background / db
    try {
      await prisma.usageRecord.create({
        data: {
          userId: user?.id,
          guestIp: user ? null : clientIp,
          requestType: 'grammar_correct',
          wordCount,
        },
      });

      // If documentId is provided and user owns document, save session
      if (user && validated.documentId) {
        const doc = await prisma.document.findFirst({
          where: { id: validated.documentId, userId: user.id },
        });

        if (doc) {
          const session = await prisma.correctionSession.create({
            data: {
              documentId: doc.id,
              userId: user.id,
              writingMode: validated.mode,
              language: validated.language,
              originalText: validated.text,
              correctedText: result.correctedText,
              explanationLevel: validated.explanationLevel,
            },
          });

          if (result.suggestions.length > 0) {
            await prisma.correctionSuggestion.createMany({
              data: result.suggestions.map((s) => ({
                sessionId: session.id,
                category: s.category,
                originalPhrase: s.originalPhrase,
                replacementPhrase: s.replacementPhrase,
                explanation: s.explanation,
                startIndex: s.startIndex,
                endIndex: s.endIndex,
                status: 'pending',
              })),
            });
          }
        }
      }
    } catch (dbErr) {
      // Don't fail user request if analytics logging fails
      console.warn('Failed to record usage analytics:', dbErr);
    }

    return NextResponse.json({
      success: true,
      data: result,
      rateLimit: {
        remaining: rateCheck.remaining,
        total: rateCheck.totalLimit,
      },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || 'Invalid request parameters' },
        { status: 400 }
      );
    }
    console.error('Error in /api/correct:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your text. Please try again.' },
      { status: 500 }
    );
  }
}
