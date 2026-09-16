import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.apiToken) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/habits/milestones/notifications/unacknowledged`;

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.apiToken}`,
    },
  });

  if (!response.ok) {
    return Response.json(
      { error: 'Failed to fetch notifications' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return Response.json(data);
}
