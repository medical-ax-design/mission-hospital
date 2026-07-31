'use client';

import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import type { HospitalGuideCatalog } from '@ready-on/contracts/hospital-guide';
import {
  findOfficialHospitalGuidePurpose,
  findOfficialHospitalGuideRoute,
  officialHospitalGuideCatalog,
} from '@ready-on/contracts/official-hospital-guide';
import type {
  RestrictionGuidance,
  RestrictionSearchResult,
  SavedQuestion,
} from '@ready-on/contracts/restriction-guidance';
import { useCallback, useEffect, useState } from 'react';
import {
  createCaregiverJourneyApi,
  type CaregiverJourneyApi,
} from './api';
import { CaregiverHomeScreen } from './components/caregiver-home-screen';
import type { RootTab } from './components/bottom-navigation';
import { MobileShell } from './components/mobile-shell';
import { PatientLinkScreen } from './components/patient-link-screen';
import { ProfileScreen } from './components/profile-screen';
import { RestrictionGuidanceScreen } from './components/restriction-guidance-screen';
import { SavedQuestionsScreen } from './components/saved-questions-screen';
import { ScheduleScreen } from './components/schedule-screen';
import { TreatmentProgressScreen } from './components/treatment-progress-screen';
import { HospitalGuideHomeScreen } from '../hospital-guide/components/hospital-guide-home-screen';
import {
  BuildingDirectoryScreen,
  type HospitalGuideTarget,
} from '../hospital-guide/components/building-directory-screen';
import { SafeNavigationScreen } from '../hospital-guide/components/safe-navigation-screen';
import { getRouteAvailability } from '../hospital-guide/hospital-guide-model';

type JourneyView =
  | 'home'
  | 'progress'
  | 'schedule'
  | 'service-guide'
  | 'profile'
  | 'hospital-directory'
  | 'safe-navigation'
  | 'restrictions'
  | 'questions';

interface CaregiverJourneyAppProps {
  api?: CaregiverJourneyApi;
  demoMode?: boolean;
}

const defaultApi = createCaregiverJourneyApi();

