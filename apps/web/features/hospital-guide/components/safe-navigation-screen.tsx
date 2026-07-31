import type {
  GuideFloor,
  GuidePlace,
  RouteAvailability,
  VerifiedRoute,
} from '@ready-on/contracts/hospital-guide';
import { useEffect, useState } from 'react';
import { MobileShell } from '../../caregiver-journey/components/mobile-shell';
import { validateVerifiedRoute } from '../hospital-guide-model';

interface SafeNavigationScreenProps {
  buildingName: string;
  destination: GuidePlace;
  floors: GuideFloor[];
  onBack: () => void;
  route: RouteAvailability;
  startFloorCode: string;
}

function floorCodeFromKey(floorKey: string) {
  return floorKey.split(':').at(-1) ?? floorKey;
}

function floorLabel(floors: GuideFloor[], floorKey: string) {
  const code = floorCodeFromKey(floorKey);
  return floors.find((floor) => floor.code === code)?.label ?? code;
}

function pointsToPolyline(points: [number, number][]) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function pointsToMotionPath(points: [number, number][]) {
  return points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
}

function destinationLabel(destination: GuidePlace) {
  return destination.officialName;
}

function MapOnlyNavigation({
  buildingName,
  destination,
  floor,
  floors,
  onBack,
  sourceUrl,
}: {
  buildingName: string;
  destination: GuidePlace;
  floor: GuideFloor | undefined;
  floors: GuideFloor[];
  onBack: () => void;
  sourceUrl: string;
}) {
  return (
    <MobileShell compactHeader>
      <main className="screen safe-navigation">
        <button className="text-back" onClick={onBack} type="button">
          ← 층별 안내
        </button>
        <p className="eyebrow">경로 검증 전 위치 안내</p>
        <h1 className="page-title">공식 지도에서 위치를 확인하세요</h1>
        <p className="lead">
          병원이 확인한 최신 복도 경로가 아직 연결되지 않아 이
          목적지에는 임의의 선을 표시하지 않습니다.
        </p>

        <section className="navigation-destination">
          <span aria-hidden="true">도착</span>
          <div>
            <small>
              {buildingName} {floor?.label ?? ''}
            </small>
            <h2>{destinationLabel(destination)}</h2>
          </div>
        </section>

        {floor?.mapImageUrl ? (
          <figure className="floor-map safe-navigation__map">
            <img
              alt={`${buildingName} ${floor.label} 공식 안내도`}
              src={floor.mapImageUrl}
            />
            <figcaption>
              지도와 현장 표지판을 함께 확인해 주세요.
            </figcaption>
          </figure>
        ) : (
          <div className="route-unavailable">
            앱에서 공식 안내도 이미지를 불러올 수 없습니다. 가까운
            안내 데스크에 문의해 주세요.
          </div>
        )}

        <a
          className="official-source"
          href={sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          삼성서울병원 공식 층별 안내 원문
        </a>
      </main>
    </MobileShell>
  );
}

function SegmentedNavigation({
  buildingName,
  destinationName,
  floors,
  notice,
  onBack,
  routeLabel,
  segments,
  sourceCheckedAt,
  sourceUrls,
  walkCaption,
}: {
  buildingName: string;
  destinationName: string;
  floors: GuideFloor[];
  notice?: string;
  onBack: () => void;
  routeLabel: string;
  segments: VerifiedRoute['segments'];
  sourceCheckedAt?: string;
  sourceUrls?: string[];
  walkCaption: string;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [mapZoomed, setMapZoomed] = useState(true);
  const step = segments[stepIndex];

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setMapZoomed(true);
  }, [stepIndex]);

  if (!step) return null;

  const nextStep = () =>
    setStepIndex((current) =>
      Math.min(current + 1, segments.length - 1),
    );

  return (
    <MobileShell compactHeader>
      <main className="screen safe-navigation">
        <button className="text-back" onClick={onBack} type="button">
          ← 층별 안내
        </button>
        <p className="eyebrow">{routeLabel}</p>
        <h1 className="page-title">{destinationName} 길찾기</h1>
        <p className="safe-navigation__progress">
          {stepIndex + 1} / {segments.length}
        </p>

        {step.kind === 'WALK' ? (
          <section className="verified-walk">
            <h2>{step.label}</h2>
            {(() => {
              const floor = floors.find(
                ({ code }) => code === floorCodeFromKey(step.floorKey),
              );
              const mapImageUrl = floor?.mapImageUrl;

              if (!floor || !mapImageUrl) {
                return (
                  <p className="route-unavailable">
                    이 경로와 연결된 검증 지도가 없습니다. 가까운 안내
                    데스크에 문의해 주세요.
                  </p>
                );
              }

              const firstPoint = step.points[0];
              const lastPoint = step.points.at(-1);
              const viewBox = '0 0 100 59.467';
              const routeCenterX =
                step.points.reduce((sum, [x]) => sum + x, 0) /
                step.points.length;
              const movesRight =
                firstPoint && lastPoint
                  ? lastPoint[0] >= firstPoint[0]
                  : false;
              const zoomTranslateX =
                (0.5 / 2.2 - routeCenterX / 100) * 100;
              return (
                <figure
                  className={`verified-floor-route ${
                    mapZoomed ? 'verified-floor-route--zoomed' : ''
                  }`}
                >
                  <div className="verified-floor-route__viewport">
                    <div
                      className="verified-floor-route__canvas"
                      style={
                        mapZoomed
                          ? {
                              transform: `translateX(${zoomTranslateX}%)`,
                            }
                          : undefined
                      }
                    >
                      <img
                        alt={`${buildingName} ${floor.label} 검증 안내도`}
                        src={mapImageUrl}
                      />
                      <svg
                        aria-label={`${floor.label}에서 이동할 검증 경로`}
                        className="verified-floor-route__overlay"
                        preserveAspectRatio="xMidYMid meet"
                        role="img"
                        viewBox={viewBox}
                      >
                      <defs>
                        <marker
                          id={`route-arrow-${stepIndex}`}
                          markerHeight="1.7"
                          markerUnits="userSpaceOnUse"
                          markerWidth="1.7"
                          orient="auto"
                          refX="4"
                          refY="2.5"
                          viewBox="0 0 5 5"
                        >
                          <path
                            d="M 0 0 L 5 2.5 L 0 5 Z"
                            data-testid="route-direction-arrow"
                          />
                        </marker>
                      </defs>
                      <polyline
                        data-testid="route-line"
                        fill="none"
                        markerEnd={`url(#route-arrow-${stepIndex})`}
                        points={pointsToPolyline(step.points)}
                      />
                      {firstPoint && (
                        <>
                          <g
                            className="verified-route-user verified-route-user--animated"
                            data-testid="route-user-marker"
                          >
                            <circle r={1.3} />
                            <circle
                              className="verified-route-user__dot"
                              r={0.48}
                            />
                            <animateMotion
                              dur="5s"
                              path={pointsToMotionPath(step.points)}
                              repeatCount="indefinite"
                            />
                          </g>
                          <g
                            className="verified-route-user verified-route-user--static"
                            transform={`translate(${firstPoint[0]} ${firstPoint[1]})`}
                          >
                            <circle r={1.3} />
                            <circle
                              className="verified-route-user__dot"
                              r={0.48}
                            />
                          </g>
                        </>
                      )}
                      {lastPoint && (
                        <g
                          className="verified-route-end"
                          data-testid="route-end-marker"
                          transform={`translate(${lastPoint[0]} ${lastPoint[1]})`}
                        >
                          <circle r={1.2} />
                          <circle r={0.42} />
                        </g>
                      )}
                      {firstPoint && (
                        <text
                          className="route-map-label"
                          textAnchor={movesRight ? 'end' : 'start'}
                          x={firstPoint[0] + (movesRight ? -1.8 : 1.8)}
                          y={firstPoint[1] - 1.7}
                        >
                          현재 위치
                        </text>
                      )}
                      {lastPoint && (
                        <text
                          className="route-map-label route-map-label--destination"
                          textAnchor={movesRight ? 'start' : 'end'}
                          x={lastPoint[0] + (movesRight ? 1.8 : -1.8)}
                          y={lastPoint[1] - 1.7}
                        >
                          {stepIndex === segments.length - 1
                            ? destinationName
                            : '엘리베이터'}
                        </text>
                      )}
                      </svg>
                    </div>
                  </div>
                  <figcaption>
                    {buildingName} {floor.label} · {walkCaption}
                  </figcaption>
                  <button
                    aria-pressed={mapZoomed}
                    className="map-zoom-button"
                    onClick={() => setMapZoomed((current) => !current)}
                    type="button"
                  >
                    {mapZoomed ? '전체 지도 보기' : '경로 확대'}
                  </button>
                </figure>
              );
            })()}
            {stepIndex < segments.length - 1 ? (
              <button
                className="primary-button"
                onClick={nextStep}
                type="button"
              >
                이동 수단에 도착했어요
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={onBack}
                type="button"
              >
                목적지에 도착했어요
              </button>
            )}
          </section>
        ) : (
          <section className="verified-transition">
            <p className="route-connector-name">
              {step.mode === 'ELEVATOR' &&
              step.bankId === 'main-blood-collection-nearby-lift'
                ? '채혈실 인근 엘리베이터'
                : step.mode === 'ELEVATOR'
                  ? '엘리베이터'
                  : '에스컬레이터'}
            </p>
            <span aria-hidden="true">
              {step.mode === 'ELEVATOR' ? '↕' : '↗'}
            </span>
            <h2>
              {floorLabel(floors, step.fromFloorKey)} →{' '}
              {floorLabel(floors, step.toFloorKey)}
            </h2>
            <p>
              {step.mode === 'ELEVATOR'
                ? '엘리베이터로 이동하세요'
                : step.direction === 'UP'
                  ? '에스컬레이터로 올라가세요'
                  : '에스컬레이터로 내려가세요'}
            </p>
            <button
              className="primary-button"
              onClick={nextStep}
              type="button"
            >
              {floorLabel(floors, step.toFloorKey)}에 도착했어요
            </button>
          </section>
        )}
        {notice && (
          <aside className="prototype-route-notice">
            <strong>경로 정확도 안내</strong>
            <p>{notice}</p>
            {sourceUrls?.map((url, index) => (
              <p key={url}>
                <a href={url} rel="noreferrer" target="_blank">
                  삼성서울병원 공식 {index === 0 ? '출발층' : '도착층'} 안내도
                </a>
                {sourceCheckedAt ? ` · 확인 ${sourceCheckedAt}` : ''}
              </p>
            ))}
          </aside>
        )}
      </main>
    </MobileShell>
  );
}

