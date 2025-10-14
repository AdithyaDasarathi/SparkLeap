import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create a test user object
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/150',
    verified_email: true,
    loginAt: new Date().toISOString(),
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token'
  };

  return res.status(200).json({
    success: true,
    user: testUser,
    message: 'Test user created'
  });
}
