import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 *
 * Next.js re-evaluates modules on hot reload in development and reuses
 * processes in production, so connecting per call would leak connections until
 * the pool is exhausted. The *promise* is cached rather than the connection so
 * that concurrent callers during a cold start share one in-flight connect
 * instead of racing to open several.
 */
type MongoCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongo = globalThis as typeof globalThis & {
  __productionOsMongo?: MongoCache;
};

function cache(): MongoCache {
  globalForMongo.__productionOsMongo ??= { conn: null, promise: null };
  return globalForMongo.__productionOsMongo;
}

export async function connectMongo(uri?: string): Promise<typeof mongoose> {
  const c = cache();
  if (c.conn) return c.conn;

  const target = uri ?? process.env.MONGODB_URI;
  if (!target) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  c.promise ??= mongoose.connect(target).then((m) => {
    c.conn = m;
    return m;
  });

  try {
    return await c.promise;
  } catch (err) {
    // A failed connect must not leave a rejected promise cached, or every
    // later call replays the same failure instead of retrying.
    c.promise = null;
    throw err;
  }
}

/** Closes the connection and clears the cache. Used by tests and shutdown. */
export async function disconnectMongo(): Promise<void> {
  const c = cache();
  if (c.conn) await c.conn.disconnect();
  c.conn = null;
  c.promise = null;
}
