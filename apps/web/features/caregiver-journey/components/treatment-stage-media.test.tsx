import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TREATMENT_STAGE_PRESENTATION } from '../treatment-stage-presentation';
import { TreatmentStageMedia } from './treatment-stage-media';

const originalConnectionDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  'connection',
);

function installConnection(initialSaveData: boolean) {
  const listeners = new Set<() => void>();
  const connection = {
    saveData: initialSaveData,
    addEventListener: vi.fn(
      (_event: string, listener: () => void) => {
        listeners.add(listener);
      },
    ),
    removeEventListener: vi.fn(
      (_event: string, listener: () => void) => {
        listeners.delete(listener);
      },
    ),
  };

  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: connection,
  });

  return {
    setSaveData(saveData: boolean) {
      connection.saveData = saveData;
      listeners.forEach((listener) => listener());
    },
  };
}

describe('TreatmentStageMedia', () => {
  afterEach(() => {
    if (originalConnectionDescriptor) {
      Object.defineProperty(
        navigator,
        'connection',
        originalConnectionDescriptor,
      );
      return;
    }
    Reflect.deleteProperty(navigator, 'connection');
  });

  it('always identifies AI reconstruction and non-live footage', () => {
    render(
      <TreatmentStageMedia
        content={TREATMENT_STAGE_PRESENTATION.IN_PROGRESS}
      />,
    );

    expect(screen.getByText('AI로 재구성한 일반 과정')).toBeInTheDocument();
    expect(
      screen.getByText('현재 환자의 실시간 영상이 아닙니다'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '의료진이 수술을 진행하고 있어요',
      }),
    ).toBeInTheDocument();
  });

  it('pauses and resumes the scene motion', () => {
    render(
      <TreatmentStageMedia
        content={TREATMENT_STAGE_PRESENTATION.PREPARING}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '장면 일시정지' }));
    expect(
      screen.getByRole('button', { name: '장면 재생' }),
    ).toBeInTheDocument();
  });

  it('keeps a labelled fallback when the poster fails', () => {
    render(
      <TreatmentStageMedia
        content={TREATMENT_STAGE_PRESENTATION.RECOVERY}
      />,
    );

    fireEvent.error(screen.getByRole('img'));
    const fallback = screen.getByLabelText('회복실 단계 기본 안내 장면');
    expect(fallback).toHaveClass('treatment-media__fallback--recovery');
    expect(within(fallback).getByText('회복실')).toBeVisible();
  });

  it('accepts future generated video sources without changing the card API', () => {
    const content = {
      ...TREATMENT_STAGE_PRESENTATION.IN_PROGRESS,
      videoSources: [
        {
          src: '/media/treatment/in-progress.webm',
          type: 'video/webm' as const,
        },
      ],
    };
    const { container } = render(<TreatmentStageMedia content={content} />);
    expect(container.querySelector('video')).toHaveAttribute(
      'poster',
      content.posterSrc,
    );
    expect(container.querySelector('source')).toHaveAttribute(
      'type',
      'video/webm',
    );
  });

  it('uses only the poster when Save-Data is enabled', () => {
    installConnection(true);
    const content = {
      ...TREATMENT_STAGE_PRESENTATION.IN_PROGRESS,
      videoSources: [
        {
          src: '/media/treatment/in-progress.webm',
          type: 'video/webm' as const,
        },
      ],
    };

    const { container } = render(<TreatmentStageMedia content={content} />);

    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(container.querySelector('source')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', content.posterSrc);
  });

  it('does not emit video sources before the connection preference is known', () => {
    installConnection(false);
    const content = {
      ...TREATMENT_STAGE_PRESENTATION.IN_PROGRESS,
      videoSources: [
        {
          src: '/media/treatment/in-progress.webm',
          type: 'video/webm' as const,
        },
      ],
    };

    const html = renderToString(<TreatmentStageMedia content={content} />);

    expect(html).not.toContain('<video');
    expect(html).toContain(`src="${content.posterSrc}"`);
  });

  it('switches an active video to the poster when Save-Data turns on', () => {
    const connection = installConnection(false);
    const content = {
      ...TREATMENT_STAGE_PRESENTATION.IN_PROGRESS,
      videoSources: [
        {
          src: '/media/treatment/in-progress.webm',
          type: 'video/webm' as const,
        },
      ],
    };

    const { container } = render(<TreatmentStageMedia content={content} />);
    expect(container.querySelector('video')).toBeInTheDocument();

    act(() => connection.setSaveData(true));

    expect(container.querySelector('video')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', content.posterSrc);
  });
});