export function SafeNavigationScreen({
  buildingName,
  destination,
  floors,
  onBack,
  route,
  startFloorCode,
}: SafeNavigationScreenProps) {
  const startFloor = floors.find(({ code }) => code === startFloorCode);

  if (route.status === 'VERIFIED') {
    const verifiedRoute = validateVerifiedRoute(route);
    if (verifiedRoute) {
      const isHospitalVerified =
        verifiedRoute.sourceStatus === 'HOSPITAL_VERIFIED';
      return (
        <SegmentedNavigation
          buildingName={buildingName}
          destinationName={destinationLabel(destination)}
          floors={floors}
          onBack={onBack}
          notice={
            isHospitalVerified
              ? undefined
              : '현재 삼성서울병원 공식 층별 안내도에 표시된 대기실·엘리베이터·원무수납 위치와 복도 안에서 좌표화한 경로입니다.'
          }
          routeLabel={
            isHospitalVerified
              ? '병원 검증 경로'
              : '삼성서울병원 현재 공식 지도 기반 경로'
          }
          segments={verifiedRoute.segments}
          sourceCheckedAt={verifiedRoute.sourceCheckedAt}
          sourceUrls={verifiedRoute.sourceUrls}
          walkCaption={
            isHospitalVerified
              ? '병원이 검증한 복도 안에서만 이동선을 표시합니다.'
              : '공식 안내도에 표시된 복도와 승강기 위치에 맞춘 경로입니다.'
          }
        />
      );
    }
  }

  if (route.status === 'MAP_ONLY') {
    return (
      <MapOnlyNavigation
        buildingName={buildingName}
        destination={destination}
        floor={startFloor}
        floors={floors}
        onBack={onBack}
        sourceUrl={route.sourceUrl}
      />
    );
  }

  return (
    <MobileShell compactHeader>
      <main className="screen state-screen">
        <h1>확인된 이동 안내가 없습니다</h1>
        <p>
          {route.status === 'UNAVAILABLE'
            ? route.reason
            : '가까운 안내 데스크에 문의해 주세요.'}
        </p>
        <button className="primary-button" onClick={onBack} type="button">
          층별 안내로 돌아가기
        </button>
      </main>
    </MobileShell>
  );
}
