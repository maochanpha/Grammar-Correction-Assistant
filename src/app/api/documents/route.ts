import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const DocumentCreateSchema = z.object({
  title: z.string().min(1).max(100).default('Untitled Document'),
  originalText: z.string().default(''),
  currentText: z.string().default(''),
  language: z.enum(['en-US', 'en-GB']).default('en-US'),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt'; // 'updatedAt' | 'title' | 'createdAt'
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { currentText: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: {
        [sortBy]: order,
      },
      select: {
        id: true,
        title: true,
        originalText: true,
        currentText: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { correctionSessions: true },
        },
      },
    });

    return NextResponse.json({ success: true, documents });
  } catch (err) {
    console.error('List documents error:', err);
    return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = DocumentCreateSchema.parse(body);

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        title: validated.title.trim() || 'Untitled Document',
        originalText: validated.originalText,
        currentText: validated.currentText,
        language: validated.language,
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error('Create document error:', err);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
