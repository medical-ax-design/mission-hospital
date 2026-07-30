import type { SavedQuestion } from '@ready-on/contracts/restriction-guidance';
import { MobileShell } from './mobile-shell';

interface SavedQuestionsScreenProps {
  questions: SavedQuestion[];
  actionError: string | null;
  busy: boolean;
  onBack: () => void;
  onComplete: (questionId: string) => void;
  onDelete: (questionId: string) => void;
}

export function SavedQuestionsScreen({
  questions,
  actionError,
  busy,
  onBack,
  onComplete,
  onDelete,
}: SavedQuestionsScreenProps) {
  return (
    <MobileShell compactHeader>
      <main className="screen restriction-screen">
        <button className="text-button" onClick={onBack} type="button">
          ← 제한 안내로
        </button>
        <p className="eyebrow">상담 준비</p>
        <h1>의료진에게 확인할 질문</h1>
        {actionError && (
          <p className="action-error" role="alert">
            {actionError}
          </p>
        )}
        {questions.length === 0 ? (
          <p>저장한 질문이 없습니다.</p>
        ) : (
          <ul className="question-list">
            {questions.map((question) => (
              <li key={question.id}>
                <strong>{question.questionText}</strong>
                <p>{question.reason}</p>
                <div className="question-actions">
                  {question.status === 'DONE' ? (
                    <span className="done-badge">확인 완료됨</span>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={() => onComplete(question.id)}
                      type="button"
                    >
                      확인 완료
                    </button>
                  )}
                  <button
                    aria-label={`질문 삭제: ${question.questionText}`}
                    className="question-delete-button"
                    disabled={busy}
                    onClick={() => onDelete(question.id)}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="source-note">
          질문은 의료진에게 자동 전송되지 않습니다. 상담할 때 직접
          확인해 주세요.
        </p>
      </main>
    </MobileShell>
  );
}
