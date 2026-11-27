import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'emiting_ticket';
const AUTO_ADVANCE_DELAY_MS = 900;
const CLIENT_TIMEOUT_MS = 12000;

const COURSES = ['1', '2', '3', '4'];
const INSTITUTES = ['ЭМИТ', 'ИОН', 'ИГСУ', 'ИПНБ', 'ИНУП', 'Ресурс России'];
const DEPARTMENTS = ['ОЭ', 'ОНЭ', 'ОБИ', 'ОПИ', 'ОМЭС', 'ООП', 'IT менеджмент'];
const SOURCE_PRESETS = [
  { id: 'friends', label: 'Друзья рассказали', isCustom: false },
  { id: 'tgk', label: 'Из ТГК', isCustom: false },
  { id: 'custom', label: 'Свой вариант', isCustom: true },
];

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

  const inputRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const submitAbortRef = useRef(null);

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

  useEffect(() => {
    return () => {
      cancelAutoAdvance();
      if (submitAbortRef.current) {
        submitAbortRef.current.abort();
      }
    };
  }, [cancelAutoAdvance]);

  useEffect(() => {
    if (
      currentStepId === 'name' ||
      currentStepId === 'song' ||
      (currentStepId === 'source' && sourceMode === 'custom')
    ) {
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 260);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentStepId, sourceMode]);

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
        // Игнорируем ограничения localStorage в приватном режиме
      }

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
    <div className="relative min-h-dvh flex flex-col craft-noise bg-[#D6C2AD]">
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-0">
        <div className="h-11 bg-[#F28752] torn-top opacity-90" />
        <div className="h-8 -mt-7 bg-[#EB5618] torn-top" />
      </div>

      <header className="pointer-events-none absolute top-7 sm:top-8 left-0 right-0 z-10 flex justify-center px-4">
        <CollageLogo />
      </header>

      <main className="relative z-10 flex-1 w-full flex items-start justify-center pt-[max(15vh,96px)] sm:pt-[max(15vh,118px)] pb-14">
        <div className="w-[calc(100%-64px)] max-w-[560px] mx-auto flex flex-col items-center">
          {currentStepId !== 'ticket' && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 sm:mb-6 inline-flex items-center justify-center gap-2 bg-[#F4EBE1] px-11 py-2.5 sm:px-14 sm:py-3 rounded-full border-2 border-[#1A1A1A]/15 shadow-sm whitespace-nowrap shrink-0 select-none"
            >
              <span className="font-display text-xs sm:text-sm text-[#1A1A1A]/60 uppercase tracking-wider leading-none">
                Шаг
              </span>
              <span className="font-mono-code text-base sm:text-lg font-bold text-[#EB5618] leading-none tabular-nums">
                {currentStepNumber}
              </span>
              <span className="font-display text-xs sm:text-sm text-[#1A1A1A]/60 uppercase tracking-wider leading-none">
                из
              </span>
              <span className="font-mono-code text-base sm:text-lg font-bold text-[#1A1A1A]/70 leading-none tabular-nums">
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
                  className="bg-[#F4EBE1] p-6 sm:p-10 rounded-[16px] shadow-xl border border-[#1A1A1A]/10 overflow-hidden w-full"
                >
                  <h1 className="font-display text-[24px] sm:text-[32px] leading-tight text-[#1A1A1A] mb-6 sm:mb-7 text-center sm:text-left">
                    Как вас зовут?
                  </h1>

                  <input
                    ref={inputRef}
                    type="text"
                    autoComplete="name"
                    maxLength={120}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Твоё имя и фамилия"
                    className="w-full bg-[#F4EBE1] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-base sm:text-lg font-bold px-4 sm:px-5 py-4 rounded-xl outline-none border-2 border-[#1A1A1A]/15 focus:border-[#EB5618] transition-colors"
                  />

                  <div className="mt-12 sm:mt-16 flex items-center justify-end w-full">
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canProceedTextStep()}
                      className="w-full min-h-[54px] bg-[#1A1A1A] hover:bg-[#EB5618] active:scale-[0.99] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 disabled:cursor-not-allowed text-[#F4EBE1] font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      Далее <ArrowRight className="w-5 h-5" />
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
                  className="bg-[#F4EBE1] p-6 sm:p-10 rounded-[16px] shadow-xl border border-[#1A1A1A]/10 overflow-hidden w-full"
                >
                  <h2 className="font-display text-[24px] sm:text-[32px] leading-tight text-[#1A1A1A] mb-6 sm:mb-7 text-center sm:text-left">
                    Какой у тебя курс?
                  </h2>

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
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-full sm:w-auto sm:min-w-[160px] min-h-[54px] border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 active:scale-[0.99] text-[#1A1A1A] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" /> Назад
                    </button>
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
                  className="bg-[#F4EBE1] p-6 sm:p-10 rounded-[16px] shadow-xl border border-[#1A1A1A]/10 overflow-hidden w-full"
                >
                  <h2 className="font-display text-[24px] sm:text-[32px] leading-tight text-[#1A1A1A] mb-6 sm:mb-7 text-center sm:text-left">
                    Институт?
                  </h2>

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
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-full sm:w-auto sm:min-w-[160px] min-h-[54px] border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 active:scale-[0.99] text-[#1A1A1A] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" /> Назад
                    </button>
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
                  className="bg-[#F4EBE1] p-6 sm:p-10 rounded-[16px] shadow-xl border border-[#1A1A1A]/10 overflow-hidden w-full"
                >
                  <h2 className="font-display text-[24px] sm:text-[32px] leading-tight text-[#1A1A1A] mb-6 sm:mb-7 text-center sm:text-left">
                    Отделение?
                  </h2>

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
                    <button
                      type="button"
                      onClick={goBack}
                      className="w-full sm:w-auto sm:min-w-[160px] min-h-[54px] border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 active:scale-[0.99] text-[#1A1A1A] font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" /> Назад
                    </button>
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
                  className="bg-[#F4EBE1] p-6 sm:p-10 rounded-[16px] shadow-xl border border-[#1A1A1A]/10 overflow-hidden w-full"
                >
                  <h2 className="font-display text-[24px] sm:text-[32px] leading-tight text-[#1A1A1A] mb-6 sm:mb-7 text-center sm:text-left">
                    Откуда ты узнал про нас?
                  </h2>

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
                            ref={inputRef}
                            type="text"
                            maxLength={140}
                            value={customSource}
                            onChange={(e) => setCustomSource(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Напиши свой вариант..."
                            className="w-full bg-[#F4EBE1] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-base sm:text-lg font-bold px-4 sm:px-5 py-4 rounded-xl outline-none border-2 border-[#1A1A1A]/15 focus:border-[#EB5618] transition-colors mt-1"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-12 sm:mt-16 flex items-center justify-between gap-3 sm:gap-4 w-full">
                    <button
                      type="button"
                      onClick={goBack}
                      className={`${
                        sourceMode === 'custom' ? 'flex-1' : 'w-full sm:w-auto sm:min-w-[160px]'
                      } min-h-[54px] border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 active:scale-[0.99] text-[#1A1A1A] font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer`}
                    >
                      <ArrowLeft className="w-5 h-5" /> Назад
                    </button>

                    {sourceMode === 'custom' && (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!canProceedTextStep()}
                        className="flex-1 min-h-[54px] bg-[#1A1A1A] hover:bg-[#EB5618] active:scale-[0.99] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 disabled:cursor-not-allowed text-[#F4EBE1] font-bold py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        Далее <ArrowRight className="w-5 h-5" />
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
                  className="bg-[#F4EBE1] p-6 sm:p-10 rounded-[16px] shadow-xl border border-[#1A1A1A]/10 overflow-hidden w-full"
                >
                  <h2 className="font-display text-[24px] sm:text-[32px] leading-tight text-[#1A1A1A] mb-6 sm:mb-7 text-center sm:text-left">
                    Какая твоя любимая песня?
                  </h2>

                  <input
                    ref={inputRef}
                    type="text"
                    maxLength={140}
                    value={song}
                    disabled={isSubmitting}
                    onChange={(e) => {
                      setSong(e.target.value);
                      if (submitError) setSubmitError('');
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Исполнитель — Трек"
                    className="w-full bg-[#F4EBE1] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-base sm:text-lg font-bold px-4 sm:px-5 py-4 rounded-xl outline-none border-2 border-[#1A1A1A]/15 focus:border-[#EB5618] disabled:opacity-60 transition-colors"
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
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={isSubmitting}
                      className="flex-1 min-h-[54px] border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A1A1A] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" /> Назад
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!canProceedTextStep() || isSubmitting}
                      className="flex-1 min-h-[54px] bg-[#EB5618] hover:bg-[#1A1A1A] active:scale-[0.99] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 disabled:cursor-not-allowed text-[#F4EBE1] font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                          <span>Грузим...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 shrink-0" />
                          <span>В лотерею</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.section>
              )}

              {currentStepId === 'ticket' && ticketNumber && (
                <motion.section
                  key="ticket"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-[#F4EBE1] pt-10 pb-9 px-6 sm:px-12 rounded-[16px] shadow-2xl border border-[#1A1A1A]/10 text-center overflow-hidden flex flex-col items-center w-full"
                >
                  <div className="absolute top-[36%] -left-5 -translate-y-1/2 w-10 h-10 rounded-full bg-[#D6C2AD]" />
                  <div className="absolute top-[36%] -right-5 -translate-y-1/2 w-10 h-10 rounded-full bg-[#D6C2AD]" />

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
                    className="my-2 w-full"
                  >
                    <span className="font-display text-[clamp(76px,22vw,168px)] leading-none tabular-nums text-[#EB5618] block drop-shadow-[5px_5px_0px_#1A1A1A] break-all">
                      {ticketNumber}
                    </span>
                  </motion.div>

                  <div className="inline-flex items-center gap-3 bg-[#1A1A1A] px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl rotate-2 mb-7">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#009B4D] animate-pulse shrink-0" />
                    <span className="font-display text-xl sm:text-3xl text-[#F9B800] tracking-wide whitespace-nowrap">
                      Заскринь его!
                    </span>
                  </div>

                  <div className="w-full max-w-[280px] aspect-[4/3] bg-[#F4EBE1] border-2 border-dashed border-[#1A1A1A]/20 rounded-xl flex flex-col items-center justify-center px-4">
                    <span className="font-display text-[#1A1A1A]/25 text-lg sm:text-xl">
                      Место под фото
                    </span>
                    <span className="text-[#1A1A1A]/30 text-xs sm:text-sm font-bold mt-1">
                      (заменим позже)
                    </span>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="pointer-events-none relative z-0 mt-auto">
        <div className="h-10 bg-[#F28752] torn-bottom opacity-90" />
        <div className="h-8 -mt-6 bg-[#EB5618] torn-bottom" />
      </footer>
    </div>
  );
}
