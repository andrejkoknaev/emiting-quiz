import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles, Music, Loader2 } from 'lucide-react';

const SOURCE_PRESETS = [
  { id: 'friends', label: 'Друзья рассказали' },
  { id: 'tgk', label: 'Из ТГК' },
  { id: 'custom', label: 'Свой вариант' },
];

const COURSES = ['1', '2', '3', '4'];

const cardVariants = {
  enter: (direction) => ({
    opacity: 0,
    y: direction > 0 ? 36 : -36,
    rotate: direction > 0 ? 1.5 : -1.5,
    scale: 0.97,
  }),
  center: {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 28,
      mass: 0.9,
    },
  },
  exit: (direction) => ({
    opacity: 0,
    y: direction > 0 ? -32 : 32,
    rotate: direction > 0 ? -1.5 : 1.5,
    scale: 0.97,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
};

function BurstStar({ className }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <path
        d="M60 4L64 49L103 21L71 55L116 60L71 65L103 99L64 71L60 116L56 71L17 99L49 65L4 60L49 55L17 21L56 49L60 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CollageLogo() {
  const letters = [
    { char: 'Э', bg: 'bg-[#646373]', text: 'text-[#FAF3E8]', rot: '-rotate-3' },
    { char: 'М', bg: 'bg-[#FAF3E8]', text: 'text-[#E32026]', rot: 'rotate-2' },
    { char: 'И', bg: 'bg-[#FAF3E8]', text: 'text-[#1A1A1A]', rot: '-rotate-2' },
    { char: 'Т', bg: 'bg-[#1A1A1A]', text: 'text-[#FAF3E8]', rot: 'rotate-3' },
    { char: 'И', bg: 'bg-[#E32026]', text: 'text-[#FAF3E8]', rot: '-rotate-1' },
    { char: 'Н', bg: 'bg-[#FAF3E8]', text: 'text-[#1A1A1A]', rot: 'rotate-2' },
    { char: 'Г', bg: 'bg-[#646373]', text: 'text-[#F9B800]', rot: '-rotate-3' },
  ];

  return (
    <div className="inline-flex items-center gap-1 select-none" aria-label="ЭМИТИНГ">
      {letters.map((item, idx) => (
        <span
          key={idx}
          className={`font-display inline-flex items-center justify-center w-8 h-9 sm:w-9 sm:h-10 text-base sm:text-lg shadow-sm ${item.bg} ${item.text} ${item.rot}`}
        >
          {item.char}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0); // 0..3 — вопросы, 4 — лотерейный билет
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [sourceMode, setSourceMode] = useState(''); // 'friends' | 'tgk' | 'custom'
  const [customSource, setCustomSource] = useState('');
  const [song, setSong] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketNumber, setTicketNumber] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    const savedTicket = localStorage.getItem('emiting_lottery_ticket');
    const savedName = localStorage.getItem('emiting_lottery_name');
    if (savedTicket) {
      setTicketNumber(Number(savedTicket));
      if (savedName) setName(savedName);
      setStep(4);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 260);
    return () => clearTimeout(timer);
  }, [step, sourceMode]);

  const resolvedSource =
    sourceMode === 'friends'
      ? 'Друзья рассказали'
      : sourceMode === 'tgk'
        ? 'Из ТГК'
        : customSource.trim();

  const canProceed = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return Boolean(course);
    if (step === 2) return resolvedSource.length >= 2;
    if (step === 3) return song.trim().length >= 2;
    return false;
  };

  const goNext = () => {
    if (!canProceed() || isSubmitting) return;
    setErrorMsg('');
    if (step < 3) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 0 && !isSubmitting) {
      setErrorMsg('');
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goNext();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          course,
          source: resolvedSource,
          song: song.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Не удалось сохранить ответ');
      }

      localStorage.setItem('emiting_lottery_ticket', String(data.ticketNumber));
      localStorage.setItem('emiting_lottery_name', name.trim());

      setTicketNumber(data.ticketNumber);
      setDirection(1);
      setStep(4);
    } catch (err) {
      setErrorMsg(err.message || 'Ошибка соединения. Попробуй ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-between craft-noise overflow-hidden">
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-0">
        <div className="h-10 sm:h-14 bg-[#F28752] torn-top opacity-90" />
        <div className="h-8 sm:h-11 -mt-7 sm:-mt-10 bg-[#EB5618] torn-top" />
      </div>

      <BurstStar className="pointer-events-none fixed -top-6 -right-6 w-36 h-36 sm:w-48 sm:h-48 text-[#EB5618] opacity-90 rotate-12 z-0" />

      <header className="relative z-10 w-full max-w-xl mx-auto px-5 pt-10 sm:pt-12 flex items-center justify-between">
        <CollageLogo />

        {step < 4 && (
          <div className="flex items-center gap-2 bg-[#FAF3E8] px-3 py-1.5 rounded-full shadow-xs">
            <span className="font-mono-code text-xs font-bold tracking-wider text-[#EB5618]">
              0{step + 1}
            </span>
            <span className="text-xs text-[#1A1A1A]/40">/</span>
            <span className="font-mono-code text-xs font-semibold text-[#1A1A1A]/60">04</span>
          </div>
        )}
      </header>

      {step < 4 && (
        <div className="relative z-10 w-full max-w-xl mx-auto px-5 mt-4">
          <div className="h-1.5 w-full bg-[#1A1A1A]/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#EB5618]"
              initial={false}
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            />
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 && (
              <motion.section
                key="step-0"
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="bg-[#FAF3E8] p-7 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(26,26,26,0.12)]"
              >
                <span className="inline-block bg-[#EB5618] text-[#FAF3E8] font-mono-code text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-md -rotate-1 mb-5">
                  Вопрос 1
                </span>

                <h1 className="font-display text-2xl sm:text-4xl leading-tight text-[#1A1A1A] mb-3">
                  Как тебя зовут?
                </h1>
                <p className="text-sm sm:text-base text-[#1A1A1A]/65 mb-7">
                  Имя или ник — чтобы мы знали, кому вручать приз в лотерее.
                </p>

                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Например, Алина"
                  maxLength={60}
                  className="w-full bg-[#E3CCB0]/45 focus:bg-[#E3CCB0]/70 text-[#1A1A1A] placeholder:text-[#1A1A1A]/35 text-xl sm:text-2xl font-semibold px-5 py-4 rounded-2xl outline-none transition-colors"
                />

                <div className="mt-8 flex items-center justify-between">
                  <span className="text-xs text-[#1A1A1A]/45 hidden sm:inline">
                    Нажми <kbd className="font-mono-code font-bold">Enter ↵</kbd>
                  </span>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="ml-auto inline-flex items-center gap-2.5 bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 disabled:cursor-not-allowed text-[#FAF3E8] font-semibold px-7 py-3.5 rounded-2xl transition-colors cursor-pointer"
                  >
                    Дальше
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.section>
            )}

            {step === 1 && (
              <motion.section
                key="step-1"
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="bg-[#FAF3E8] p-7 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(26,26,26,0.12)]"
              >
                <span className="inline-block bg-[#009B4D] text-[#FAF3E8] font-mono-code text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-md rotate-1 mb-5">
                  Вопрос 2
                </span>

                <h2 className="font-display text-2xl sm:text-4xl leading-tight text-[#1A1A1A] mb-3">
                  Какой курс?
                </h2>
                <p className="text-sm sm:text-base text-[#1A1A1A]/65 mb-7">
                  Выбери свой курс обучения.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {COURSES.map((item) => {
                    const active = course === item;
                    return (
                      <motion.button
                        key={item}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCourse(item);
                          setTimeout(() => {
                            setDirection(1);
                            setStep(2);
                          }, 220);
                        }}
                        className={`relative py-6 rounded-2xl font-display text-3xl transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#EB5618] text-[#FAF3E8] shadow-md'
                            : 'bg-[#E3CCB0]/50 hover:bg-[#E3CCB0] text-[#1A1A1A]'
                        }`}
                      >
                        {item}
                        <span className="block font-sans text-xs font-medium mt-1 opacity-75">
                          курс
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] px-3 py-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="inline-flex items-center gap-2.5 bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 disabled:cursor-not-allowed text-[#FAF3E8] font-semibold px-7 py-3.5 rounded-2xl transition-colors cursor-pointer"
                  >
                    Дальше
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="step-2"
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="bg-[#FAF3E8] p-7 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(26,26,26,0.12)]"
              >
                <span className="inline-block bg-[#F9B800] text-[#1A1A1A] font-mono-code text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-md -rotate-1 mb-5">
                  Вопрос 3
                </span>

                <h2 className="font-display text-2xl sm:text-4xl leading-tight text-[#1A1A1A] mb-3">
                  Откуда узнала про нас?
                </h2>
                <p className="text-sm sm:text-base text-[#1A1A1A]/65 mb-6">
                  Выбери вариант или напиши от себя.
                </p>

                <div className="space-y-3">
                  {SOURCE_PRESETS.map((preset) => {
                    const active = sourceMode === preset.id;
                    return (
                      <motion.button
                        key={preset.id}
                        type="button"
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setSourceMode(preset.id)}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left font-semibold text-base sm:text-lg transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1A1A1A] text-[#FAF3E8]'
                            : 'bg-[#E3CCB0]/50 hover:bg-[#E3CCB0] text-[#1A1A1A]'
                        }`}
                      >
                        <span>{preset.label}</span>
                        {active && <Check className="w-5 h-5 text-[#F9B800]" />}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {sourceMode === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 14 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={customSource}
                        onChange={(e) => setCustomSource(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Напиши откуда: афиша в холле, куратор..."
                        maxLength={100}
                        className="w-full bg-[#E3CCB0]/45 focus:bg-[#E3CCB0]/70 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-base sm:text-lg font-medium px-5 py-3.5 rounded-2xl outline-none transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] px-3 py-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="inline-flex items-center gap-2.5 bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 disabled:cursor-not-allowed text-[#FAF3E8] font-semibold px-7 py-3.5 rounded-2xl transition-colors cursor-pointer"
                  >
                    Дальше
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                key="step-3"
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="bg-[#FAF3E8] p-7 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(26,26,26,0.12)]"
              >
                <span className="inline-flex items-center gap-1.5 bg-[#E32026] text-[#FAF3E8] font-mono-code text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-md rotate-1 mb-5">
                  <Music className="w-3.5 h-3.5" />
                  Вопрос 4
                </span>

                <h2 className="font-display text-2xl sm:text-4xl leading-tight text-[#1A1A1A] mb-3">
                  Какая песня тебе нравится больше всего?
                </h2>
                <p className="text-sm sm:text-base text-[#1A1A1A]/65 mb-7">
                  Возможно, она прозвучит в музыкальном туре квиза.
                </p>

                <input
                  ref={inputRef}
                  type="text"
                  value={song}
                  onChange={(e) => setSong(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Исполнитель — Название трека"
                  maxLength={120}
                  className="w-full bg-[#E3CCB0]/45 focus:bg-[#E3CCB0]/70 text-[#1A1A1A] placeholder:text-[#1A1A1A]/35 text-lg sm:text-xl font-semibold px-5 py-4 rounded-2xl outline-none transition-colors"
                />

                {errorMsg && (
                  <p className="mt-4 text-sm font-medium text-[#E32026] bg-[#E32026]/10 px-4 py-2.5 rounded-xl">
                    {errorMsg}
                  </p>
                )}

                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] px-3 py-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed() || isSubmitting}
                    className="inline-flex items-center gap-2.5 bg-[#EB5618] hover:bg-[#1A1A1A] disabled:bg-[#1A1A1A]/20 disabled:cursor-not-allowed text-[#FAF3E8] font-semibold px-7 py-3.5 rounded-2xl transition-colors cursor-pointer shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Генерируем номер...
                      </>
                    ) : (
                      <>
                        Получить номер
                        <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.section>
            )}

            {step === 4 && ticketNumber !== null && (
              <motion.section
                key="step-lottery"
                initial={{ opacity: 0, scale: 0.9, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="relative bg-[#FAF3E8] pt-9 pb-8 px-7 sm:px-11 rounded-3xl shadow-[0_25px_60px_rgba(26,26,26,0.18)] text-center overflow-hidden"
              >
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E3CCB0]" />
                <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E3CCB0]" />

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <h2 className="font-display text-2xl sm:text-4xl text-[#1A1A1A] tracking-tight">
                    Ура! Ты в лотерее!
                  </h2>
                  <p className="mt-2 font-mono-code text-sm sm:text-base font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/80">
                    ВАШ НОМЕР:
                  </p>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.4, rotate: -6, opacity: 0 }}
                  animate={{ scale: 1, rotate: -2, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 18,
                    delay: 0.2,
                  }}
                  className="my-6 sm:my-8 select-all"
                >
                  <span className="font-display text-[88px] sm:text-[124px] leading-none text-[#EB5618] drop-shadow-[4px_4px_0px_#1A1A1A]">
                    {ticketNumber}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="inline-flex flex-col items-center"
                >
                  <div className="inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF3E8] px-5 py-2.5 rounded-2xl rotate-1 shadow-sm">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#009B4D] animate-pulse" />
                    <span className="font-display text-sm sm:text-base tracking-wide text-[#F9B800]">
                      Заскринь его!
                    </span>
                  </div>

                  {name && (
                    <p className="mt-4 text-xs sm:text-sm text-[#1A1A1A]/60">
                      Участник: <strong className="text-[#1A1A1A]">{name}</strong> · {course} курс
                    </p>
                  )}
                </motion.div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="pointer-events-none relative z-0 mt-auto">
        <div className="h-9 sm:h-12 bg-[#F28752] torn-bottom opacity-90" />
        <div className="h-7 sm:h-10 -mt-6 sm:-mt-8 bg-[#EB5618] torn-bottom" />
      </footer>
    </div>
  );
}
