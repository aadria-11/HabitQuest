import { withApiAuth } from '@/lib/api-routes';

export async function GET() {
  return withApiAuth(async (_, apiToken) => {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/habits/milestones/notifications/unacknowledged`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
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
  });
}
