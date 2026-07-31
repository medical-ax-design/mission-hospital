import type {
  GuideFloor,
  GuidePlace,
  RouteAvailability,
  VerifiedRoute,
} from '@ready-on/contracts/hospital-guide';
import { useEffect, useState, type MouseEvent } from 'react';
import { MobileShell } from '../../caregiver-journey/components/mobile-shell';
import {
  getPrototypeDestinationPoint,
  getPrototypeGuidedRouteOptions,
  getPrototypeRoute,
  validateVerifiedRoute,
  type PrototypeGuidedRouteOption,
  type PrototypeRouteResult,
} from '../hospital-guide-model';

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

const prototypeLocationOptions: Array<{
  label: string;
  point: [number, number];
}> = [
  { label: 'GATE 6', point: [34, 85] },
  { label: 'GATE 7', point: [46, 8] },
  { label: 'GATE 8', point: [76, 49] },
  { label: '외래 엘리베이터', point: [41, 47] },
];

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
  const [prototypeRoute, setPrototypeRoute] =
    useState<PrototypeRouteResult | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(
    null,
  );
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<
    string | null
  >(null);
  const [guidedRoute, setGuidedRoute] =
    useState<PrototypeGuidedRouteOption | null>(null);
  const prototypeDestinationPoint = floor
    ? getPrototypeDestinationPoint(floor.code, destination.id)
    : null;
  const guidedRouteOptions = getPrototypeGuidedRouteOptions(
    destination.id,
  );
  const supportsMapSelection = prototypeDestinationPoint !== null;
  const supportsPrototypeRoute =
    supportsMapSelection || guidedRouteOptions.length > 0;

  if (guidedRoute) {
    return (
      <SegmentedNavigation
        buildingName={buildingName}
        destination={destination}
        floors={floors}
        notice="현재 시연 범위는 본관 1·2층의 채혈실, 외래 엘리베이터, 원무수납/접수 구간입니다. 공식 안내도 위에 구현한 발표용 이동선이며, 실제 서비스 전 병원의 전체 복도·연결통로·승강기·공사 정보를 현장에서 검증해야 합니다."
        onBack={() => setGuidedRoute(null)}
        routeLabel="발표용 시연 경로"
        segments={guidedRoute.segments}
        walkCaption="선택한 현재 위치에서 목적지까지 층별 시연 이동선을 표시합니다."
      />
    );
  }

  const applyCurrentPosition = (
    selectedPoint: [number, number],
    locationLabel: string,
  ) => {
    if (!floor) return;
    const nextRoute = getPrototypeRoute(
      floor.code,
      destination.id,
      selectedPoint,
    );

    if (!nextRoute) {
      setPrototypeRoute(null);
      setSelectedLocationLabel(null);
      setSelectionError(
        '복도 또는 출입구 위에서 현재 위치를 다시 선택해 주세요.',
      );
      return;
    }

    setPrototypeRoute(nextRoute);
    setSelectedLocationLabel(locationLabel);
    setSelectionError(null);
  };

  const selectCurrentPosition = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (
      event.detail === 0 &&
      event.clientX === 0 &&
      event.clientY === 0
    ) {
      setSelectionError(
        '키보드로 이용할 때는 지도 아래의 현재 위치 버튼을 선택해 주세요.',
      );
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    applyCurrentPosition(
      [
        ((event.clientX - bounds.left) / bounds.width) * 100,
        ((event.clientY - bounds.top) / bounds.height) * 100,
      ],
      '지도에서 선택한 위치',
    );
  };

  const resetCurrentPosition = () => {
    setPrototypeRoute(null);
    setSelectedLocationLabel(null);
    setSelectionError(null);
  };

  return (
    <MobileShell compactHeader>
      <main className="screen safe-navigation">
        <button className="text-back" onClick={onBack} type="button">
          ← 층별 안내
        </button>
        <p className="eyebrow">
          {supportsPrototypeRoute
            ? '공식 지도 기반 길찾기 시연'
            : '경로 검증 전 위치 안내'}
        </p>
        <h1 className="page-title">
          {supportsPrototypeRoute
            ? '지도에서 현재 위치를 선택하세요'
            : '공식 지도에서 위치를 확인하세요'}
        </h1>
        <p className="lead">
          {supportsPrototypeRoute
            ? '현재 서 있는 복도나 출입구를 누르면 목적지까지 이동선을 표시합니다.'
            : '병원이 확인한 복도 경로가 아직 등록되지 않아 임의의 선을 표시하지 않습니다.'}
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

        {supportsPrototypeRoute && (
          <section
            aria-labelledby="prototype-location-title"
            className="prototype-location-picker"
          >
            <div>
              <p className="eyebrow">출발</p>
              <h2 id="prototype-location-title">현재 위치를 선택하세요</h2>
              <p>
                {supportsMapSelection
                  ? '가까운 출입구를 선택하거나 아래 지도에서 현재 위치를 눌러 주세요.'
                  : '현재 있는 층과 가까운 장소를 선택해 주세요.'}
              </p>
            </div>
            <div className="prototype-location-picker__options">
              {supportsMapSelection &&
                prototypeLocationOptions.map((option) => (
                  <button
                    aria-pressed={
                      selectedLocationLabel === option.label
                    }
                    key={option.label}
                    onClick={() =>
                      applyCurrentPosition(option.point, option.label)
                    }
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              {guidedRouteOptions.map((option) => (
                <button
                  aria-pressed="false"
                  key={option.id}
                  onClick={() => setGuidedRoute(option)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {floor?.mapImageUrl ? (
          <figure
            className={`floor-map safe-navigation__map ${
              supportsPrototypeRoute
                ? 'prototype-floor-route'
                : ''
            }`}
          >
            {supportsMapSelection ? (
              <button
                aria-label="지도에서 현재 위치 선택"
                className="prototype-floor-route__canvas"
                onClick={selectCurrentPosition}
                type="button"
              >
                <img
                  alt={`${buildingName} ${floor.label} 공식 안내도`}
                  draggable="false"
                  src={floor.mapImageUrl}
                />
                <svg
                  aria-label="현재 위치에서 목적지까지의 시연 경로"
                  className="verified-floor-route__overlay"
                  preserveAspectRatio="none"
                  role="img"
                  viewBox="0 0 100 100"
                >
                  {prototypeRoute && (
                    <>
                      <polyline
                        data-testid="prototype-route-line"
                        fill="none"
                        points={pointsToPolyline(prototypeRoute.points)}
                      />
                      <g
                        className="prototype-route-user"
                        data-testid="prototype-route-user-marker"
                        transform={`translate(${prototypeRoute.currentPoint[0]} ${prototypeRoute.currentPoint[1]})`}
                      >
                        <circle className="prototype-route-user__pulse" r="4.4" />
                        <circle r="2.4" />
                      </g>
                    </>
                  )}
                  <g
                    className="prototype-route-destination"
                    data-testid="prototype-route-destination"
                    transform={`translate(${
                      prototypeRoute?.destinationPoint[0] ??
                      prototypeDestinationPoint[0]
                    } ${
                      prototypeRoute?.destinationPoint[1] ??
                      prototypeDestinationPoint[1]
                    })`}
                  >
                    <circle r="3.5" />
                    <path d="M -1.1 -0.4 L -0.1 0.7 L 1.5 -1" />
                  </g>
                </svg>
              </button>
            ) : (
              <img
                alt={`${buildingName} ${floor.label} 공식 안내도`}
                src={floor.mapImageUrl}
              />
            )}
            <figcaption>
              {prototypeRoute
                ? `${selectedLocationLabel}를 가장 가까운 복도에 맞췄습니다. 붉은 선을 따라 이동하세요.`
                : supportsPrototypeRoute
                  ? supportsMapSelection
                    ? '목적지는 표시되어 있습니다. 현재 서 있는 복도나 출입구를 눌러 주세요.'
                    : '위의 현재 위치를 선택하면 출발층부터 목적지 층까지 순서대로 안내합니다.'
                  : '지도와 현장 표지판을 함께 확인해 주세요.'}
            </figcaption>
          </figure>
        ) : (
          <div className="route-unavailable">
            앱에서 공식 안내도 이미지를 불러올 수 없습니다. 가까운
            안내 데스크에 문의해 주세요.
          </div>
        )}

        {selectionError && (
          <p className="route-selection-error" role="alert">
            {selectionError}
          </p>
        )}

        {prototypeRoute && selectedLocationLabel && (
          <section
            aria-live="polite"
            className="prototype-route-summary"
          >
            <div>
              <p className="eyebrow">경로 안내</p>
              <h2>
                {selectedLocationLabel}에서{' '}
                {destination.officialName}까지
              </h2>
            </div>
            <ol>
              <li>
                <span>1</span>
                현재 위치의 붉은 점에서 출발하세요.
              </li>
              <li>
                <span>2</span>
                지도 안의 붉은 선을 따라 이동하세요.
              </li>
              <li>
                <span>3</span>
                초록색 도착 표식에서 시설명을 확인하세요.
              </li>
            </ol>
            <button
              className="secondary-button"
              onClick={resetCurrentPosition}
              type="button"
            >
              현재 위치 다시 선택
            </button>
          </section>
        )}

        {supportsPrototypeRoute && (
          <aside className="prototype-route-notice">
            <strong>발표용 시연 경로입니다</strong>
            <p>
              공식 층별 안내도 위에 구현한 경로이며, 실제 서비스 전
              병원의 복도·출입구·공사 정보를 현장에서 검증해야 합니다.
            </p>
          </aside>
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
  destination,
  floors,
  notice,
  onBack,
  routeLabel,
  segments,
  walkCaption,
}: {
  buildingName: string;
  destination: GuidePlace;
  floors: GuideFloor[];
  notice?: string;
  onBack: () => void;
  routeLabel: string;
  segments: VerifiedRoute['segments'];
  walkCaption: string;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [mapZoomed, setMapZoomed] = useState(false);
  const step = segments[stepIndex];

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setMapZoomed(false);
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
        <h1 className="page-title">{destinationLabel(destination)} 길찾기</h1>
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

              if (!floor?.mapImageUrl) {
                return (
                  <p className="route-unavailable">
                    이 경로와 연결된 검증 지도가 없습니다. 가까운 안내
                    데스크에 문의해 주세요.
                  </p>
                );
              }

              const firstPoint = step.points[0];
              const lastPoint = step.points.at(-1);
              return (
                <figure
                  className={`verified-floor-route ${
                    mapZoomed ? 'verified-floor-route--zoomed' : ''
                  }`}
                >
                  <div className="verified-floor-route__viewport">
                    <div className="verified-floor-route__canvas">
                      <img
                        alt={`${buildingName} ${floor.label} 검증 안내도`}
                        src={floor.mapImageUrl}
                      />
                      <svg
                        aria-label={`${floor.label}에서 이동할 검증 경로`}
                        className="verified-floor-route__overlay"
                        preserveAspectRatio="none"
                        role="img"
                        viewBox="0 0 100 100"
                      >
                      <defs>
                        <marker
                          id={`route-arrow-${stepIndex}`}
                          markerHeight="5"
                          markerUnits="userSpaceOnUse"
                          markerWidth="5"
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
                            <circle r="2.3" />
                            <circle
                              className="verified-route-user__dot"
                              r="0.85"
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
                            <circle r="2.3" />
                            <circle
                              className="verified-route-user__dot"
                              r="0.85"
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
                          <circle r="2.1" />
                          <circle r="0.7" />
                        </g>
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
                    {mapZoomed ? '지도 원래 크기' : '지도 확대'}
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
              step.bankId === 'main-outpatient-lift'
                ? '본관 외래 엘리베이터'
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
      return (
        <SegmentedNavigation
          buildingName={buildingName}
          destination={destination}
          floors={floors}
          onBack={onBack}
          routeLabel="병원 검증 경로"
          segments={verifiedRoute.segments}
          walkCaption="병원이 검증한 복도 안에서만 이동선을 표시합니다."
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
