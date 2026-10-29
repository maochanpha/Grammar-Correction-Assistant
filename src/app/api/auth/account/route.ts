import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, hashPassword, verifyPassword, COOKIE_NAME } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateProfileSchema.parse(body);

    const updateData: { name?: string; passwordHash?: string } = {};

    if (validated.name) {
      updateData.name = validated.name.trim();
    }

    if (validated.newPassword) {
      if (!validated.currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser || !dbUser.passwordHash) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isValid = await verifyPassword(validated.currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      updateData.passwordHash = await hashPassword(validated.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    }
    console.error('Account update error:', err);
    return NextResponse.json({ error: 'Failed to update account details' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user (cascades to preferences, documents, sessions, usage records)
    await prisma.user.delete({
      where: { id: user.id },
    });

    const response = NextResponse.json({ success: true, message: 'Account deleted' });
    response.cookies.delete(COOKIE_NAME);
    return response;
  } catch (err: unknown) {
    console.error('Delete account error:', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
