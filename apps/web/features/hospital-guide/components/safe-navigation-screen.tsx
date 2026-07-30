import type {
  GuideFloor,
  GuidePlace,
  RouteAvailability,
  VerifiedRoute,
} from '@ready-on/contracts/hospital-guide';
import { useState, type MouseEvent } from 'react';
import { MobileShell } from '../../caregiver-journey/components/mobile-shell';
import {
  getPrototypeDestinationPoint,
  getPrototypeRoute,
  validateVerifiedRoute,
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
  return destination.officialNumber
    ? `${destination.officialNumber}. ${destination.officialName}`
    : destination.officialName;
}

function MapOnlyNavigation({
  buildingName,
  destination,
  floor,
  onBack,
  sourceUrl,
}: {
  buildingName: string;
  destination: GuidePlace;
  floor: GuideFloor | undefined;
  onBack: () => void;
  sourceUrl: string;
}) {
  const [prototypeRoute, setPrototypeRoute] =
    useState<PrototypeRouteResult | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(
    null,
  );
  const prototypeDestinationPoint = floor
    ? getPrototypeDestinationPoint(floor.code, destination.id)
    : null;
  const supportsPrototypeRoute = prototypeDestinationPoint !== null;

  const selectCurrentPosition = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (!floor) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const selectedPoint: [number, number] = [
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    ];
    const nextRoute = getPrototypeRoute(
      floor.code,
      destination.id,
      selectedPoint,
    );

    if (!nextRoute) {
      setPrototypeRoute(null);
      setSelectionError(
        '복도 또는 출입구 위에서 현재 위치를 다시 선택해 주세요.',
      );
      return;
    }

    setPrototypeRoute(nextRoute);
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

        {floor?.mapImageUrl ? (
          <figure
            className={`floor-map safe-navigation__map ${
              supportsPrototypeRoute
                ? 'prototype-floor-route'
                : ''
            }`}
          >
            {supportsPrototypeRoute ? (
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
                      prototypeDestinationPoint?.[0]
                    } ${
                      prototypeRoute?.destinationPoint[1] ??
                      prototypeDestinationPoint?.[1]
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
                ? '선택한 위치를 가장 가까운 복도에 맞췄습니다. 붉은 선을 따라 이동하세요.'
                : supportsPrototypeRoute
                  ? '목적지는 표시되어 있습니다. 현재 서 있는 복도나 출입구를 눌러 주세요.'
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

function VerifiedNavigation({
  buildingName,
  destination,
  floors,
  onBack,
  route,
}: {
  buildingName: string;
  destination: GuidePlace;
  floors: GuideFloor[];
  onBack: () => void;
  route: VerifiedRoute;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = route.segments[stepIndex];

  if (!step) return null;

  const nextStep = () =>
    setStepIndex((current) =>
      Math.min(current + 1, route.segments.length - 1),
    );

  return (
    <MobileShell compactHeader>
      <main className="screen safe-navigation">
        <button className="text-back" onClick={onBack} type="button">
          ← 층별 안내
        </button>
        <p className="eyebrow">병원 검증 경로</p>
        <h1 className="page-title">{destinationLabel(destination)} 길찾기</h1>
        <p className="safe-navigation__progress">
          {stepIndex + 1} / {route.segments.length}
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
              return (
                <figure className="verified-floor-route">
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
                      <polyline
                        data-testid="route-line"
                        fill="none"
                        points={pointsToPolyline(step.points)}
                      />
                      {firstPoint && (
                        <>
                          <g
                            className="verified-route-user verified-route-user--animated"
                            data-testid="route-user-marker"
                          >
                            <circle r="3.2" />
                            <circle
                              className="verified-route-user__head"
                              cy="-0.9"
                              r="0.8"
                            />
                            <path
                              className="verified-route-user__body"
                              d="M -1.4 1.7 C -1.1 0.3 1.1 0.3 1.4 1.7 Z"
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
                            <circle r="3.2" />
                            <circle
                              className="verified-route-user__head"
                              cy="-0.9"
                              r="0.8"
                            />
                            <path
                              className="verified-route-user__body"
                              d="M -1.4 1.7 C -1.1 0.3 1.1 0.3 1.4 1.7 Z"
                            />
                          </g>
                        </>
                      )}
                    </svg>
                  </div>
                  <figcaption>
                    {buildingName} {floor.label}의 검증된 복도 안에서만
                    이동선을 표시합니다.
                  </figcaption>
                </figure>
              );
            })()}
            {stepIndex < route.segments.length - 1 ? (
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
        <VerifiedNavigation
          buildingName={buildingName}
          destination={destination}
          floors={floors}
          onBack={onBack}
          route={verifiedRoute}
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
