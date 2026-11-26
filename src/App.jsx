import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react';

const COURSES = ['1', '2', '3', '4'];
const INSTITUTES = ['ЭМИТ', 'ИОН', 'ИГСУ', 'ИПНБ', 'ИНУП', 'Ресурс России'];
const DEPARTMENTS = ['ОЭ', 'ОНЭ', 'ОБИ', 'ОПИ', 'ОМЭС', 'ООП', 'IT менеджмент'];
const SOURCE_PRESETS = [
  { id: 'friends', label: 'Друзья рассказали' },
  { id: 'tgk', label: 'Из ТГК' },
  { id: 'custom', label: 'Свой вариант' },
];

const cardVariants = {
  enter: (dir) => ({ opacity: 0, y: dir > 0 ? 32 : -32, scale: 0.96 }),
  center: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: (dir) => ({ opacity: 0, y: dir > 0 ? -32 : 32, scale: 0.96, transition: { duration: 0.15 } }),
};

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
    <div className="inline-flex items-center gap-1 select-none">
      {letters.map((item, idx) => (
        <span key={idx} className={`font-display inline-flex items-center justify-center w-8 h-9 sm:w-10 sm:h-11 text-base sm:text-lg shadow-sm ${item.bg} ${item.text} ${item.rot}`}>
          {item.char}
        </span>
      ))}
    </div>
  );
}

