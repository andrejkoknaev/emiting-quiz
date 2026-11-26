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
  enter: (dir) => ({ opacity: 0, y: dir > 0 ? 24 : -24, scale: 0.97 }),
  center: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } },
  exit: (dir) => ({ opacity: 0, y: dir > 0 ? -24 : 24, scale: 0.97, transition: { duration: 0.15 } }),
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
    <div className="inline-flex items-center gap-1.5 select-none">
      {letters.map((item, idx) => (
        <span key={idx} className={`font-display inline-flex items-center justify-center w-12 h-14 sm:w-16 sm:h-[72px] text-3xl sm:text-5xl shadow-md ${item.bg} ${item.text} ${item.rot}`}>
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
    try {
      const savedTicket = localStorage.getItem('emiting_ticket');
      if (savedTicket && savedTicket !== 'undefined' && savedTicket !== 'null') {
        setTicketNumber(Number(savedTicket));
        setCurrentIndex(activeSteps.length - 1);
      }
    } catch (e) {
      console.error("Ошибка чтения localStorage", e);
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
    if (currentStepId === 'source') return resolvedSource.length >= 2;
    if (currentStepId === 'song') return song.trim().length >= 2;
    return false;
  };

  const handleQuickChoice = (setter, value) => {
    setter(value);
    setTimeout(() => {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }, 150);
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
      setCurrentIndex(activeSteps.length - 1); 
    } catch (err) {
      alert('Ошибка соединения. Попробуй ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col craft-noise">
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-0">
        <div className="h-12 bg-[#F28752] torn-top opacity-90" />
        <div className="h-9 -mt-8 bg-[#EB5618] torn-top" />
      </div>

      <header className="relative z-10 w-full max-w-lg mx-auto px-5 pt-12 pb-4 flex flex-col items-center justify-center gap-5">
        <CollageLogo />
        {currentStepId !== 'ticket' && (
          <div className="flex items-center gap-2 bg-[#FAF3E8] px-5 py-2 rounded-full shadow-sm border border-[#1A1A1A]/10">
            <span className="font-display text-sm text-[#1A1A1A]/50 uppercase tracking-widest mt-0.5">Шаг</span>
            <span className="font-mono-code text-base font-bold text-[#EB5618]">0{currentIndex + 1}</span>
            <span className="text-base text-[#1A1A1A]/30">/</span>
            <span className="font-mono-code text-base font-semibold text-[#1A1A1A]/50">0{activeSteps.length - 1}</span>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStepId === 'name' && (
              <motion.section key="name" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-6 sm:p-10 rounded-3xl shadow-xl">
                <h1 className="font-display text-3xl sm:text-4xl leading-tight text-[#1A1A1A] mb-6 sm:mb-8">Как вас зовут?</h1>
                <input 
                  ref={inputRef} 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  placeholder="Имя и Фамилия" 
                  className="w-full bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 text-2xl sm:text-3xl font-bold px-6 py-5 rounded-2xl outline-none border-2 border-[#1A1A1A]/10 focus:border-[#EB5618] transition-colors shadow-inner" 
                />
                <div className="mt-8 sm:mt-10 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1A1A1A]/30 hidden sm:inline">Нажми <kbd className="font-mono-code text-[#1A1A1A]/50">Enter</kbd></span>
                  <button onClick={goNext} disabled={!canProceed()} className="ml-auto bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 text-[#FAF3E8] font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer">
                    Дальше <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'course' && (
              <motion.section key="course" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-6 sm:p-10 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-4xl leading-tight text-[#1A1A1A] mb-6 sm:mb-8">Какой у тебя курс?</h2>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {COURSES.map(item => (
                    <button key={item} onClick={() => handleQuickChoice(setCourse, item)} className={`py-6 sm:py-8 rounded-2xl font-display text-4xl transition-colors cursor-pointer border-2 ${course === item ? 'bg-[#EB5618] text-white border-[#EB5618]' : 'bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'institute' && (
              <motion.section key="institute" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-6 sm:p-10 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-4xl leading-tight text-[#1A1A1A] mb-6 sm:mb-8">Институт?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {INSTITUTES.map(item => (
                    <button key={item} onClick={() => handleQuickChoice(setInstitute, item)} className={`py-5 px-3 rounded-2xl text-center font-display text-xl transition-colors cursor-pointer border-2 ${institute === item ? 'bg-[#EB5618] text-white border-[#EB5618]' : 'bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'department' && (
              <motion.section key="department" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-6 sm:p-10 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-4xl leading-tight text-[#1A1A1A] mb-6 sm:mb-8">Отделение?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {DEPARTMENTS.map(item => (
                    <button key={item} onClick={() => handleQuickChoice(setDepartment, item)} className={`py-4 px-2 rounded-2xl text-center font-display text-lg sm:text-xl transition-colors cursor-pointer border-2 ${department === item ? 'bg-[#EB5618] text-white border-[#EB5618]' : 'bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'source' && (
              <motion.section key="source" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-6 sm:p-10 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-4xl leading-tight text-[#1A1A1A] mb-6 sm:mb-8">Откуда ты узнал про нас?</h2>
                <div className="flex flex-col gap-2 sm:gap-3">
                  {SOURCE_PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => setSourceMode(preset.id)} className={`flex items-center justify-between px-6 py-5 rounded-2xl text-left font-bold text-lg transition-colors cursor-pointer border-2 ${sourceMode === preset.id ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {preset.label}
                      {sourceMode === preset.id && <Check className="w-6 h-6 text-[#F9B800]" />}
                    </button>
                  ))}
                  <AnimatePresence>
                    {sourceMode === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <input ref={inputRef} type="text" value={customSource} onChange={(e) => setCustomSource(e.target.value)} onKeyDown={handleKeyDown} placeholder="Напиши свой вариант..." className="w-full bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 text-lg sm:text-xl font-bold px-6 py-5 rounded-2xl outline-none border-2 border-[#1A1A1A]/10 focus:border-[#EB5618] transition-colors mt-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between">
                  <button onClick={goBack} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                  <button onClick={goNext} disabled={!canProceed()} className="bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 text-[#FAF3E8] font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer">Дальше <ArrowRight className="w-5 h-5" /></button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'song' && (
              <motion.section key="song" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#FAF3E8] p-6 sm:p-10 rounded-3xl shadow-xl">
                <h2 className="font-display text-3xl sm:text-4xl leading-tight text-[#1A1A1A] mb-6 sm:mb-8">Какая твоя любимая песня?</h2>
                <input ref={inputRef} type="text" value={song} onChange={(e) => setSong(e.target.value)} onKeyDown={handleKeyDown} placeholder="Исполнитель — Трек" className="w-full bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 text-2xl sm:text-3xl font-bold px-6 py-5 rounded-2xl outline-none border-2 border-[#1A1A1A]/10 focus:border-[#EB5618] transition-colors shadow-inner" />
                <div className="mt-8 sm:mt-10 flex items-center justify-between">
                  <button onClick={goBack} disabled={isSubmitting} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A] font-bold flex items-center gap-2 px-4 py-2 cursor-pointer"><ArrowLeft className="w-5 h-5" /> Назад</button>
                  <button onClick={goNext} disabled={!canProceed() || isSubmitting} className="bg-[#EB5618] hover:bg-[#1A1A1A] disabled:bg-[#1A1A1A]/20 text-[#FAF3E8] font-bold px-8 py-4 rounded-2xl flex items-center gap-3 transition-colors cursor-pointer shadow-lg">
                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Грузим...</> : <><Sparkles className="w-5 h-5" /> В лотерею</>}
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'ticket' && ticketNumber && (
              <motion.section key="ticket" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-[#FAF3E8] pt-10 pb-8 px-6 sm:px-12 rounded-3xl shadow-2xl text-center overflow-hidden flex flex-col items-center">
                <div className="absolute top-[35%] -left-6 -translate-y-1/2 w-12 h-12 rounded-full bg-[#E3CCB0]" />
                <div className="absolute top-[35%] -right-6 -translate-y-1/2 w-12 h-12 rounded-full bg-[#E3CCB0]" />
                
                <h2 className="font-display text-4xl sm:text-5xl text-[#1A1A1A] mb-1 sm:mb-2 leading-tight">Ура! Вы в лотерее!</h2>
                <p className="font-display text-xl sm:text-3xl uppercase tracking-widest text-[#1A1A1A]/60">Ваш номер:</p>
                
                <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', damping: 15 }} className="mt-1 mb-2">
                  <span className="font-display text-[160px] sm:text-[200px] leading-none text-[#EB5618] block drop-shadow-[5px_5px_0px_#1A1A1A]">{ticketNumber}</span>
                </motion.div>
                
                <div className="inline-flex items-center gap-3 bg-[#1A1A1A] px-8 py-4 rounded-2xl rotate-2 mb-6">
                  <span className="w-4 h-4 rounded-full bg-[#009B4D] animate-pulse" />
                  <span className="font-display text-2xl sm:text-3xl text-[#F9B800] tracking-wide">Заскринь его!</span>
                </div>

                <div className="w-full max-w-[280px] aspect-[4/3] bg-white border-2 border-dashed border-[#1A1A1A]/20 rounded-3xl flex flex-col items-center justify-center">
                  <span className="font-display text-[#1A1A1A]/25 text-xl">Место под фото</span>
                  <span className="text-[#1A1A1A]/30 text-sm font-bold mt-1">(заменим позже)</span>
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
