import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  HospitalGuideCatalog,
  HospitalGuidePurposeResult,
} from '@ready-on/contracts';
import {
  findOfficialHospitalGuidePurpose,
  officialHospitalGuideCatalog,
} from '@ready-on/contracts';

@Injectable()
export class HospitalGuideService {
  getCatalog(): HospitalGuideCatalog {
    return structuredClone(officialHospitalGuideCatalog);
  }

  findPurpose(query: string): HospitalGuidePurposeResult {
    const result = findOfficialHospitalGuidePurpose(query);
    if (!result) {
      throw new NotFoundException('등록된 병원 이용 목적이 없습니다.');
    }
    return structuredClone(result);
  }
}
