import { NextResponse } from 'next/server';
import { z } from 'zod';
import { aiService } from '@/lib/ai/provider';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getCurrentUser } from '@/lib/auth/session';

const ChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(2000),
    })
  ).min(1),
  documentContext: z.string().max(10000).optional(),
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
        { error: 'Rate limit reached. Please wait before asking more questions.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = ChatInputSchema.parse(body);

    const result = await aiService.chatWritingAssistant(
      validated.messages,
      validated.documentContext
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || 'Invalid chat message' },
        { status: 400 }
      );
    }
    console.error('Chat assistant error:', err);
    return NextResponse.json(
      { error: 'Writing assistant unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
