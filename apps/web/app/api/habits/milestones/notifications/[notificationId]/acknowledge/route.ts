import { auth } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const session = await auth();
  const { notificationId } = await params;

  if (!session?.apiToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/habits/milestones/notifications/${notificationId}/acknowledge`;

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${session.apiToken}`,
    },
  });

  if (!response.ok) {
    return Response.json(
      { error: 'Failed to acknowledge notification' },
      { status: response.status }
    );
  }

  return new Response(null, { status: 204 });
}
