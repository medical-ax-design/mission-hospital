'use client';

import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
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
import { TreatmentProgressScreen } from './components/treatment-progress-screen';

type JourneyView = 'home' | 'progress' | 'task' | 'guide' | 'summary';

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

  return (
    <CaregiverHomeScreen
      journey={journey}
      busy={busy}
      demoMode={demoMode}
      onOpenProgress={() => setView('progress')}
      onOpenTask={() => setView('task')}
      onOpenSummary={() => setView('summary')}
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
