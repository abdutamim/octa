import { Check, ChevronDown, MessageCircleQuestion, Send } from 'lucide-react'
import { useState } from 'react'
import type { Locale, TranslationKey } from '../i18n'
import { t } from '../i18n'
import type { PlanQuestion, PlannerResult } from '../../electron/core/octa/planner'

export interface PlanCardProps {
  result: PlannerResult
  locale: Locale
  onAnswer?: (answers: Record<string, string>) => Promise<void>
  onApprove?: () => Promise<void>
}

function statusLabel(status: PlannerResult['status'], locale: Locale): string {
  const key: Record<PlannerResult['status'], TranslationKey> = {
    ok: 'planStatusReady',
    needs_input: 'planStatusNeedsInput',
    needs_approval: 'planStatusNeedsApproval',
    approved: 'planStatusApproved'
  }
  return t(key[status], locale)
}

function questionNeedsAnswer(question: PlanQuestion, answers: Record<string, string>): boolean {
  return question.blocking && !answers[question.id]?.trim()
}

export function PlanCard({ result, locale, onAnswer, onApprove }: PlanCardProps): React.JSX.Element {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [working, setWorking] = useState(false)
  const label = (key: TranslationKey): string => t(key, locale)
  const questions = result.questions
  const blockingQuestions = questions.filter((question) => question.blocking)

  const submitAnswers = async (): Promise<void> => {
    if (!onAnswer || blockingQuestions.some((question) => questionNeedsAnswer(question, answers))) return
    setWorking(true)
    try {
      await onAnswer(answers)
      setAnswers({})
    } finally {
      setWorking(false)
    }
  }

  const approve = async (): Promise<void> => {
    if (!onApprove) return
    setWorking(true)
    try {
      await onApprove()
    } finally {
      setWorking(false)
    }
  }

  return (
    <section className="plan-card glass" aria-label={label('planCard')}>
      <header className="plan-card-heading">
        <div>
          <span className="job-card-eyebrow">{label('planEyebrow')}</span>
          <h2>{label('planTitle')}</h2>
          <p className={`plan-status status-${result.status}`}>{statusLabel(result.status, locale)}</p>
        </div>
        {(result.status === 'needs_approval' || result.status === 'ok') && onApprove && (
          <button className="accent-button" disabled={working} onClick={() => void approve()} type="button">
            <Check size={14} />
            {label('planApprove')}
          </button>
        )}
      </header>

      <div className="plan-card-section">
        <span className="job-card-eyebrow">{label('planSummary')}</span>
        <p className="plan-summary">{result.plan.summary}</p>
      </div>

      <div className="plan-card-section">
        <div className="plan-section-title">
          <span className="job-card-eyebrow">{label('planSteps')}</span>
          <small>{result.plan.steps.length}</small>
        </div>
        <div className="plan-steps-scroll">
          <table className="plan-steps-table">
            <thead>
              <tr>
                <th>{label('planStep')}</th>
                <th>{label('planRunner')}</th>
                <th>{label('planSkill')}</th>
                <th>{label('planGate')}</th>
                <th>{label('planAcceptance')}</th>
              </tr>
            </thead>
            <tbody>
              {result.plan.steps.map((step) => (
                <tr key={step.id}>
                  <td>{step.id}</td>
                  <td>{step.runner}</td>
                  <td>{step.skill ?? step.prompt ?? label('notAvailable')}</td>
                  <td>{step.gate}</td>
                  <td>{step.acceptance.join(' · ') || label('notAvailable')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result.plan.assumptions.length > 0 && (
        <div className="plan-card-section">
          <span className="job-card-eyebrow">{label('planAssumptions')}</span>
          <ul className="plan-assumptions">
            {result.plan.assumptions.map((assumption, index) => <li key={`${assumption}-${index}`}>{assumption}</li>)}
          </ul>
        </div>
      )}

      <div className="plan-card-section">
        <div className="plan-section-title">
          <span className="job-card-eyebrow"><MessageCircleQuestion size={13} /> {label('planQuestions')}</span>
          <small>{questions.length}</small>
        </div>
        {questions.length === 0 && <p className="empty-state">{label('planNoQuestions')}</p>}
        {questions.length > 0 && (
          <div className="plan-question-list">
            {questions.map((question) => (
              <div className={`plan-question ${question.blocking ? 'blocking' : ''}`} key={question.id}>
                <label htmlFor={`plan-question-${question.id}`}>
                  <strong>{question.text}</strong>
                  <small>{question.why}</small>
                </label>
                {question.options.length > 0 && (
                  <div className="plan-question-options">
                    {question.options.map((option) => (
                      <button
                        className={answers[question.id] === option ? 'selected' : ''}
                        key={option}
                        onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                {question.blocking && (
                  <textarea
                    aria-label={question.text}
                    id={`plan-question-${question.id}`}
                    onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    placeholder={label('planAnswerPlaceholder')}
                    rows={2}
                    value={answers[question.id] ?? ''}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {blockingQuestions.length > 0 && onAnswer && (
          <button className="accent-button plan-answer-button" disabled={working || blockingQuestions.some((question) => questionNeedsAnswer(question, answers))} onClick={() => void submitAnswers()} type="button">
            <Send size={14} />
            {working ? label('planWorking') : label('planSubmitAnswers')}
          </button>
        )}
      </div>

      <details className="plan-debate" open={result.debate.length > 0}>
        <summary><ChevronDown size={14} /> {label('planDebate')}</summary>
        <pre>{result.debateMarkdown || label('planNoDebate')}</pre>
      </details>
    </section>
  )
}
