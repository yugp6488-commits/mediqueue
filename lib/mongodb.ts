import { MongoClient, type Db } from 'mongodb'

const options = {}

type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
}

let prodClientPromise: Promise<MongoClient> | undefined

function requireMongoUri(): string {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable')
  }
  return uri
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = requireMongoUri()

  if (process.env.NODE_ENV === 'development') {
    const g = globalThis as GlobalMongo
    g._mongoClientPromise ??= new MongoClient(uri, options).connect()
    return g._mongoClientPromise
  }

  prodClientPromise ??= new MongoClient(uri, options).connect()
  return prodClientPromise
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient()
  const name = process.env.MONGODB_DB
  return name ? client.db(name) : client.db()
}
