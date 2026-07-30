import type {
  GuideBuildingId,
  HospitalGuidePurposeResult,
} from '@ready-on/contracts/hospital-guide';
import { MobileShell } from '../../caregiver-journey/components/mobile-shell';

const channelLabels = {
  ONLINE: '온라인',
  MOBILE: '모바일',
  ONSITE: '병원 방문',
} as const;

interface PurposeResultScreenProps {
  result: HospitalGuidePurposeResult;
  onBack: () => void;
  onOpenDirectory: () => void;
  onOpenPlace: (
    buildingId: GuideBuildingId,
    floorCode: string,
    placeId: string,
  ) => void;
}

export function PurposeResultScreen({
  result,
  onBack,
  onOpenDirectory,
  onOpenPlace,
}: PurposeResultScreenProps) {
  return (
    <MobileShell compactHeader>
      <main className="screen hospital-purpose-result">
        <button className="text-back" onClick={onBack} type="button">
          ← 이용 안내
        </button>
        <p className="eyebrow">공식 처리 방법</p>
        <h1 className="page-title">{result.purpose.name}</h1>
        <p className="lead">
          방문하기 전에 온라인이나 모바일에서 발급 가능한지 먼저
          확인하세요.
        </p>

        <div className="purpose-option-list">
          {result.purpose.options.map((option) => {
            const location = option.placeId
              ? result.places.find(
                  ({ place }) => place.id === option.placeId,
                )
              : null;

            return (
              <article className="purpose-option" key={option.id}>
                <span className="purpose-option__channel">
                  {channelLabels[option.channel]}
                </span>
                <h2>{option.title}</h2>

                {location && (
                  <p className="purpose-option__location">
                    {location.buildingId === 'MAIN'
                      ? '본관'
                      : location.buildingId === 'ANNEX'
                        ? '별관'
                        : location.buildingId === 'CANCER'
                          ? '암병원'
                          : '양성자치료센터'}{' '}
                    {location.floorCode} ·{' '}
                    {location.place.officialNumber &&
                      `${location.place.officialNumber}. `}
                    {location.place.officialName}
                  </p>
                )}

                {option.requiredItems.length > 0 && (
                  <section>
                    <h3>준비물</h3>
                    <ul>
                      {option.requiredItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h3>처리 순서</h3>
                  <ol>
                    {option.orderedSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>

                {location && (
                  <button
                    className="primary-button"
                    onClick={() =>
                      onOpenPlace(
                        location.buildingId,
                        location.floorCode,
                        location.place.id,
                      )
                    }
                    type="button"
                  >
                    이 장소로 안내
                  </button>
                )}

                <a href={option.sourceUrl} rel="noreferrer" target="_blank">
                  삼성서울병원 공식 발급 안내
                </a>
              </article>
            );
          })}
        </div>

        <button
          className="secondary-button hospital-purpose-result__directory"
          onClick={onOpenDirectory}
          type="button"
        >
          전체 건물·층별 안내
        </button>
      </main>
    </MobileShell>
  );
}
