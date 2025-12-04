import { createClient } from 'redis';

const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST_URL,
        port: Number(process.env.REDIS_PORT) || 15077
    }
});

client.on('error', err => console.log('Redis Client Error', err));

/**
 * @param {{doTest?: boolean}} options
 */
export async function connectRedis(options = { doTest: false }) {
    if (!client.isOpen) {
        await client.connect();
    }

    if (options.doTest) {
        try {
            await client.set('foo', 'bar');
            const result = await client.get('foo');
            console.log(result); // >>> bar
        } catch (e) {
            console.error('Redis test failed', e);
        }
    }

    return client;
}

