export type CatalogErrorCode =
  | 'EXTERNAL_CODE_DUPLICATE'
  | 'FORBIDDEN';

export class CatalogError extends Error {
  readonly name = 'CatalogError';

  constructor(
    public readonly code: CatalogErrorCode,
    message: string,
  ) {
    super(message);
  }
}
