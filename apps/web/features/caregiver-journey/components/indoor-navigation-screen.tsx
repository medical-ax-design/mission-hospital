import type {
  CaregiverJourney,
  HospitalBuilding,
} from '@ready-on/contracts/caregiver-journey';
import { useMemo, useState } from 'react';
import {
  availableRouteModes,
  buildingLabels,
  createIndoorRoute,
  getHospitalMap,
  hospitalMaps,
  type IndoorLocation,
  type RouteMode,
} from '../indoor-navigation-model';
import { MobileShell } from './mobile-shell';

interface IndoorNavigationScreenProps {
  journey: CaregiverJourney;
  onBack: () => void;
  destination?: IndoorLocation;
  busy?: boolean;
  completionLabel?: string;
  onComplete?: () => void;
}

function destinationFromJourney(
  journey: CaregiverJourney,
): IndoorLocation | null {
  const target =
    journey.schedules.find(({ type }) => type === 'SURGERY') ??
    journey.schedules.find(({ type }) => type === 'EXAM') ??
    journey.schedules[0];

  if (!target) return null;

  return {
    building: target.building,
    floor: target.floor,
    landmark: target.location,
  };
}

function toMotionPath(points: string) {
  return `M ${points.trim().split(/\s+/).join(' L ')}`;
}

function getFirstPoint(points: string) {
  const [x = '0', y = '0'] = points.trim().split(/\s+/)[0]!.split(',');
  return { x, y };
}

