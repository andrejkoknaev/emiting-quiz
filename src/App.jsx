import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'emiting_ticket';
const AUTO_ADVANCE_DELAY_MS = 750;
const BLUR_RESET_DELAY_MS = 150;
const CLIENT_TIMEOUT_MS = 12000;

const COURSES = ['1', '2', '3', '4'];
const INSTITUTES = ['ЭМИТ', 'ИОН', 'ИГСУ', 'ИПНБ', 'ИНУП', 'Ресурс России'];
const DEPARTMENTS = ['ОЭ', 'ОНЭ', 'ОБИ', 'ОПИ', 'ОМЭС', 'ООП', 'IT менеджмент'];
const SOURCE_PRESETS = [
  { id: 'friends', label: 'Друзья рассказали', isCustom: false },
  { id: 'tgk', label: 'Из ТГК', isCustom: false },
  { id: 'custom', label: 'Свой вариант', isCustom: true },
];

const CARD_CLASS =
  'bg-[#F4EBE1] p-6 sm:p-10 rounded-[16px] shadow-xl border border-[#1A1A1A]/10 overflow-hidden w-full';
const TITLE_CLASS =
  'font-display text-[24px] sm:text-[32px] leading-tight text-[#1A1A1A] mb-6 sm:mb-7 text-center sm:text-left';
const INPUT_CLASS =
  'w-full bg-[#F4EBE1] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-base sm:text-lg font-bold px-4 sm:px-5 py-4 rounded-xl outline-none border-2 border-[#1A1A1A]/15 focus:border-[#EB5618] transition-colors';

const cardVariants = {
  enter: (dir) => ({ opacity: 0, y: dir > 0 ? 20 : -20, scale: 0.98 }),
  center: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 30 },
  },
  exit: (dir) => ({
    opacity: 0,
    y: dir > 0 ? -20 : 20,
    scale: 0.98,
    transition: { duration: 0.16 },
  }),
};

function readSavedTicket() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

function formatNameInput(rawValue) {
  return rawValue.replace(
    /(^|[\s-])([\p{L}])/gu,
    (_, sep, letter) => sep + letter.toUpperCase(),
  );
}

function getTicketNumberSizeClass(ticket) {
  const len = String(ticket).length;
  if (len <= 1) return 'text-[clamp(150px,46vw,240px)]';
  if (len === 2) return 'text-[clamp(128px,39vw,228px)]';
  if (len === 3) return 'text-[clamp(92px,29vw,204px)]';
  return 'text-[clamp(68px,21vw,172px)]';
}

