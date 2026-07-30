import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  HospitalGuideCatalog,
  HospitalGuidePurposeResult,
} from '@ready-on/contracts';
import { officialHospitalGuideCatalog } from './official-hospital-guide.data.js';

@Injectable()
export class HospitalGuideService {
  getCatalog(): HospitalGuideCatalog {
    return structuredClone(officialHospitalGuideCatalog);
  }

  findPurpose(query: string): HospitalGuidePurposeResult {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    const purpose = officialHospitalGuideCatalog.purposes.find(
      (candidate) =>
        candidate.name.toLocaleLowerCase('ko-KR').includes(normalizedQuery) ||
        candidate.searchTerms.some((term) =>
          term.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
        ),
    );

    if (!normalizedQuery || !purpose) {
      throw new NotFoundException('등록된 병원 이용 목적이 없습니다.');
    }

    const places = purpose.options.flatMap((option) => {
      if (!option.placeId) return [];

      for (const building of officialHospitalGuideCatalog.buildings) {
        for (const floor of building.floors) {
          const matched = floor.places.find(
            ({ id }) => id === option.placeId,
          );
          if (matched) {
            return [
              {
                buildingId: building.id,
                floorCode: floor.code,
                place: matched,
              },
            ];
          }
        }
      }

      return [];
    });

    return structuredClone({ purpose, places });
  }
}
