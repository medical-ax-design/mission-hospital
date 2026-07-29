import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { procedureCatalog } from './schema.js';

describe('procedureCatalog schema', () => {
  it('UUID id와 nullable externalCode를 노출한다', () => {
    const config = getTableConfig(procedureCatalog);
    const id = config.columns.find((column) => column.name === 'id');
    const externalCode = config.columns.find(
      (column) => column.name === 'external_code',
    );

    expect(id?.notNull).toBe(true);
    expect(externalCode?.notNull).toBe(false);
  });
});
