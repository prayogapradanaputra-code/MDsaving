import { Pool, type QueryResultRow } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __mdsavingPool: Pool | undefined
}

function getPool() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  if (!global.__mdsavingPool) {
    global.__mdsavingPool = new Pool({
      connectionString,
      ssl: false,
    })
  }

  return global.__mdsavingPool
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await getPool().query<T>(text, params)
  return result.rows
}