export function IndoorNavigationScreen({
  journey,
  onBack,
  destination: destinationOverride,
  busy = false,
  completionLabel = '도착 완료',
  onComplete,
}: IndoorNavigationScreenProps) {
  const destination =
    destinationOverride ?? destinationFromJourney(journey);
  const [building, setBuilding] = useState<HospitalBuilding>('MAIN');
  const [floor, setFloor] = useState('1F');
  const [landmark, setLandmark] = useState(
    hospitalMaps.MAIN['1F'].landmarks[0]!,
  );
  const [mode, setMode] = useState<RouteMode>('ELEVATOR');
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const map = getHospitalMap(building, floor);
  const start = useMemo(
    () => ({ building, floor, landmark }),
    [building, floor, landmark],
  );
  const availableModes = useMemo(
    () =>
      destination ? availableRouteModes(start, destination) : [],
    [destination, start],
  );
  const selectedMode = availableModes.includes(mode)
    ? mode
    : availableModes[0];
  const requiresTransition =
    destination !== null &&
    (start.building !== destination.building ||
      start.floor !== destination.floor);
  const route = useMemo(
    () =>
      destination && selectedMode
        ? createIndoorRoute(start, destination, selectedMode)
        : null,
    [destination, selectedMode, start],
  );
  const step = route?.[stepIndex];

  const selectBuilding = (nextBuilding: HospitalBuilding) => {
    const nextFloor = Object.keys(hospitalMaps[nextBuilding])[0]!;
    const nextMap = getHospitalMap(nextBuilding, nextFloor);
    setBuilding(nextBuilding);
    setFloor(nextFloor);
    setLandmark(nextMap?.landmarks[0] ?? '');
  };

  const selectFloor = (nextFloor: string) => {
    const nextMap = getHospitalMap(building, nextFloor);
    setFloor(nextFloor);
    setLandmark(nextMap?.landmarks[0] ?? '');
  };

  if (
    !destination ||
    !getHospitalMap(destination.building, destination.floor)
  ) {
    return (
      <MobileShell compactHeader>
        <main className="screen state-screen">
          <h1>등록된 이동 안내가 없습니다.</h1>
          <p>가까운 안내 데스크에 문의해 주세요.</p>
          <button className="primary-button" onClick={onBack} type="button">
            이용 안내로 돌아가기
          </button>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell compactHeader>
      <main className="screen indoor-navigation">
        <button className="text-back" onClick={onBack} type="button">
          ← 이용 안내
        </button>
        <p className="eyebrow">삼성서울병원 공식 층별 안내도</p>
        <h1 className="page-title">병원 안 길찾기</h1>

        {!started ? (
          <>
            <section
              className="navigation-destination"
              aria-labelledby="navigation-destination"
            >
              <span aria-hidden="true">도착</span>
              <div>
                <small>등록된 목적지</small>
                <h2 id="navigation-destination">
                  {buildingLabels[destination.building]} {destination.floor}
                </h2>
                <p>{destination.landmark}</p>
              </div>
            </section>

            <section className="location-form" aria-label="현재 위치 선택">
              <h2>지금 서 있는 곳을 선택하세요</h2>
              <label>
                현재 건물
                <select
                  value={building}
                  onChange={(event) =>
                    selectBuilding(
                      event.target.value as HospitalBuilding,
                    )
                  }
                >
                  {Object.entries(buildingLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                현재 층
                <select
                  value={floor}
                  onChange={(event) => selectFloor(event.target.value)}
                >
                  {Object.keys(hospitalMaps[building]).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                가까운 장소
                <select
                  value={landmark}
                  onChange={(event) => setLandmark(event.target.value)}
                >
                  {map?.landmarks.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            {requiresTransition && (
              <fieldset className="route-mode">
                <legend>층 이동 방법</legend>
                <label>
                  <input
                    checked={selectedMode === 'ELEVATOR'}
                    disabled={!availableModes.includes('ELEVATOR')}
                    name="route-mode"
                    onChange={() => setMode('ELEVATOR')}
                    type="radio"
                  />
                  <span>
                    <strong>엘리베이터</strong>
                    <small>추천 · 이동이 불편한 환자와 함께 이용</small>
                  </span>
                </label>
                <label>
                  <input
                    checked={selectedMode === 'ESCALATOR'}
                    disabled={!availableModes.includes('ESCALATOR')}
                    name="route-mode"
                    onChange={() => setMode('ESCALATOR')}
                    type="radio"
                  />
                  <span>
                    <strong>에스컬레이터</strong>
                    <small>
                      {availableModes.includes('ESCALATOR')
                        ? '확인된 연결 경로로 이동'
                        : '현재 경로는 공식 연결 정보 확인 전'}
                    </small>
                  </span>
                </label>
              </fieldset>
            )}

            {!route && (
              <p className="route-unavailable" role="alert">
                선택한 위치에서 목적지까지 확인된 이동 경로가 없습니다.
                가까운 안내 데스크에 문의해 주세요.
              </p>
            )}

            <button
              className="primary-button"
              disabled={!route}
              onClick={() => {
                setStepIndex(0);
                setStarted(true);
              }}
              type="button"
            >
              길찾기 시작
            </button>
          </>
        ) : route && step ? (
          <section className="route-player" aria-live="polite">
            <div className="route-player__progress">
              <span>
                {stepIndex + 1} / {route.length}
              </span>
              <button
                onClick={() => {
                  setStarted(false);
                  setStepIndex(0);
                }}
                type="button"
              >
                경로 다시 선택
              </button>
            </div>
            <p className="route-player__disclaimer">
              붉은 선과 전환 화면은 기능 검증용 시연 경로입니다. 현장
              표지판을 함께 확인해 주세요.
            </p>

            {step.kind === 'MAP' ? (
              <figure className="official-map">
                <div className="official-map__canvas">
                  <img
                    alt={`삼성서울병원 공식 ${buildingLabels[step.map.building]} ${step.map.floor} 안내도`}
                    src={step.map.imageUrl}
                  />
                  <svg
                    aria-label="사용자 위치와 붉은 이동 경로"
                    className="official-map__route"
                    role="img"
                    viewBox="0 0 100 59.47"
                  >
                    <polyline
                      data-testid="route-line"
                      fill="none"
                      points={step.path}
                    />
                    <g
                      className="route-user route-user--animated"
                      data-testid="route-user-marker"
                    >
                      <circle r="2.8" />
                      <circle className="route-user__head" cy="-0.8" r="0.75" />
                      <path
                        className="route-user__body"
                        d="M -1.35 1.55 C -1.1 0.3 1.1 0.3 1.35 1.55 Z"
                      />
                      <animateMotion
                        dur="4s"
                        path={toMotionPath(step.path)}
                        repeatCount="indefinite"
                      />
                    </g>
                    <g
                      className="route-user route-user--static"
                      transform={`translate(${getFirstPoint(step.path).x} ${getFirstPoint(step.path).y})`}
                    >
                      <circle r="2.8" />
                      <circle className="route-user__head" cy="-0.8" r="0.75" />
                      <path
                        className="route-user__body"
                        d="M -1.35 1.55 C -1.1 0.3 1.1 0.3 1.35 1.55 Z"
                      />
                    </g>
                  </svg>
                </div>
                <figcaption>
                  <strong>{step.title}</strong>
                  <p>{step.instruction}</p>
                  <p className="official-map__legend">
                    <i aria-hidden="true" /> 붉은 원은 사용자의 이동 위치를
                    보여줍니다.
                  </p>
                  <a
                    href={step.map.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    삼성서울병원 층별 안내 원문
                  </a>
                </figcaption>
              </figure>
            ) : (
              <div
                className={`route-transition route-transition--${step.icon.toLowerCase()}`}
              >
                <span aria-hidden="true">
                  {step.icon === 'ELEVATOR'
                    ? '↕'
                    : step.icon === 'ESCALATOR'
                      ? '↗'
                      : '⇢'}
                </span>
                <h2>{step.title}</h2>
                <p>{step.instruction}</p>
              </div>
            )}

            <div className="route-player__actions">
              {stepIndex > 0 && (
                <button
                  className="secondary-button"
                  onClick={() => setStepIndex((current) => current - 1)}
                  type="button"
                >
                  이전 안내
                </button>
              )}
              {stepIndex < route.length - 1 ? (
                <button
                  className="primary-button"
                  onClick={() => setStepIndex((current) => current + 1)}
                  type="button"
                >
                  다음 안내
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={onComplete ?? onBack}
                  type="button"
                >
                  {busy ? '완료를 반영하고 있습니다' : completionLabel}
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="state-screen">
            <h2>경로를 표시할 수 없습니다.</h2>
            <p>현재 위치를 다시 선택하거나 안내 데스크에 문의해 주세요.</p>
            <button
              className="primary-button"
              onClick={() => {
                setStarted(false);
                setStepIndex(0);
              }}
              type="button"
            >
              현재 위치 다시 선택
            </button>
          </section>
        )}
      </main>
    </MobileShell>
  );
}
