import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TreatmentDemoControls } from './components/treatment-demo-controls';
import { useTreatmentDemoStage } from './use-treatment-demo-stage';

const originalMatchMedia = window.matchMedia;
const originalDocumentHidden = document.hidden;

describe('useTreatmentDemoStage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: originalDocumentHidden,
    });
  });

  it('does not override the server stage when demo is disabled', () => {
    sessionStorage.setItem(
      'waiton:treatment-demo-stage:v1',
      'IN_PROGRESS',
    );
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', false),
    );

    expect(result.current.stage).toBe('PREPARING');
  });

  it('moves within five stages and persists the demo stage', () => {
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );

    act(() => result.current.goNext());
    expect(result.current.stage).toBe('IN_OPERATING_ROOM');
    expect(sessionStorage.getItem('waiton:treatment-demo-stage:v1')).toBe(
      'IN_OPERATING_ROOM',
    );

    act(() => result.current.goPrevious());
    expect(result.current.stage).toBe('PREPARING');
  });

  it('clamps manual progress at both stage boundaries', () => {
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );

    act(() => result.current.goPrevious());
    expect(result.current.stage).toBe('PREPARING');

    for (let index = 0; index < 5; index += 1) {
      act(() => result.current.goNext());
    }
    expect(result.current.stage).toBe('COMPLETED');

    act(() => result.current.goNext());
    expect(result.current.stage).toBe('COMPLETED');
  });

  it('restores a valid stored stage and rejects an invalid one', () => {
    sessionStorage.setItem(
      'waiton:treatment-demo-stage:v1',
      'RECOVERY',
    );
    const valid = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );
    expect(valid.result.current.stage).toBe('RECOVERY');
    valid.unmount();

    sessionStorage.setItem(
      'waiton:treatment-demo-stage:v1',
      'UNKNOWN_STAGE',
    );
    const invalid = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );
    expect(invalid.result.current.stage).toBe('PREPARING');
  });

  it('advances every eight seconds and stops at the final stage', () => {
    const { result } = renderHook(() =>
      useTreatmentDemoStage('RECOVERY', true),
    );

    act(() => result.current.toggleAutoPlay());
    act(() => vi.advanceTimersByTime(8_000));

    expect(result.current.stage).toBe('COMPLETED');
    expect(result.current.isAutoPlaying).toBe(false);
  });

  it('does not start automatic progress when reduced motion is requested', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );

    act(() => result.current.toggleAutoPlay());

    expect(result.current.isAutoPlaying).toBe(false);
  });

  it('stops automatic progress when the browser tab becomes hidden', () => {
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );

    act(() => result.current.toggleAutoPlay());
    expect(result.current.isAutoPlaying).toBe(true);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    act(() => document.dispatchEvent(new Event('visibilitychange')));

    expect(result.current.isAutoPlaying).toBe(false);
  });
});

describe('TreatmentDemoControls', () => {
  it('shows stage progress and disables unavailable boundary actions', () => {
    render(
      <TreatmentDemoControls
        stageIndex={0}
        stageCount={5}
        isAutoPlaying={false}
        canGoPrevious={false}
        canGoNext
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onToggleAutoPlay={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('complementary', { name: '발표용 데모 제어' }),
    ).toHaveTextContent('1 / 5');
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '자동 진행' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });
});
