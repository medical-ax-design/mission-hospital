'use client';

import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
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
import { CaregiverTaskScreen } from './components/caregiver-task-screen';
import { ClinicalSummaryScreen } from './components/clinical-summary-screen';
import { MobileShell } from './components/mobile-shell';
import { PatientLinkScreen } from './components/patient-link-screen';
import { PurposeGuideScreen } from './components/purpose-guide-screen';
import { RestrictionGuidanceScreen } from './components/restriction-guidance-screen';
import { SavedQuestionsScreen } from './components/saved-questions-screen';
import { TreatmentProgressScreen } from './components/treatment-progress-screen';

type JourneyView =
  | 'home'
  | 'progress'
  | 'task'
  | 'guide'
  | 'summary'
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
        onHome={() => setView('home')}
      />
    );
  }

  if (view === 'task') {
    return (
      <CaregiverTaskScreen
        journey={journey}
        onHome={() => setView('home')}
        onStartGuide={() => setView('guide')}
      />
    );
  }

  if (view === 'guide') {
    return (
      <PurposeGuideScreen
        journey={journey}
        busy={busy}
        onBack={() => setView('task')}
        onComplete={() => {
          if (!journey.task) {
            setView('home');
            return;
          }

          setBusy(true);
          void api
            .completeTask(journey.task.id)
            .then((nextJourney) => {
              setJourney(nextJourney);
              setView('home');
            })
            .catch(() => setError(true))
            .finally(() => setBusy(false));
        }}
      />
    );
  }

  if (view === 'summary') {
    return (
      <ClinicalSummaryScreen
        journey={journey}
        onHome={() => setView('home')}
      />
    );
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
      onOpenTask={() => setView('task')}
      onOpenSummary={() => setView('summary')}
      onOpenRestrictions={() => setView('restrictions')}
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
      onAdvance={() => {
        setBusy(true);
        void api
          .advanceDemo()
          .then(setJourney)
          .catch(() => setError(true))
          .finally(() => setBusy(false));
      }}
    />
  );
}
