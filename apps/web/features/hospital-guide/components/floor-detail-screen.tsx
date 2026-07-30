import type {
  GuideBuilding,
  GuideFloor,
} from '@ready-on/contracts/hospital-guide';
import { useState } from 'react';
import { getPrototypeDestinationPoint } from '../hospital-guide-model';

interface FloorDetailScreenProps {
  building: GuideBuilding;
  floor: GuideFloor;
  selectedPlaceId: string | null;
  onNavigate: (placeId: string) => void;
}

function placeLabel(
  officialNumber: string | null,
  officialName: string,
) {
  return officialNumber
    ? `${officialNumber}. ${officialName}`
    : officialName;
}

export function FloorDetailScreen({
  building,
  floor,
  selectedPlaceId,
  onNavigate,
}: FloorDetailScreenProps) {
  const [mapFailed, setMapFailed] = useState(false);
  const selectedPlace = floor.places.find(
    ({ id }) => id === selectedPlaceId,
  );
  const supportsPrototypeRoute = selectedPlace
    ? getPrototypeDestinationPoint(floor.code, selectedPlace.id) !==
      null
    : false;

  return (
    <section className="floor-detail" aria-labelledby="floor-detail-title">
      <div className="floor-detail__heading">
        <p className="eyebrow">삼성서울병원 공식 층별 안내</p>
        <h2 id="floor-detail-title">
          {building.name} {floor.label}
        </h2>
      </div>

      {floor.mapImageUrl && !mapFailed ? (
        <figure className="floor-map">
          {/* 공식 공개 안내 이미지는 위치 확인용이며 경로선을 합성하지 않는다. */}
          <img
            alt={`${building.name} ${floor.label} 공식 안내도`}
            onError={() => setMapFailed(true)}
            src={floor.mapImageUrl}
          />
          <figcaption>
            현재는 공식 위치 확인만 제공합니다. 병원이 검증한 복도
            경로가 등록되기 전에는 임의의 길찾기 선을 표시하지
            않습니다.
          </figcaption>
        </figure>
      ) : (
        <div className="floor-map floor-map--unavailable">
          <strong>안내도 이미지를 불러올 수 없습니다</strong>
          <p>아래 공식 원문에서 이 층의 위치를 확인해 주세요.</p>
        </div>
      )}

      <section className="floor-place-list" aria-labelledby="place-list-title">
        <h3 id="place-list-title">이 층의 주요 시설</h3>
        {floor.places.length > 0 ? (
          <ul>
            {floor.places.map((place) => (
              <li
                aria-current={
                  place.id === selectedPlaceId ? 'location' : undefined
                }
                className={
                  place.id === selectedPlaceId
                    ? 'floor-place floor-place--selected'
                    : 'floor-place'
                }
                key={place.id}
              >
                {place.id === selectedPlaceId && (
                  <span className="floor-place__badge">찾는 장소</span>
                )}
                <strong>
                  {placeLabel(
                    place.officialNumber,
                    place.officialName,
                  )}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="floor-place-list__empty">
            앱에 옮겨 적어 검증한 시설 목록은 아직 없습니다. 공식
            원문에서 전체 시설을 확인해 주세요.
          </p>
        )}
      </section>

      {selectedPlace && (
        <button
          className="primary-button floor-detail__navigation"
          onClick={() => onNavigate(selectedPlace.id)}
          type="button"
        >
          {supportsPrototypeRoute
            ? '현재 위치 선택하고 길찾기'
            : '공식 지도에서 위치 확인'}
        </button>
      )}

      <a
        className="official-source"
        href={floor.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        삼성서울병원 공식 층별 안내 원문
      </a>
    </section>
  );
}
