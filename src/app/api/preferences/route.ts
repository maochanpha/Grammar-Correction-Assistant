import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const PreferencesSchema = z.object({
  preferredEnglishVariant: z.enum(['en-US', 'en-GB']).optional(),
  preferredWritingMode: z.enum([
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
  ]).optional(),
  explanationLevel: z.enum(['simple', 'detailed']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  autoSave: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          preferredEnglishVariant: 'en-US',
          preferredWritingMode: 'grammar_fix',
          explanationLevel: 'simple',
          theme: 'system',
          autoSave: true,
        },
      });
    }

    return NextResponse.json({ success: true, preferences });
  } catch (err) {
    console.error('Get preferences error:', err);
    return NextResponse.json({ error: 'Failed to retrieve preferences' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = PreferencesSchema.parse(body);

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        preferredEnglishVariant: validated.preferredEnglishVariant || 'en-US',
        preferredWritingMode: validated.preferredWritingMode || 'grammar_fix',
        explanationLevel: validated.explanationLevel || 'simple',
        theme: validated.theme || 'system',
        autoSave: validated.autoSave ?? true,
      },
      update: {
        ...(validated.preferredEnglishVariant ? { preferredEnglishVariant: validated.preferredEnglishVariant } : {}),
        ...(validated.preferredWritingMode ? { preferredWritingMode: validated.preferredWritingMode } : {}),
        ...(validated.explanationLevel ? { explanationLevel: validated.explanationLevel } : {}),
        ...(validated.theme ? { theme: validated.theme } : {}),
        ...(validated.autoSave !== undefined ? { autoSave: validated.autoSave } : {}),
      },
    });

    return NextResponse.json({ success: true, preferences });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error('Update preferences error:', err);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
