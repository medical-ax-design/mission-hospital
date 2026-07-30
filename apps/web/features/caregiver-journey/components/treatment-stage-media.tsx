'use client';

import { useEffect, useRef, useState } from 'react';
import type { TreatmentStagePresentation } from '../treatment-stage-presentation';

interface SaveDataConnection {
  saveData?: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

function getSaveDataConnection() {
  if (typeof navigator === 'undefined') {
    return undefined;
  }
  return (
    navigator as Navigator & {
      connection?: SaveDataConnection;
    }
  ).connection;
}

function getReducedMotionPreference() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function TreatmentStageMedia({
  content,
}: {
  content: TreatmentStagePresentation;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(
    getReducedMotionPreference,
  );
  const [playing, setPlaying] = useState(() => !reducedMotion);
  const [saveData, setSaveData] = useState(true);
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo =
    Boolean(content.videoSources?.length) && !videoFailed && !saveData;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setReducedMotion(query.matches);
      if (query.matches) {
        videoRef.current?.pause();
        setPlaying(false);
      }
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const connection = getSaveDataConnection();
    const handleChange = () => {
      const saveDataEnabled = Boolean(connection?.saveData);
      setSaveData(saveDataEnabled);
      if (saveDataEnabled) {
        setPlaying(false);
      }
    };

    handleChange();
    if (typeof connection?.addEventListener !== 'function') {
      return;
    }

    connection.addEventListener('change', handleChange);
    return () => connection.removeEventListener?.('change', handleChange);
  }, []);

  const togglePlayback = () => {
    if (!hasVideo || !videoRef.current) {
      setPlaying((value) => !value);
      return;
    }
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
      return;
    }
    void videoRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setVideoFailed(true));
  };

  return (
    <section className="treatment-media" aria-labelledby="treatment-media-title">
      <div
        className={`treatment-media__scene treatment-media__scene--${content.motionVariant}`}
        data-playing={playing}
      >
        <span className="treatment-media__ai-badge">
          AI로 재구성한 일반 과정
        </span>
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay={!reducedMotion && !saveData}
            loop
            muted
            playsInline
            poster={content.posterSrc}
            onError={() => setVideoFailed(true)}
          >
            {content.videoSources?.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
          </video>
        ) : posterFailed ? (
          <div
            className={`treatment-media__fallback treatment-media__fallback--${content.motionVariant}`}
            aria-label={`${content.timelineLabel} 단계 기본 안내 장면`}
          >
            <span>{content.timelineLabel}</span>
          </div>
        ) : (
          <img
            alt={`${content.timelineLabel} 일반 과정 AI 재구성 장면`}
            src={content.posterSrc}
            onError={() => setPosterFailed(true)}
          />
        )}
        <button
          className="treatment-media__toggle"
          type="button"
          aria-label={
            reducedMotion
              ? '동작 줄이기 설정으로 장면 정지'
              : playing
                ? '장면 일시정지'
                : '장면 재생'
          }
          disabled={reducedMotion}
          onClick={togglePlayback}
        >
          <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
        </button>
      </div>
      <div className="treatment-media__copy">
        <h2 id="treatment-media-title">{content.mediaTitle}</h2>
        <p>{content.mediaDescription}</p>
        <strong>현재 환자의 실시간 영상이 아닙니다</strong>
      </div>
    </section>
  );
}