export default function App() {
  const [direction, setDirection] = useState(1);
  
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [institute, setInstitute] = useState('');
  const [department, setDepartment] = useState('');
  const [sourceMode, setSourceMode] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [song, setSong] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState(null);
  const inputRef = useRef(null);

  const activeSteps = [
    'name',
    'course',
    'institute',
    ...(institute === 'ЭМИТ' ? ['department'] : []),
    'source',
    'song',
    'ticket'
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStepId = activeSteps[currentIndex];

  useEffect(() => {
    const savedTicket = localStorage.getItem('emiting_ticket');
    if (savedTicket) {
      setTicketNumber(Number(savedTicket));
      setCurrentIndex(activeSteps.length - 1);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [currentIndex, sourceMode]);

  const resolvedSource = sourceMode === 'custom' ? customSource.trim() : 
                         sourceMode === 'friends' ? 'Друзья рассказали' : 
                         sourceMode === 'tgk' ? 'Из ТГК' : '';

  const canProceed = () => {
    if (currentStepId === 'name') return name.trim().split(' ').join('').length >= 3;
    if (currentStepId === 'course') return Boolean(course);
    if (currentStepId === 'institute') return Boolean(institute);
    if (currentStepId === 'department') return Boolean(department);
    if (currentStepId === 'source') return resolvedSource.length >= 2;
    if (currentStepId === 'song') return song.trim().length >= 2;
    return false;
  };

  const goNext = () => {
    if (!canProceed() || isSubmitting) return;
    if (currentStepId !== 'song') {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (currentIndex > 0 && !isSubmitting) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
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
          song: song.trim() 
        }),
      });
      
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);

      localStorage.setItem('emiting_ticket', String(data.ticketNumber));
      setTicketNumber(data.ticketNumber);
      setDirection(1);
      // Прыгаем на последний шаг графа (ticket)
      setCurrentIndex(activeSteps.length - 1); 
    } catch (err) {
      alert('Ошибка соединения. Попробуй ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col craft-noise">
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-0">
        <div className="h-12 bg-[#F28752] torn-top opacity-90" />
        <div className="h-9 -mt-8 bg-[#EB5618] torn-top" />
      </div>

      <header className="relative z-10 w-full max-w-2xl mx-auto px-6 pt-14 flex items-center justify-between">
        <CollageLogo />
        {currentStepId !== 'ticket' && (
          <div className="flex items-center gap-2 bg-[#FAF3E8] px-4 py-2 rounded-full shadow-sm">
            <span className="font-mono-code text-sm font-bold text-[#EB5618]">0{currentIndex + 1}</span>
            <span className="text-sm text-[#1A1A1A]/30">/</span>
            <span className="font-mono-code text-sm font-semibold text-[#1A1A1A]/50">0{activeSteps.length - 1}</span>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStepId === 'name' && (
              <motion.section key="name" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-7 sm:p-12 rounded-3xl shadow-xl">
                <h1 className="font-display text-3xl sm:text-5xl leading-none text-[#1A1A1A] mb-8">Как вас зовут?</h1>
                <div className="relative">
                  <input ref={inputRef} type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-[#E3CCB0]/40 focus:bg-[#E3CCB0]/70 text-[#1A1A1A] text-2xl sm:text-3xl font-bold px-6 py-5 rounded-2xl outline-none transition-colors relative z-10 bg-transparent" placeholder=" " />
                  {!name && (
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl font-bold text-[#1A1A1A]/30 pointer-events-none">
                      Имя и Фамилия
                    </span>
                  )}
                </div>
                <div className="mt-10 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1A1A1A]/30 hidden sm:inline">Нажми <kbd className="font-mono-code text-[#1A1A1A]/50">Enter</kbd></span>
                  <button onClick={goNext} disabled={!canProceed()} className="ml-auto bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 text-[#FAF3E8] font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer">
                    Дальше <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'course' && (
              <motion.section key="course" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-7 sm:p-12 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-5xl leading-none text-[#1A1A1A] mb-8">Какой курс?</h2>
                <div className="grid grid-cols-2 gap-4">
                  {COURSES.map(item => (
                    <button key={item} onClick={() => { setCourse(item); setTimeout(goNext, 180); }} className={`py-8 rounded-2xl font-display text-4xl transition-colors cursor-pointer ${course === item ? 'bg-[#EB5618] text-[#FAF3E8]' : 'bg-[#E3CCB0]/40 hover:bg-[#E3CCB0]/80 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'institute' && (
              <motion.section key="institute" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-7 sm:p-12 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-5xl leading-none text-[#1A1A1A] mb-8">Институт?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {INSTITUTES.map(item => (
                    <button key={item} onClick={() => { setInstitute(item); setTimeout(goNext, 180); }} className={`py-5 px-3 rounded-2xl text-center font-display text-xl transition-colors cursor-pointer ${institute === item ? 'bg-[#EB5618] text-[#FAF3E8]' : 'bg-[#E3CCB0]/40 hover:bg-[#E3CCB0]/80 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'department' && (
              <motion.section key="department" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-7 sm:p-12 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-5xl leading-none text-[#1A1A1A] mb-8">Отделение?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {DEPARTMENTS.map(item => (
                    <button key={item} onClick={() => { setDepartment(item); setTimeout(goNext, 180); }} className={`py-5 px-3 rounded-2xl text-center font-display text-lg sm:text-xl transition-colors cursor-pointer ${department === item ? 'bg-[#EB5618] text-[#FAF3E8]' : 'bg-[#E3CCB0]/40 hover:bg-[#E3CCB0]/80 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'source' && (
              <motion.section key="source" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-7 sm:p-12 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-5xl leading-none text-[#1A1A1A] mb-8">Откуда ты узнал про нас?</h2>
                <div className="flex flex-col gap-4">
                  {SOURCE_PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => setSourceMode(preset.id)} className={`flex items-center justify-between px-6 py-5 rounded-2xl text-left font-bold text-lg transition-colors cursor-pointer ${sourceMode === preset.id ? 'bg-[#1A1A1A] text-[#FAF3E8]' : 'bg-[#E3CCB0]/40 hover:bg-[#E3CCB0]/80 text-[#1A1A1A]'}`}>
                      {preset.label}
                      {sourceMode === preset.id && <Check className="w-6 h-6 text-[#F9B800]" />}
                    </button>
                  ))}
                  <AnimatePresence>
                    {sourceMode === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <input ref={inputRef} type="text" value={customSource} onChange={(e) => setCustomSource(e.target.value)} onKeyDown={handleKeyDown} placeholder="Напиши свой вариант..." className="w-full bg-[#E3CCB0]/40 focus:bg-[#E3CCB0]/70 text-[#1A1A1A] text-lg font-bold px-6 py-5 rounded-2xl outline-none mt-2" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                  <button onClick={goNext} disabled={!canProceed()} className="bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 text-[#FAF3E8] font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer">Дальше <ArrowRight className="w-5 h-5" /></button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'song' && (
              <motion.section key="song" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-7 sm:p-12 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-5xl leading-none text-[#1A1A1A] mb-8">Какая твоя любимая песня?</h2>
                <input ref={inputRef} type="text" value={song} onChange={(e) => setSong(e.target.value)} onKeyDown={handleKeyDown} placeholder="Исполнитель — Трек" className="w-full bg-[#E3CCB0]/40 focus:bg-[#E3CCB0]/70 text-[#1A1A1A] text-2xl font-bold px-6 py-5 rounded-2xl outline-none" />
                <div className="mt-10 flex items-center justify-between">
                  <button onClick={goBack} disabled={isSubmitting} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                  <button onClick={goNext} disabled={!canProceed() || isSubmitting} className="bg-[#EB5618] hover:bg-[#1A1A1A] disabled:bg-[#1A1A1A]/20 text-[#FAF3E8] font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer shadow-lg">
                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Грузим...</> : <><Sparkles className="w-5 h-5" /> В лотерею</>}
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'ticket' && ticketNumber && (
              <motion.section key="ticket" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-[#FAF3E8] py-16 px-10 rounded-3xl shadow-2xl text-center overflow-hidden">
                {/* Элемент перфорации */}
                <div className="absolute top-1/2 -left-6 -translate-y-1/2 w-12 h-12 rounded-full bg-[#E3CCB0]" />
                <div className="absolute top-1/2 -right-6 -translate-y-1/2 w-12 h-12 rounded-full bg-[#E3CCB0]" />
                
                <h2 className="font-display text-3xl sm:text-4xl text-[#1A1A1A] mb-2">Ура! Вы в лотерее!</h2>
                <p className="font-mono-code text-sm font-bold uppercase tracking-widest text-[#1A1A1A]/50">ВАШ НОМЕР:</p>
                
                <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', damping: 15 }} className="my-8">
                  <span className="font-display text-[100px] sm:text-[140px] leading-none text-[#EB5618] block drop-shadow-[4px_4px_0px_#1A1A1A]">{ticketNumber}</span>
                </motion.div>
                
                <div className="inline-flex items-center gap-3 bg-[#1A1A1A] px-6 py-3 rounded-2xl rotate-2">
                  <span className="w-3 h-3 rounded-full bg-[#009B4D] animate-pulse" />
                  <span className="font-display text-lg text-[#F9B800] tracking-wide">Заскринь его!</span>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="pointer-events-none relative z-0 mt-auto">
        <div className="h-10 bg-[#F28752] torn-bottom opacity-90" />
        <div className="h-8 -mt-6 bg-[#EB5618] torn-bottom" />
      </footer>
    </div>
  );
}
