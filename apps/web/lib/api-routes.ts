import { Session } from 'next-auth';
import { auth } from './auth';

export async function withApiAuth(
  handler: (session: Session, apiToken: string) => Promise<Response>
): Promise<Response> {
  try {
    const session = await auth();

    if (!session?.apiToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return await handler(session, session.apiToken);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
