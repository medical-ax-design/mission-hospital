import type {
  GuideBuildingId,
  HospitalGuideCatalog,
} from '@ready-on/contracts/hospital-guide';
import { useMemo, useState } from 'react';
import { MobileShell } from '../../caregiver-journey/components/mobile-shell';
import { sortFloors } from '../hospital-guide-model';
import { FloorDetailScreen } from './floor-detail-screen';

export interface HospitalGuideTarget {
  buildingId: GuideBuildingId;
  floorCode: string;
  placeId: string | null;
}

interface BuildingDirectoryScreenProps {
  catalog: HospitalGuideCatalog;
  initialTarget: HospitalGuideTarget | null;
  onBack: () => void;
}

function firstOrThrow<T>(items: T[], message: string): T {
  const first = items[0];
  if (!first) throw new Error(message);
  return first;
}

export function BuildingDirectoryScreen({
  catalog,
  initialTarget,
  onBack,
}: BuildingDirectoryScreenProps) {
  const defaultBuilding = firstOrThrow(
    catalog.buildings,
    '병원 건물 정보가 없습니다.',
  );
  const initialBuilding =
    catalog.buildings.find(
      ({ id }) => id === initialTarget?.buildingId,
    ) ?? defaultBuilding;
  const initialBuildingFloors = sortFloors(initialBuilding.floors);
  const initialFloor =
    initialBuilding.floors.find(
      ({ code }) => code === initialTarget?.floorCode,
    ) ??
    firstOrThrow(
      initialBuildingFloors,
      `${initialBuilding.name} 층 정보가 없습니다.`,
    );

  const [buildingId, setBuildingId] = useState(initialBuilding.id);
  const [floorCode, setFloorCode] = useState(initialFloor.code);
  const [selectedPlaceId, setSelectedPlaceId] = useState(
    initialTarget?.placeId ?? null,
  );
  const [query, setQuery] = useState('');

  const building =
    catalog.buildings.find(({ id }) => id === buildingId) ??
    defaultBuilding;
  const floors = useMemo(
    () => sortFloors(building.floors),
    [building.floors],
  );
  const defaultFloor = firstOrThrow(
    floors,
    `${building.name} 층 정보가 없습니다.`,
  );
  const floor =
    floors.find(({ code }) => code === floorCode) ?? defaultFloor;
  const undergroundFloors = floors.filter(({ level }) => level < 0);
  const abovegroundFloors = floors.filter(({ level }) => level > 0);
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  const matches = normalizedQuery
    ? building.floors.flatMap((candidateFloor) =>
        candidateFloor.places
          .filter((place) =>
            [place.officialName, ...place.aliases].some((term) =>
              term.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
            ),
          )
          .map((place) => ({ floor: candidateFloor, place })),
      )
    : [];

  const selectBuilding = (nextBuildingId: GuideBuildingId) => {
    const nextBuilding = catalog.buildings.find(
      ({ id }) => id === nextBuildingId,
    );
    if (!nextBuilding) return;

    setBuildingId(nextBuildingId);
    setFloorCode(
      firstOrThrow(
        sortFloors(nextBuilding.floors),
        `${nextBuilding.name} 층 정보가 없습니다.`,
      ).code,
    );
    setSelectedPlaceId(null);
    setQuery('');
  };

  const selectFloor = (nextFloorCode: string) => {
    setFloorCode(nextFloorCode);
    setSelectedPlaceId(null);
  };

  return (
    <MobileShell compactHeader>
      <main className="screen building-directory">
        <button className="text-back" onClick={onBack} type="button">
          ← 이용 안내
        </button>
        <p className="eyebrow">공식 공개자료 기준</p>
        <h1 className="page-title">전체 건물·층별 안내</h1>
        <p className="lead">
          건물과 층을 선택해 공식 안내도와 주요 시설을 확인하세요.
        </p>

        <div
          aria-label="병원 건물"
          className="building-tabs"
          role="tablist"
        >
          {catalog.buildings.map((candidate) => (
            <button
              aria-selected={candidate.id === building.id}
              className={
                candidate.id === building.id
                  ? 'building-tab building-tab--selected'
                  : 'building-tab'
              }
              key={candidate.id}
              onClick={() => selectBuilding(candidate.id)}
              role="tab"
              type="button"
            >
              {candidate.name}
            </button>
          ))}
        </div>

        <label className="directory-search">
          <span>시설 이름으로 찾기</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 원무, 수납, 검사실"
            type="search"
            value={query}
          />
        </label>

        {normalizedQuery && (
          <section className="directory-search-results" aria-live="polite">
            <h2>검색 결과</h2>
            {matches.length > 0 ? (
              <ul>
                {matches.map(({ floor: matchedFloor, place }) => (
                  <li key={place.id}>
                    <button
                      onClick={() => {
                        setFloorCode(matchedFloor.code);
                        setSelectedPlaceId(place.id);
                      }}
                      type="button"
                    >
                      <strong>{place.officialName}</strong>
                      <span>{matchedFloor.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>현재 등록된 공식 시설 정보에서 찾지 못했습니다.</p>
            )}
          </section>
        )}

        <section className="floor-selector" aria-label={`${building.name} 층 선택`}>
          {undergroundFloors.length > 0 && (
            <div>
              <h2>지하</h2>
              <div className="floor-selector__buttons">
                {undergroundFloors.map((candidateFloor) => (
                  <button
                    aria-pressed={candidateFloor.code === floor.code}
                    key={candidateFloor.code}
                    onClick={() => selectFloor(candidateFloor.code)}
                    type="button"
                  >
                    {candidateFloor.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {abovegroundFloors.length > 0 && (
            <div>
              <h2>지상</h2>
              <div className="floor-selector__buttons">
                {abovegroundFloors.map((candidateFloor) => (
                  <button
                    aria-pressed={candidateFloor.code === floor.code}
                    key={candidateFloor.code}
                    onClick={() => selectFloor(candidateFloor.code)}
                    type="button"
                  >
                    {candidateFloor.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <FloorDetailScreen
          building={building}
          floor={floor}
          selectedPlaceId={selectedPlaceId}
        />
      </main>
    </MobileShell>
  );
}
