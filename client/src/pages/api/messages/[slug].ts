import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  messages: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === 'GET') {
    try {
      const slug = req.query.slug as string;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/chats/messages/${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ messages: [message] });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
