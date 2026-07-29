import type { CreateProcedureInput } from '@ready-on/contracts';
import { CatalogError } from './catalog.errors.js';
import type {
  ActorContext,
  CatalogRepository,
} from './catalog.types.js';

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async create(input: CreateProcedureInput, actor: ActorContext) {
    if (actor.role !== 'ADMIN') {
      throw new CatalogError('FORBIDDEN', '항목 등록 권한이 없습니다.');
    }

    if (
      input.externalCode &&
      (await this.repository.findByExternalCode(
        actor.organizationId,
        input.externalCode,
      ))
    ) {
      throw new CatalogError(
        'EXTERNAL_CODE_DUPLICATE',
        '이미 사용 중인 외부 코드입니다.',
      );
    }

    return this.repository.create(input, actor);
  }

  async search(query: string, limit: number, actor: ActorContext) {
    if (actor.role === 'PATIENT') {
      throw new CatalogError(
        'FORBIDDEN',
        '카탈로그 조회 권한이 없습니다.',
      );
    }

    return this.repository.search(
      actor.organizationId,
      query.trim(),
      Math.min(Math.max(limit, 1), 100),
    );
  }
}