export function CaregiverJourneyApp({
  api = defaultApi,
  demoMode = false,
}: CaregiverJourneyAppProps) {
  const [journey, setJourney] = useState<CaregiverJourney | null>(null);
  const [view, setView] = useState<JourneyView>('home');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [guidance, setGuidance] = useState<RestrictionGuidance | null>(
    null,
  );
  const [searchResult, setSearchResult] =
    useState<RestrictionSearchResult | null>(null);
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hospitalCatalog, setHospitalCatalog] =
    useState<HospitalGuideCatalog>(officialHospitalGuideCatalog);
  const [hospitalGuideTarget, setHospitalGuideTarget] =
    useState<HospitalGuideTarget | null>(null);
  const [hospitalDirectoryBackView, setHospitalDirectoryBackView] =
    useState<JourneyView>('service-guide');
  const [safeNavigationBackView, setSafeNavigationBackView] =
    useState<JourneyView>('home');

  const openHospitalPurpose = (
    query: string,
    backView: JourneyView = 'home',
  ) => {
    setActionError(null);
    const result = findOfficialHospitalGuidePurpose(query);

    if (!result) {
      setActionError('등록된 목적을 찾지 못했습니다.');
      return;
    }

    const destination = result.places.find(
      ({ place }) => place.id === 'cancer-2f-payment',
    );

    if (!destination) {
      setActionError('공식 지도에서 안내 장소를 찾지 못했습니다.');
      return;
    }

    setHospitalCatalog(officialHospitalGuideCatalog);
    setHospitalGuideTarget({
      buildingId: destination.buildingId,
      floorCode: destination.floorCode,
      placeId: destination.place.id,
    });
    setSafeNavigationBackView(backView);
    setView('safe-navigation');
  };

  const loadJourney = useCallback(async () => {
    setError(false);

    try {
      setJourney(await api.getDemo());
    } catch {
      setError(true);
    }
  }, [api]);

  useEffect(() => {
    void loadJourney();
  }, [loadJourney]);

  useEffect(() => {
    if (
      journey?.linked &&
      journey.scenarioId === 'morning-colonoscopy'
    ) {
      void api
        .getRestrictions()
        .then(setGuidance)
        .catch(() => setError(true));
    } else {
      setGuidance(null);
    }
  }, [api, journey?.linked, journey?.scenarioId]);

  useEffect(() => {
    if (view !== 'service-guide') return;

    void api
      .getHospitalGuideCatalog()
      .then(setHospitalCatalog)
      .catch(() => {
        // 배포 API가 잠시 응답하지 않아도 검증된 공개 안내를 유지한다.
      });
  }, [api, view]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [view]);

  if (error) {
    return (
      <MobileShell>
        <main className="screen state-screen">
          <span className="state-screen__icon" aria-hidden="true">
            !
          </span>
          <h1>정보를 불러오지 못했습니다</h1>
          <p>네트워크 상태를 확인하고 다시 시도해 주세요.</p>
          <button
            className="primary-button"
            onClick={() => void loadJourney()}
            type="button"
          >
            다시 시도
          </button>
        </main>
      </MobileShell>
    );
  }

  if (!journey) {
    return (
      <MobileShell>
        <main className="screen state-screen" aria-live="polite">
          <div className="loading-mark" aria-hidden="true" />
          <h1>보호자 정보를 확인하고 있습니다</h1>
        </main>
      </MobileShell>
    );
  }

  if (!journey.linked) {
    return (
      <PatientLinkScreen
        journey={journey}
        busy={busy}
        onLink={() => {
          setBusy(true);
          void api
            .linkDemo()
            .then(setJourney)
            .catch(() => setError(true))
            .finally(() => setBusy(false));
        }}
      />
    );
  }

  if (view === 'progress') {
    return (
      <TreatmentProgressScreen
        journey={journey}
        demoMode={demoMode}
        onHome={() => setView('home')}
      />
    );
  }

  if (view === 'schedule') {
    return (
      <ScheduleScreen
        journey={journey}
        onSelectTab={(tab: RootTab) => setView(tab)}
      />
    );
  }

  if (view === 'service-guide') {
    return (
      <HospitalGuideHomeScreen
        catalog={hospitalCatalog}
        guidance={guidance}
        busy={busy}
        onOpenPurpose={(query) =>
          openHospitalPurpose(query, 'service-guide')
        }
        onOpenDirectory={() => {
          setHospitalGuideTarget(null);
          setHospitalDirectoryBackView('service-guide');
          setView('hospital-directory');
        }}
        onOpenRestrictions={() => setView('restrictions')}
        onSelectTab={(tab: RootTab) => setView(tab)}
      />
    );
  }

  if (view === 'profile') {
    return (
      <ProfileScreen
        journey={journey}
        onSelectTab={(tab: RootTab) => setView(tab)}
      />
    );
  }

  if (view === 'hospital-directory' && hospitalCatalog) {
    return (
      <BuildingDirectoryScreen
        catalog={hospitalCatalog}
        initialTarget={hospitalGuideTarget}
        onBack={() => setView(hospitalDirectoryBackView)}
        onNavigate={(target) => {
          setHospitalGuideTarget(target);
          setSafeNavigationBackView('hospital-directory');
          setView('safe-navigation');
        }}
      />
    );
  }

  if (
    view === 'safe-navigation' &&
    hospitalCatalog &&
    hospitalGuideTarget?.placeId
  ) {
    const building = hospitalCatalog.buildings.find(
      ({ id }) => id === hospitalGuideTarget.buildingId,
    );
    const floor = building?.floors.find(
      ({ code }) => code === hospitalGuideTarget.floorCode,
    );
    const destination = floor?.places.find(
      ({ id }) => id === hospitalGuideTarget.placeId,
    );

    if (building && floor && destination) {
      const originPlaceId =
        journey.scenarioId === 'gastric-surgery'
          ? 'cancer-3f-surgery-family-waiting'
          : null;
      const verifiedRoute = originPlaceId
        ? findOfficialHospitalGuideRoute(originPlaceId, destination.id)
        : null;

      return (
        <SafeNavigationScreen
          backLabel={
            safeNavigationBackView === 'home'
              ? '홈으로'
              : safeNavigationBackView === 'service-guide'
                ? '이용 안내'
                : '층별 안내'
          }
          buildingName={building.name}
          destination={destination}
          floors={building.floors}
          onBack={() => setView(safeNavigationBackView)}
          route={getRouteAvailability(floor, verifiedRoute)}
          startFloorCode={verifiedRoute ? '3F' : floor.code}
        />
      );
    }
  }

  if (view === 'restrictions' && guidance) {
    return (
      <RestrictionGuidanceScreen
        guidance={guidance}
        searchResult={searchResult}
        actionError={actionError}
        busy={busy}
        demoMode={demoMode}
        onHome={() => {
          setSearchResult(null);
          setActionError(null);
          setView('home');
        }}
        onSearch={(query) => {
          setActionError(null);
          setBusy(true);
          void api
            .searchRestrictions(query)
            .then(setSearchResult)
            .catch(() =>
              setActionError(
                '요청을 완료하지 못했습니다. 다시 시도해 주세요.',
              ),
            )
            .finally(() => setBusy(false));
        }}
        onSaveQuestion={() => {
          if (!searchResult) return;
          setActionError(null);
          setBusy(true);
          void api
            .saveQuestion(searchResult.query)
            .then((question) => {
              setQuestions((current) => {
                const others = current.filter(
                  ({ id }) => id !== question.id,
                );
                return [...others, question];
              });
            })
            .catch(() =>
              setActionError(
                '요청을 완료하지 못했습니다. 다시 시도해 주세요.',
              ),
            )
            .finally(() => setBusy(false));
        }}
        onOpenQuestions={() => {
          setActionError(null);
          setBusy(true);
          void api
            .getQuestions()
            .then((nextQuestions) => {
              setQuestions(nextQuestions);
              setView('questions');
            })
            .catch(() =>
              setActionError(
                '요청을 완료하지 못했습니다. 다시 시도해 주세요.',
              ),
            )
            .finally(() => setBusy(false));
        }}
        onAdvance={() => {
          setActionError(null);
          setBusy(true);
          void api
            .advanceRestrictionPhase()
            .then((nextGuidance) => {
              setGuidance(nextGuidance);
              setSearchResult(null);
            })
            .catch(() =>
              setActionError(
                '요청을 완료하지 못했습니다. 다시 시도해 주세요.',
              ),
            )
            .finally(() => setBusy(false));
        }}
      />
    );
  }

  if (view === 'questions') {
    return (
      <SavedQuestionsScreen
        questions={questions}
        actionError={actionError}
        busy={busy}
        onBack={() => {
          setActionError(null);
          setView('restrictions');
        }}
        onComplete={(questionId) => {
          setActionError(null);
          setBusy(true);
          void api
            .completeQuestion(questionId)
            .then((completed) => {
              setQuestions((current) =>
                current.map((question) =>
                  question.id === completed.id ? completed : question,
                ),
              );
            })
            .catch(() =>
              setActionError(
                '요청을 완료하지 못했습니다. 다시 시도해 주세요.',
              ),
            )
            .finally(() => setBusy(false));
        }}
        onDelete={(questionId) => {
          setActionError(null);
          setBusy(true);
          void api
            .deleteQuestion(questionId)
            .then(() => {
              setQuestions((current) =>
                current.filter(({ id }) => id !== questionId),
              );
            })
            .catch(() =>
              setActionError(
                '요청을 완료하지 못했습니다. 다시 시도해 주세요.',
              ),
            )
            .finally(() => setBusy(false));
        }}
      />
    );
  }

  return (
    <CaregiverHomeScreen
      journey={journey}
      guidance={guidance}
      busy={busy}
      demoMode={demoMode}
      onOpenProgress={() => setView('progress')}
      onOpenTask={() => openHospitalPurpose('서류 발급', 'home')}
      onOpenRestrictions={() => setView('restrictions')}
      onOpenPurpose={(query) => openHospitalPurpose(query, 'home')}
      onSelectTab={(tab: RootTab) => setView(tab)}
      onSelectScenario={(scenarioId) => {
        setBusy(true);
        void api
          .selectScenario(scenarioId)
          .then((nextJourney) => {
            setJourney(nextJourney);
            setGuidance(null);
            setSearchResult(null);
            setQuestions([]);
            setActionError(null);
            setView('home');
          })
          .catch(() => setError(true))
          .finally(() => setBusy(false));
      }}
    />
  );
}
