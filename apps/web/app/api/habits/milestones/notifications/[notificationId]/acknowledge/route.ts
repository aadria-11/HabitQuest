import { withApiAuth } from '@/lib/api-routes';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;

  return withApiAuth(async (_, apiToken) => {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/habits/milestones/notifications/${notificationId}/acknowledge`;

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to acknowledge notification' },
        { status: response.status }
      );
    }

    return new Response(null, { status: 204 });
  });
}
