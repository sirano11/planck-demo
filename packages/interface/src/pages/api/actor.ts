import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from 'redis';
import { z } from 'zod';

const client = await createClient({
  url: process.env.REDIS_URL!,
})
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const schema = z.object({
    address: z.string(),
    chain: z.union([z.literal('sui'), z.literal('sol')]),
  });
  const { address, chain } = schema.parse(request.query);

  if (!address) {
    response.status(400).send('Error: sender address is required');
    return;
  }

  try {
    const actorAddress = await client.hGet(`eth:${address}`, chain);

    if (!actorAddress) {
      response
        .status(404)
        .send(
          'Error: Actor address not found for the provided sender address in the specified chain',
        );
      return;
    }

    response.status(200).send({ actorAddress });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
}
