import { createClient } from 'redis'

const redisOptions: any = {
  socket: {
    port: Number(process.env.REDIS_PORT) || 15077,
  },
}

if (process.env.REDIS_HOST_URL) {
  redisOptions.socket.host = process.env.REDIS_HOST_URL
}

if (process.env.REDIS_USERNAME) {
  redisOptions.username = process.env.REDIS_USERNAME
}

if (process.env.REDIS_PASSWORD) {
  redisOptions.password = process.env.REDIS_PASSWORD
}

const client = createClient(redisOptions)

client.on('error', (err) => console.log('Redis Client Error', err))

/**
 * @param {{doTest?: boolean}} options
 */
export async function connectRedis(options = { doTest: false }) {
  if (!client.isOpen) {
    await client.connect()
  }

  if (options.doTest) {
    try {
      await client.set('foo', 'bar')
      const result = await client.get('foo')
      console.log(result) // >>> bar
    } catch (e) {
      console.error('Redis test failed', e)
    }
  }

  return client
}
