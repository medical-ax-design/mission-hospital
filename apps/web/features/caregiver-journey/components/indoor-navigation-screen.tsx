import type {
  CaregiverJourney,
  HospitalBuilding,
} from '@ready-on/contracts/caregiver-journey';
import { useMemo, useState } from 'react';
import {
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
}

function destinationFromJourney(
  journey: CaregiverJourney,
): IndoorLocation {
  const target =
    journey.schedules.find(({ type }) => type === 'SURGERY') ??
    journey.schedules.find(({ type }) => type === 'EXAM') ??
    journey.schedules[0]!;

  return {
    building: target.building,
    floor: target.floor,
    landmark: target.location,
  };
}

export function IndoorNavigationScreen({
  journey,
  onBack,
}: IndoorNavigationScreenProps) {
  const destination = destinationFromJourney(journey);
  const [building, setBuilding] = useState<HospitalBuilding>('MAIN');
  const [floor, setFloor] = useState('1F');
  const [landmark, setLandmark] = useState(
    hospitalMaps.MAIN['1F'].landmarks[0]!,
  );
  const [mode, setMode] = useState<RouteMode>('ELEVATOR');
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const map = getHospitalMap(building, floor);
  const route = useMemo(
    () =>
      createIndoorRoute(
        { building, floor, landmark },
        destination,
        mode,
      ),
    [building, destination, floor, landmark, mode],
  );
  const step = route[stepIndex]!;

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

            <fieldset className="route-mode">
              <legend>층 이동 방법</legend>
              <label>
                <input
                  checked={mode === 'ELEVATOR'}
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
                  checked={mode === 'ESCALATOR'}
                  name="route-mode"
                  onChange={() => setMode('ESCALATOR')}
                  type="radio"
                />
                <span>
                  <strong>에스컬레이터</strong>
                  <small>이용 가능한 층을 차례대로 이동</small>
                </span>
              </label>
            </fieldset>

            <button
              className="primary-button"
              onClick={() => {
                setStepIndex(0);
                setStarted(true);
              }}
              type="button"
            >
              길찾기 시작
            </button>
          </>
        ) : (
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

            {step.kind === 'MAP' ? (
              <figure className="official-map">
                <div className="official-map__canvas">
                  <img
                    alt={`삼성서울병원 공식 ${buildingLabels[step.map.building]} ${step.map.floor} 안내도`}
                    src={step.map.imageUrl}
                  />
                  <svg
                    aria-label="붉은 이동 경로"
                    className="official-map__route"
                    preserveAspectRatio="none"
                    role="img"
                    viewBox="0 0 100 100"
                  >
                    <polyline
                      data-testid="route-line"
                      fill="none"
                      points={step.path}
                    />
                    <circle cx="12" cy="72" r="3" />
                  </svg>
                </div>
                <figcaption>
                  <strong>{step.title}</strong>
                  <p>{step.instruction}</p>
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
                  onClick={onBack}
                  type="button"
                >
                  도착 완료
                </button>
              )}
            </div>
          </section>
        )}
      </main>
    </MobileShell>
  );
}
