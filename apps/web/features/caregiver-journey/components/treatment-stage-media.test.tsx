import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TREATMENT_STAGE_PRESENTATION } from '../treatment-stage-presentation';
import { TreatmentStageMedia } from './treatment-stage-media';

describe('TreatmentStageMedia', () => {
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
    expect(
      screen.getByLabelText('회복실 단계 기본 안내 장면'),
    ).toBeInTheDocument();
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
});
