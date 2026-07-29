import type {
  CreateProcedureInput,
  Procedure,
} from '@ready-on/contracts';
import {
  and,
  asc,
  eq,
  ilike,
  or,
} from 'drizzle-orm';
import type { ReadyOnDatabase } from '../database/database.service.js';
import { procedureCatalog } from '../database/schema.js';
import type {
  ActorContext,
  CatalogRepository,
} from './catalog.types.js';

type ProcedureRow = typeof procedureCatalog.$inferSelect;

function toProcedure(row: ProcedureRow): Procedure {
  return {
    id: row.id,
    procedureType: row.procedureType,
    name: row.name,
    externalCode: row.externalCode,
    department: row.department,
    description: row.description,
    isActive: row.isActive,
    rowVersion: row.rowVersion,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class DrizzleCatalogRepository implements CatalogRepository {
  constructor(private readonly database: ReadyOnDatabase) {}

  async findByExternalCode(
    organizationId: string,
    externalCode: string,
  ): Promise<Procedure | null> {
    const [row] = await this.database
      .select()
      .from(procedureCatalog)
      .where(
        and(
          eq(procedureCatalog.organizationId, organizationId),
          eq(procedureCatalog.externalCode, externalCode),
        ),
      )
      .limit(1);

    return row ? toProcedure(row) : null;
  }

  async create(
    input: CreateProcedureInput,
    actor: ActorContext,
  ): Promise<Procedure> {
    const [row] = await this.database
      .insert(procedureCatalog)
      .values({
        organizationId: actor.organizationId,
        procedureType: input.procedureType,
        name: input.name,
        normalizedName: input.name.toLocaleLowerCase('ko-KR'),
        externalCode: input.externalCode,
        department: input.department,
        description: input.description,
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .returning();

    if (!row) {
      throw new Error('Procedure insert returned no row.');
    }

    return toProcedure(row);
  }

  async search(
    organizationId: string,
    query: string,
    limit: number,
  ): Promise<Procedure[]> {
    const pattern = `%${query.toLocaleLowerCase('ko-KR')}%`;
    const rows = await this.database
      .select()
      .from(procedureCatalog)
      .where(
        and(
          eq(procedureCatalog.organizationId, organizationId),
          eq(procedureCatalog.isActive, true),
          or(
            ilike(procedureCatalog.normalizedName, pattern),
            ilike(procedureCatalog.externalCode, pattern),
          ),
        ),
      )
      .orderBy(asc(procedureCatalog.name))
      .limit(limit);

    return rows.map(toProcedure);
  }
}
