import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const DocumentUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  currentText: z.string().optional(),
  originalText: z.string().optional(),
  language: z.enum(['en-US', 'en-GB']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: { id, userId: user.id },
      include: {
        correctionSessions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { suggestions: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, document });
  } catch (err) {
    console.error('Get document error:', err);
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = DocumentUpdateSchema.parse(body);

    const existing = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(validated.title !== undefined ? { title: validated.title.trim() } : {}),
        ...(validated.currentText !== undefined ? { currentText: validated.currentText } : {}),
        ...(validated.originalText !== undefined ? { originalText: validated.originalText } : {}),
        ...(validated.language !== undefined ? { language: validated.language } : {}),
      },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error('Update document error:', err);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.document.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Delete document error:', err);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
