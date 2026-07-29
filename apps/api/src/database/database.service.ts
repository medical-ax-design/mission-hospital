import type { ActorContext } from '../catalog/catalog.types.js';
import { sql } from 'drizzle-orm';
import {
  drizzle,
  type PostgresJsDatabase,
} from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema.js';

export type ReadyOnDatabase = Pick<
  PostgresJsDatabase<typeof schema>,
  'insert' | 'select'
>;

export class DatabaseService {
  private readonly sql: Sql;
  private readonly database: PostgresJsDatabase<typeof schema>;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, {
      max: 10,
    });
    this.database = drizzle(this.sql, {
      schema,
    });
  }

  async withActor<T>(
    actor: ActorContext,
    work: (database: ReadyOnDatabase) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(async (transaction) => {
      await transaction.execute(sql`
        select set_config(
          'app.organization_id',
          ${actor.organizationId},
          true
        )
      `);
      await transaction.execute(sql`
        select set_config(
          'app.actor_id',
          ${actor.id},
          true
        )
      `);

      return work(transaction);
    });
  }

  async close(): Promise<void> {
    await this.sql.end();
  }
}
