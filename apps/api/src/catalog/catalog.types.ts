import type {
  CreateProcedureInput,
  Procedure,
} from '@ready-on/contracts';

export type ActorContext = {
  id: string;
  organizationId: string;
  role: 'ADMIN' | 'STAFF' | 'PATIENT';
};

export interface CatalogRepository {
  findByExternalCode(
    organizationId: string,
    externalCode: string,
  ): Promise<Procedure | null>;
  create(
    input: CreateProcedureInput,
    actor: ActorContext,
  ): Promise<Procedure>;
  search(
    organizationId: string,
    query: string,
    limit: number,
  ): Promise<Procedure[]>;
}
