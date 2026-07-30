import { describe, expect, it } from 'vitest';
import { createProcedureSchema } from './catalog.js';

describe('createProcedureSchema', () => {
  it('외부 코드의 빈 문자열을 null로 정규화한다', () => {
    const result = createProcedureSchema.parse({
      procedureType: 'EXAM',
      name: '대장내시경',
      externalCode: '   ',
      department: '소화기내과',
      description: '데모용 검사 항목',
    });

    expect(result.externalCode).toBeNull();
  });

  it('공백뿐인 검사 이름을 거부한다', () => {
    const result = createProcedureSchema.safeParse({
      procedureType: 'EXAM',
      name: '   ',
      externalCode: null,
      department: '소화기내과',
    });

    expect(result.success).toBe(false);
  });
});