function NavArrow({ direction = 'right', className = '' }) {
  const path =
    direction === 'right'
      ? 'M3.75 12H19.75M19.75 12C16.65 12 14.3 9.25 13.75 6.25M19.75 12C16.65 12 14.3 14.75 13.75 17.75'
      : 'M20.25 12H4.25M4.25 12C7.35 12 9.7 9.25 10.25 6.25M4.25 12C7.35 12 9.7 14.75 10.25 17.75';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`w-5 h-5 shrink-0 transition-transform duration-200 ease-out ${
        direction === 'right'
          ? 'group-hover:translate-x-1 group-disabled:translate-x-0'
          : 'group-hover:-translate-x-1 group-disabled:translate-x-0'
      } ${className}`}
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TicketIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`w-5 h-5 shrink-0 transition-transform duration-200 ease-out group-hover:-rotate-6 group-disabled:rotate-0 ${className}`}
    >
      <path
        d="M3.5 7.5A2 2 0 0 1 5.5 5.5H18.5A2 2 0 0 1 20.5 7.5V9.6A2.4 2.4 0 0 0 20.5 14.4V16.5A2 2 0 0 1 18.5 18.5H5.5A2 2 0 0 1 3.5 16.5V14.4A2.4 2.4 0 0 0 3.5 9.6V7.5Z"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 6V8.5M14.5 11.25V12.75M14.5 15.5V18"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackButton({ onClick, disabled = false, fullFlex = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group ${
        fullFlex ? 'flex-1 px-4 sm:px-5' : 'w-full sm:w-auto sm:min-w-[160px] px-6'
      } min-h-[54px] border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A1A1A] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer`}
    >
      <NavArrow direction="left" />
      <span>Назад</span>
    </button>
  );
}

function CollageLogo() {
  const letters = [
    { char: 'Э', bg: 'bg-[#646373]', text: 'text-[#F4EBE1]', rot: '-rotate-3' },
    { char: 'М', bg: 'bg-[#F4EBE1]', text: 'text-[#E32026]', rot: 'rotate-2' },
    { char: 'И', bg: 'bg-[#F4EBE1]', text: 'text-[#1A1A1A]', rot: '-rotate-2' },
    { char: 'Т', bg: 'bg-[#1A1A1A]', text: 'text-[#F4EBE1]', rot: 'rotate-3' },
    { char: 'И', bg: 'bg-[#E32026]', text: 'text-[#F4EBE1]', rot: '-rotate-1' },
    { char: 'Н', bg: 'bg-[#F4EBE1]', text: 'text-[#1A1A1A]', rot: 'rotate-2' },
    { char: 'Г', bg: 'bg-[#646373]', text: 'text-[#F9B800]', rot: '-rotate-3' },
  ];

  return (
    <div className="inline-flex items-center gap-1 sm:gap-1.5 select-none" aria-label="ЭМИТИНГ">
      {letters.map((item, idx) => (
        <span
          key={idx}
          className={`font-serif font-bold inline-flex items-center justify-center w-9 h-11 sm:w-14 sm:h-16 text-[24px] sm:text-[42px] shadow-md shrink-0 ${item.bg} ${item.text} ${item.rot}`}
        >
          {item.char}
        </span>
      ))}
    </div>
  );
}

function AutoAdvanceBar() {
  return (
    <motion.span
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: AUTO_ADVANCE_DELAY_MS / 1000, ease: 'linear' }}
      style={{ transformOrigin: 'left center' }}
      className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[#F9B800]"
    />
  );
}

export default function App() {
  const [initialTicket] = useState(() => readSavedTicket());
  const [ticketNumber, setTicketNumber] = useState(initialTicket);
  const [currentStepId, setCurrentStepId] = useState(initialTicket ? 'ticket' : 'name');
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [institute, setInstitute] = useState('');
  const [department, setDepartment] = useState('');
  const [sourceMode, setSourceMode] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [song, setSong] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendingChoice, setPendingChoice] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const autoAdvanceTimerRef = useRef(null);
  const blurResetTimerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const submitAbortRef = useRef(null);
  const songAutoDashJustInsertedRef = useRef(false);
  const songAutoDashDismissedRef = useRef(false);

  const includeDepartment = institute === '' || institute === 'ЭМИТ';
  const questionSteps = includeDepartment
    ? ['name', 'course', 'institute', 'department', 'source', 'song']
    : ['name', 'course', 'institute', 'source', 'song'];

  const currentQuestionIndex = questionSteps.indexOf(currentStepId);
  const currentStepNumber = currentQuestionIndex >= 0 ? currentQuestionIndex + 1 : questionSteps.length;
  const totalQuestionSteps = questionSteps.length;

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setPendingChoice(null);
  }, []);

  const resetInputFocus = useCallback(() => {
    if (blurResetTimerRef.current !== null) {
      clearTimeout(blurResetTimerRef.current);
      blurResetTimerRef.current = null;
    }
    setIsInputFocused(false);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (blurResetTimerRef.current !== null) {
      clearTimeout(blurResetTimerRef.current);
      blurResetTimerRef.current = null;
    }
    setIsInputFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (blurResetTimerRef.current !== null) {
      clearTimeout(blurResetTimerRef.current);
    }
    blurResetTimerRef.current = setTimeout(() => {
      blurResetTimerRef.current = null;
      setIsInputFocused(false);
    }, BLUR_RESET_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      cancelAutoAdvance();
      if (blurResetTimerRef.current !== null) {
        clearTimeout(blurResetTimerRef.current);
      }
      if (submitAbortRef.current) {
        submitAbortRef.current.abort();
      }
    };
  }, [cancelAutoAdvance]);

  const handleNameChange = (e) => {
    const input = e.target;
    const rawValue = input.value;
    const formatted = formatNameInput(rawValue);
    const start = input.selectionStart;
    const end = input.selectionEnd;

    setName(formatted);

    if (formatted !== rawValue && start !== null && end !== null) {
      const delta = formatted.length - rawValue.length;
      requestAnimationFrame(() => {
        if (document.activeElement === input) {
          try {
            input.setSelectionRange(start + delta, end + delta);
          } catch {
          }
        }
      });
    }
  };

  const handleSongChange = (e) => {
    const nextValue = e.target.value;
    const prevValue = song;

    if (submitError) setSubmitError('');

    if (nextValue.length === 0) {
      songAutoDashJustInsertedRef.current = false;
      songAutoDashDismissedRef.current = false;
      setSong('');
      return;
    }

    if (
      songAutoDashJustInsertedRef.current &&
      prevValue.endsWith(' — ') &&
      nextValue === prevValue.slice(0, -1)
    ) {
      songAutoDashJustInsertedRef.current = false;
      songAutoDashDismissedRef.current = true;
      setSong(`${prevValue.slice(0, -3)} `);
      return;
    }

    songAutoDashJustInsertedRef.current = false;

    const isAddingText = nextValue.length > prevValue.length;
    const isSingleWordFollowedBySpace = /^\s*\S+ $/.test(nextValue);
    const hasDashAlready = /[—–-]/.test(nextValue);

    if (
      isAddingText &&
      !songAutoDashDismissedRef.current &&
      isSingleWordFollowedBySpace &&
      !hasDashAlready
    ) {
      songAutoDashJustInsertedRef.current = true;
      setSong(`${nextValue.slice(0, -1)} — `);
      return;
    }

    setSong(nextValue);
  };

  const resolvedSource =
    sourceMode === 'custom'
      ? customSource.trim()
      : sourceMode === 'friends'
        ? 'Друзья рассказали'
        : sourceMode === 'tgk'
          ? 'Из ТГК'
          : '';

  const canProceedTextStep = () => {
    if (currentStepId === 'name') return name.replace(/\s+/g, '').length >= 3;
    if (currentStepId === 'source' && sourceMode === 'custom') return customSource.trim().length >= 2;
    if (currentStepId === 'song') return song.trim().length >= 2;
    return false;
  };

  const handleAutoSelect = (stepId, value, setter, nextStepId) => {
    if (isSubmittingRef.current) return;

    if (pendingChoice && pendingChoice.stepId === stepId && pendingChoice.value === value) {
      return;
    }

    cancelAutoAdvance();
    resetInputFocus();
    setter(value);

    if (stepId === 'institute' && value !== 'ЭМИТ') {
      setDepartment('');
    }

    setPendingChoice({ stepId, value });

    autoAdvanceTimerRef.current = setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      setPendingChoice(null);
      setDirection(1);
      setCurrentStepId(nextStepId);
    }, AUTO_ADVANCE_DELAY_MS);
  };

  const handleSourcePresetClick = (preset) => {
    if (isSubmittingRef.current) return;

    if (preset.isCustom) {
      cancelAutoAdvance();
      setSourceMode(preset.id);
      return;
    }

    handleAutoSelect('source', preset.id, setSourceMode, 'song');
  };

  const goNext = () => {
    if (!canProceedTextStep() || isSubmittingRef.current) return;

    cancelAutoAdvance();
    resetInputFocus();

    if (currentStepId === 'song') {
      handleSubmit();
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questionSteps.length) {
      setDirection(1);
      setCurrentStepId(questionSteps[nextIndex]);
    }
  };

  const goBack = () => {
    if (isSubmittingRef.current || currentQuestionIndex <= 0) return;

    cancelAutoAdvance();
    resetInputFocus();
    setSubmitError('');
    setDirection(-1);
    setCurrentStepId(questionSteps[currentQuestionIndex - 1]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goNext();
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError('');

    if (submitAbortRef.current) {
      submitAbortRef.current.abort();
    }

    const controller = new AbortController();
    submitAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          course,
          institute,
          department: institute === 'ЭМИТ' ? department : '',
          source: resolvedSource,
          song: song.trim(),
        }),
        signal: controller.signal,
      });

      const rawText = await res.text();
      let data = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error('Сервер вернул некорректный ответ. Попробуй ещё раз.');
      }

      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.error || 'Не удалось сохранить анкету. Попробуй ещё раз.');
      }

      const receivedTicket = String(data.ticketNumber ?? '').trim();
      if (!receivedTicket) {
        throw new Error('Не удалось получить номер билета. Попробуй ещё раз.');
      }

      try {
        localStorage.setItem(STORAGE_KEY, receivedTicket);
      } catch {
      }

      resetInputFocus();
      setTicketNumber(receivedTicket);
      setDirection(1);
      setCurrentStepId('ticket');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setSubmitError('Сервер отвечает слишком долго. Проверь интернет и попробуй ещё раз.');
      } else if (err instanceof TypeError) {
        setSubmitError('Нет соединения с сервером. Проверь интернет и попробуй ещё раз.');
      } else {
        setSubmitError(err?.message || 'Ошибка соединения. Попробуй ещё раз.');
      }
    } finally {
      clearTimeout(timeoutId);
      submitAbortRef.current = null;
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-ready relative min-h-dvh flex flex-col craft-noise bg-[#D6C2AD]">
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-0 h-12">
        <div className="absolute top-0 left-0 right-0 h-12 bg-[#F28752] torn-top-back opacity-95" />
        <div className="absolute top-0 left-0 right-0 h-8 bg-[#EB5618] torn-top-front" />
      </div>

      <header
        className={`pointer-events-none absolute top-7 sm:top-8 left-0 right-0 z-10 flex justify-center px-4 transition-all duration-300 ease-out ${
          isInputFocused
            ? '-translate-y-6 opacity-0 sm:translate-y-0 sm:opacity-100'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <CollageLogo />
      </header>

      <main
        className={`relative z-10 flex-1 w-full flex items-start justify-center pb-14 transition-[padding-top] duration-300 ease-out ${
          isInputFocused
            ? 'pt-12 sm:pt-[max(10vh,96px)]'
            : 'pt-[max(15vh,96px)] sm:pt-[max(15vh,118px)]'
        }`}
      >
        <div className="w-[calc(100%-64px)] max-w-[560px] mx-auto flex flex-col items-center">
          {currentStepId !== 'ticket' && (
            <div
              role="status"
              aria-live="polite"
              className={`inline-flex items-baseline justify-center gap-2 bg-[#F4EBE1] px-10 py-2.5 sm:px-14 sm:py-3 rounded-full shadow-sm whitespace-nowrap shrink-0 select-none transition-[margin-bottom] duration-300 ease-out ${
                isInputFocused ? 'mb-3 sm:mb-5' : 'mb-5 sm:mb-6'
              }`}
            >
              <span className="font-display text-xs sm:text-sm text-[#1A1A1A]/60 uppercase tracking-wider leading-none">
                Вопрос
              </span>
              <span className="font-display text-sm sm:text-base text-[#EB5618] leading-none tabular-nums">
                {currentStepNumber}
              </span>
              <span className="font-display text-xs sm:text-sm text-[#1A1A1A]/60 uppercase tracking-wider leading-none">
                из
              </span>
              <span className="font-display text-sm sm:text-base text-[#1A1A1A]/75 leading-none tabular-nums">
                {totalQuestionSteps}
              </span>
            </div>
          )}

          <div className="w-full">
            <AnimatePresence mode="wait" custom={direction}>
              {currentStepId === 'name' && (
                <motion.section
                  key="name"
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={CARD_CLASS}
                >
                  <h1 className={TITLE_CLASS}>Как тебя зовут?</h1>
                  <input
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    maxLength={120}
                    value={name}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onChange={handleNameChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Твоё имя и фамилия"
                    className={INPUT_CLASS}
                  />
                  <div className="mt-12 sm:mt-16 flex items-center justify-end w-full">
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canProceedTextStep()}
                      className="group w-full min-h-[54px] bg-[#1A1A1A] hover:bg-[#EB5618] active:scale-[0.99] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 disabled:cursor-not-allowed text-[#F4EBE1] font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span>Далее</span>
                      <NavArrow direction="right" />
                    </button>
                  </div>
                </motion.section>
              )}

              {currentStepId === 'course' && (
                <motion.section
                  key="course"
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={CARD_CLASS}
                >
                  <h2 className={TITLE_CLASS}>Какой у тебя курс?</h2>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {COURSES.map((item) => {
                      const isSelected = course === item;
                      const isPending =
                        pendingChoice?.stepId === 'course' && pendingChoice?.value === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAutoSelect('course', item, setCourse, 'institute')}
                          className={`relative overflow-hidden w-full min-h-[64px] py-4 sm:py-5 rounded-xl font-display text-2xl sm:text-3xl transition-colors cursor-pointer border-2 active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[#EB5618] text-[#F4EBE1] border-[#EB5618]'
                              : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/35 text-[#1A1A1A]'
                          }`}
                        >
                          {item}
                          {isPending && <AutoAdvanceBar />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-12 sm:mt-16 flex items-center justify-start w-full">
                    <BackButton onClick={goBack} />
                  </div>
                </motion.section>
              )}

              {currentStepId === 'institute' && (
                <motion.section
                  key="institute"
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={CARD_CLASS}
                >
                  <h2 className={TITLE_CLASS}>Институт?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                    {INSTITUTES.map((item) => {
                      const isSelected = institute === item;
                      const isPending =
                        pendingChoice?.stepId === 'institute' && pendingChoice?.value === item;
                      const nextStep = item === 'ЭМИТ' ? 'department' : 'source';
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAutoSelect('institute', item, setInstitute, nextStep)}
                          className={`relative overflow-hidden w-full min-h-[58px] py-3 px-2 sm:py-4 rounded-xl text-center font-display text-sm sm:text-base leading-snug transition-colors cursor-pointer border-2 active:scale-[0.98] ${
                            isSelected
                              ? 'bg-[#EB5618] text-[#F4EBE1] border-[#EB5618]'
                              : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/35 text-[#1A1A1A]'
                          }`}
                        >
                          {item}
                          {isPending && <AutoAdvanceBar />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-12 sm:mt-16 flex items-center justify-start w-full">
                    <BackButton onClick={goBack} />
                  </div>
                </motion.section>
              )}

              {currentStepId === 'department' && (
                <motion.section
                  key="department"
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={CARD_CLASS}
                >
                  <h2 className={TITLE_CLASS}>Отделение?</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                    {DEPARTMENTS.map((item, idx) => {
                      const isSelected = department === item;
                      const isPending =
                        pendingChoice?.stepId === 'department' && pendingChoice?.value === item;
                      const isLastWide = idx === DEPARTMENTS.length - 1;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAutoSelect('department', item, setDepartment, 'source')}
                          className={`relative overflow-hidden w-full min-h-[54px] py-3 px-2 rounded-xl text-center font-display text-sm sm:text-base leading-snug transition-colors cursor-pointer border-2 active:scale-[0.98] ${
                            isLastWide ? 'col-span-2 sm:col-span-3' : ''
                          } ${
                            isSelected
                              ? 'bg-[#EB5618] text-[#F4EBE1] border-[#EB5618]'
                              : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/35 text-[#1A1A1A]'
                          }`}
                        >
                          {item}
                          {isPending && <AutoAdvanceBar />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-12 sm:mt-16 flex items-center justify-start w-full">
                    <BackButton onClick={goBack} />
                  </div>
                </motion.section>
              )}

              {currentStepId === 'source' && (
                <motion.section
                  key="source"
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={CARD_CLASS}
                >
                  <h2 className={TITLE_CLASS}>Откуда ты узнал про нас?</h2>
                  <div className="flex flex-col gap-3 w-full">
                    {SOURCE_PRESETS.map((preset) => {
                      const isSelected = sourceMode === preset.id;
                      const isPending =
                        pendingChoice?.stepId === 'source' && pendingChoice?.value === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSourcePresetClick(preset)}
                          className={`relative overflow-hidden w-full min-h-[54px] flex items-center justify-between px-4 sm:px-5 py-3.5 rounded-xl text-left font-bold text-sm sm:text-base transition-colors border-2 cursor-pointer active:scale-[0.99] ${
                            isSelected
                              ? preset.isCustom
                                ? 'bg-[#FCD3C1] border-[#EB5618] text-[#1A1A1A]'
                                : 'bg-[#EB5618] border-[#EB5618] text-[#F4EBE1]'
                              : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/35 text-[#1A1A1A]'
                          }`}
                        >
                          <span>{preset.label}</span>
                          {isSelected && (
                            <Check
                              className={`w-5 h-5 shrink-0 ${
                                preset.isCustom ? 'text-[#EB5618]' : 'text-[#F4EBE1]'
                              }`}
                            />
                          )}
                          {isPending && <AutoAdvanceBar />}
                        </button>
                      );
                    })}

                    <AnimatePresence>
                      {sourceMode === 'custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden w-full"
                        >
                          <input
                            type="text"
                            maxLength={140}
                            value={customSource}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            onChange={(e) => setCustomSource(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Напиши свой вариант..."
                            className={`${INPUT_CLASS} mt-1`}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-12 sm:mt-16 flex items-center justify-between gap-3 sm:gap-4 w-full">
                    <BackButton onClick={goBack} fullFlex={sourceMode === 'custom'} />
                    {sourceMode === 'custom' && (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!canProceedTextStep()}
                        className="group flex-1 min-h-[54px] bg-[#1A1A1A] hover:bg-[#EB5618] active:scale-[0.99] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 disabled:cursor-not-allowed text-[#F4EBE1] font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span>Далее</span>
                        <NavArrow direction="right" />
                      </button>
                    )}
                  </div>
                </motion.section>
              )}

              {currentStepId === 'song' && (
                <motion.section
                  key="song"
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className={CARD_CLASS}
                >
                  <h2 className={TITLE_CLASS}>Какая твоя любимая песня?</h2>
                  <input
                    type="text"
                    autoCapitalize="none"
                    maxLength={140}
                    value={song}
                    disabled={isSubmitting}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onChange={handleSongChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Исполнитель — Трек"
                    className={`${INPUT_CLASS} disabled:opacity-60`}
                  />

                  {submitError && (
                    <div
                      role="alert"
                      className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#E32026]/10 border border-[#E32026]/30 px-4 py-3 text-sm font-semibold text-[#B91C1C]"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="mt-12 sm:mt-16 flex items-center justify-between gap-3 sm:gap-4 w-full">
                    <BackButton onClick={goBack} disabled={isSubmitting} fullFlex />
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canProceedTextStep() || isSubmitting}
                      className="group flex-1 min-h-[54px] bg-[#EB5618] hover:bg-[#1A1A1A] active:scale-[0.99] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 disabled:cursor-not-allowed text-[#F4EBE1] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-colors shadow-lg cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                          <span>Грузим...</span>
                        </>
                      ) : (
                        <>
                          <TicketIcon />
                          <span>В лотерею</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.section>
              )}

              {currentStepId === 'ticket' && ticketNumber && (
                <motion.div
                  key="ticket"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full drop-shadow-[0_20px_28px_rgba(26,26,26,0.18)]"
                >
                  <section className="ticket-cutout relative bg-[#F4EBE1] pt-10 pb-9 px-6 sm:px-12 rounded-[16px] text-center flex flex-col items-center w-full">
                    <h2 className="font-display text-3xl sm:text-5xl text-[#1A1A1A] mb-1.5 leading-tight">
                      Ура! Вы в лотерее!
                    </h2>
                    <p className="font-display text-lg sm:text-2xl uppercase tracking-widest text-[#1A1A1A]/60">
                      Ваш номер:
                    </p>

                    <motion.div
                      initial={{ scale: 0.6, rotate: -5 }}
                      animate={{ scale: 1, rotate: -2 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="mt-2 mb-6 sm:mb-8 w-full flex justify-center"
                    >
                      <span
                        className={`font-display ${getTicketNumberSizeClass(ticketNumber)} leading-none tabular-nums whitespace-nowrap text-[#EB5618] block drop-shadow-[6px_6px_0px_#1A1A1A]`}
                      >
                        {ticketNumber}
                      </span>
                    </motion.div>

                    <div className="w-full max-w-[280px] aspect-[4/3] bg-[#F4EBE1] border-2 border-dashed border-[#1A1A1A]/20 rounded-xl flex flex-col items-center justify-center px-4">
                      <span className="font-display text-[#1A1A1A]/25 text-lg sm:text-xl">
                        Место под фото
                      </span>
                      <span className="text-[#1A1A1A]/30 text-xs sm:text-sm font-bold mt-1">
                        (заменим позже)
                      </span>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="pointer-events-none relative z-0 mt-auto h-11 w-full">
        <div className="absolute bottom-0 left-0 right-0 h-11 bg-[#F28752] torn-bottom-back opacity-95" />
        <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#EB5618] torn-bottom-front" />
      </footer>
    </div>
  );
}
