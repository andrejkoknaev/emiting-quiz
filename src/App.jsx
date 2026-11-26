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
    { char: 'Э', bg: 'bg-[#646373]', text: 'text-[#F4EBE1]', rot: '-rotate-3' },
    { char: 'М', bg: 'bg-[#F4EBE1]', text: 'text-[#E32026]', rot: 'rotate-2' },
    { char: 'И', bg: 'bg-[#F4EBE1]', text: 'text-[#1A1A1A]', rot: '-rotate-2' },
    { char: 'Т', bg: 'bg-[#1A1A1A]', text: 'text-[#F4EBE1]', rot: 'rotate-3' },
    { char: 'И', bg: 'bg-[#E32026]', text: 'text-[#F4EBE1]', rot: '-rotate-1' },
    { char: 'Н', bg: 'bg-[#F4EBE1]', text: 'text-[#1A1A1A]', rot: 'rotate-2' },
    { char: 'Г', bg: 'bg-[#646373]', text: 'text-[#F9B800]', rot: '-rotate-3' },
  ];
  return (
    <div className="inline-flex items-center gap-1.5 select-none">
      {letters.map((item, idx) => (
        <span key={idx} className={`font-serif font-bold inline-flex items-center justify-center w-[48px] h-[56px] sm:w-[72px] sm:h-[84px] text-[36px] sm:text-[58px] shadow-lg shrink-0 ${item.bg} ${item.text} ${item.rot}`}>
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
    <div className="min-h-full flex flex-col craft-noise bg-[#D6C2AD]">
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-0">
        <div className="h-12 bg-[#F28752] torn-top opacity-90" />
        <div className="h-9 -mt-8 bg-[#EB5618] torn-top" />
      </div>

      <header className="relative z-10 w-full max-w-[520px] mx-auto px-5 sm:px-6 pt-12 pb-2 flex flex-col items-center justify-center gap-6">
        <CollageLogo />
        {currentStepId !== 'ticket' && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 bg-[#F4EBE1] px-10 py-4 sm:px-12 sm:py-5 rounded-full border-2 border-[#1A1A1A]/15 shadow-sm whitespace-nowrap">
            <span className="font-display text-sm sm:text-base text-[#1A1A1A]/50 uppercase tracking-widest leading-none translate-y-[1px]">Шаг</span>
            <span className="font-mono-code text-lg sm:text-xl font-bold text-[#EB5618] leading-none translate-y-[1px]">0{currentIndex + 1}</span>
            <span className="text-lg sm:text-xl text-[#1A1A1A]/30 leading-none">/</span>
            <span className="font-mono-code text-lg sm:text-xl font-semibold text-[#1A1A1A]/50 leading-none translate-y-[1px]">0{activeSteps.length - 1}</span>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-6 py-4 sm:py-6 w-full max-w-[520px] mx-auto">
        <div className="w-full">
          <AnimatePresence mode="wait" custom={direction}>
            {currentStepId === 'name' && (
              <motion.section key="name" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#F4EBE1] p-8 sm:p-12 rounded-2xl shadow-xl border border-[#1A1A1A]/5 overflow-hidden w-full box-border">
                <h1 className="font-display text-[28px] sm:text-[34px] leading-tight text-[#1A1A1A] mb-6 sm:mb-8 text-center sm:text-left">Как вас зовут?</h1>
                
                <div className="relative">
                  <input 
                    ref={inputRef} 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    placeholder="Твоё имя и фамилия" 
                    className="w-full bg-[#F4EBE1] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-lg sm:text-xl font-bold px-5 py-4 rounded-xl outline-none border-2 border-[#1A1A1A]/15 focus:border-[#EB5618] transition-colors box-border" 
                  />
                </div>
                
                <div className="mt-8 sm:mt-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
                  <button onClick={goNext} disabled={!canProceed()} className="w-full bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 text-[#F4EBE1] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors box-border">
                    Дальше <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'course' && (
              <motion.section key="course" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#F4EBE1] p-8 sm:p-12 rounded-2xl shadow-xl border border-[#1A1A1A]/5 overflow-hidden w-full box-border">
                <h2 className="font-display text-[28px] sm:text-[34px] leading-tight text-[#1A1A1A] mb-6 sm:mb-8 text-center sm:text-left">Какой у тебя курс?</h2>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {COURSES.map(item => (
                    <button key={item} onClick={() => handleQuickChoice(setCourse, item)} className={`w-full py-4 sm:py-5 rounded-xl font-display text-2xl sm:text-3xl transition-colors cursor-pointer border-2 box-border ${course === item ? 'bg-[#EB5618] text-[#F4EBE1] border-[#EB5618]' : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
                  <button onClick={goBack} className="flex-1 w-full border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 text-[#1A1A1A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors box-border">
                    <ArrowLeft className="w-5 h-5" /> Назад
                  </button>
                  <button disabled className="flex-1 w-full bg-[#1A1A1A]/20 text-[#1A1A1A]/40 font-bold py-4 rounded-xl flex items-center justify-center gap-2 box-border">
                    Дальше <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'institute' && (
              <motion.section key="institute" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#F4EBE1] p-8 sm:p-12 rounded-2xl shadow-xl border border-[#1A1A1A]/5 overflow-hidden w-full box-border">
                <h2 className="font-display text-[28px] sm:text-[34px] leading-tight text-[#1A1A1A] mb-6 sm:mb-8 text-center sm:text-left">Институт?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                  {INSTITUTES.map(item => (
                    <button key={item} onClick={() => handleQuickChoice(setInstitute, item)} className={`w-full py-3 px-2 sm:py-4 rounded-xl text-center font-display text-base sm:text-lg transition-colors cursor-pointer border-2 box-border ${institute === item ? 'bg-[#EB5618] text-[#F4EBE1] border-[#EB5618]' : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
                  <button onClick={goBack} className="flex-1 w-full border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 text-[#1A1A1A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors box-border">
                    <ArrowLeft className="w-5 h-5" /> Назад
                  </button>
                  <button disabled className="flex-1 w-full bg-[#1A1A1A]/20 text-[#1A1A1A]/40 font-bold py-4 rounded-xl flex items-center justify-center gap-2 box-border">
                    Дальше <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'department' && (
              <motion.section key="department" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#F4EBE1] p-8 sm:p-12 rounded-2xl shadow-xl border border-[#1A1A1A]/5 overflow-hidden w-full box-border">
                <h2 className="font-display text-[28px] sm:text-[34px] leading-tight text-[#1A1A1A] mb-6 sm:mb-8 text-center sm:text-left">Отделение?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                  {DEPARTMENTS.map(item => (
                    <button key={item} onClick={() => handleQuickChoice(setDepartment, item)} className={`w-full py-3 px-1 rounded-xl text-center font-display text-xs sm:text-base transition-colors cursor-pointer border-2 box-border ${department === item ? 'bg-[#EB5618] text-[#F4EBE1] border-[#EB5618]' : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
                  <button onClick={goBack} className="flex-1 w-full border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 text-[#1A1A1A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors box-border">
                    <ArrowLeft className="w-5 h-5" /> Назад
                  </button>
                  <button disabled className="flex-1 w-full bg-[#1A1A1A]/20 text-[#1A1A1A]/40 font-bold py-4 rounded-xl flex items-center justify-center gap-2 box-border">
                    Дальше <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'source' && (
              <motion.section key="source" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#F4EBE1] p-8 sm:p-12 rounded-2xl shadow-xl border border-[#1A1A1A]/5 overflow-hidden w-full box-border">
                <h2 className="font-display text-[28px] sm:text-[34px] leading-tight text-[#1A1A1A] mb-6 sm:mb-8 text-center sm:text-left">Откуда ты узнал про нас?</h2>
                <div className="flex flex-col gap-3 w-full">
                  {SOURCE_PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => setSourceMode(preset.id)} className={`w-full flex items-center justify-between px-5 py-4 rounded-xl text-left font-bold text-sm sm:text-base transition-colors border-2 box-border ${sourceMode === preset.id ? 'bg-[#FCD3C1] border-[#EB5618] text-[#1A1A1A]' : 'bg-[#F4EBE1] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/30 text-[#1A1A1A]'}`}>
                      {preset.label}
                      {sourceMode === preset.id && <Check className="w-5 h-5 text-[#EB5618] shrink-0" />}
                    </button>
                  ))}
                  <AnimatePresence>
                    {sourceMode === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden w-full">
                        <input 
                          ref={inputRef} 
                          type="text" 
                          value={customSource} 
                          onChange={(e) => setCustomSource(e.target.value)} 
                          onKeyDown={handleKeyDown} 
                          placeholder="Напиши свой вариант..." 
                          className="w-full bg-[#F4EBE1] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-base sm:text-lg font-bold px-5 py-4 rounded-xl outline-none border-2 border-[#1A1A1A]/15 focus:border-[#EB5618] transition-colors mt-2 box-border" 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-8 sm:mt-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
                  <button onClick={goBack} className="flex-1 w-full border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 text-[#1A1A1A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors box-border">
                    <ArrowLeft className="w-5 h-5" /> Назад
                  </button>
                  <button onClick={goNext} disabled={!canProceed()} className="flex-1 w-full bg-[#1A1A1A] hover:bg-[#EB5618] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 text-[#F4EBE1] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors box-border">
                    Дальше <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'song' && (
              <motion.section key="song" custom={direction} variants={cardVariants} initial="enter" animate="center" exit="exit" className="bg-[#F4EBE1] p-8 sm:p-12 rounded-2xl shadow-xl border border-[#1A1A1A]/5 overflow-hidden w-full box-border">
                <h2 className="font-display text-[28px] sm:text-[34px] leading-tight text-[#1A1A1A] mb-6 sm:mb-8 text-center sm:text-left">Какая твоя любимая песня?</h2>
                <input 
                  ref={inputRef} 
                  type="text" 
                  value={song} 
                  onChange={(e) => setSong(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  placeholder="Исполнитель — Трек" 
                  className="w-full bg-[#F4EBE1] text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 text-lg sm:text-xl font-bold px-5 py-4 rounded-xl outline-none border-2 border-[#1A1A1A]/15 focus:border-[#EB5618] transition-colors box-border" 
                />
                <div className="mt-8 sm:mt-10 flex items-center justify-between gap-3 sm:gap-4 w-full">
                  <button onClick={goBack} disabled={isSubmitting} className="flex-1 w-full border-2 border-[#1A1A1A]/20 hover:bg-[#1A1A1A]/10 text-[#1A1A1A] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors box-border">
                    <ArrowLeft className="w-5 h-5" /> Назад
                  </button>
                  <button onClick={goNext} disabled={!canProceed() || isSubmitting} className="flex-1 w-full bg-[#EB5618] hover:bg-[#1A1A1A] disabled:bg-[#1A1A1A]/20 disabled:text-[#1A1A1A]/40 text-[#F4EBE1] font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg box-border">
                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Грузим...</> : <><Sparkles className="w-5 h-5" /> В лотерею</>}
                  </button>
                </div>
              </motion.section>
            )}

            {currentStepId === 'ticket' && ticketNumber && (
              <motion.section key="ticket" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-[#F4EBE1] pt-12 pb-10 px-8 sm:px-14 rounded-2xl shadow-2xl text-center overflow-hidden flex flex-col items-center w-full box-border">
                <div className="absolute top-[35%] -left-6 -translate-y-1/2 w-12 h-12 rounded-full bg-[#D6C2AD]" />
                <div className="absolute top-[35%] -right-6 -translate-y-1/2 w-12 h-12 rounded-full bg-[#D6C2AD]" />
                
                <h2 className="font-display text-4xl sm:text-5xl text-[#1A1A1A] mb-1 sm:mb-2 leading-tight">Ура! Вы в лотерее!</h2>
                <p className="font-display text-xl sm:text-3xl uppercase tracking-widest text-[#1A1A1A]/60">Ваш номер:</p>
                
                <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: -2 }} transition={{ type: 'spring', damping: 15 }} className="mt-1 mb-2">
                  <span className="font-display text-[160px] sm:text-[200px] leading-none text-[#EB5618] block drop-shadow-[5px_5px_0px_#1A1A1A]">{ticketNumber}</span>
                </motion.div>
                
                <div className="inline-flex items-center gap-3 bg-[#1A1A1A] px-8 py-4 rounded-xl rotate-2 mb-8">
                  <span className="w-4 h-4 rounded-full bg-[#009B4D] animate-pulse" />
                  <span className="font-display text-2xl sm:text-3xl text-[#F9B800] tracking-wide">Заскринь его!</span>
                </div>

                <div className="w-full max-w-[280px] aspect-[4/3] bg-[#F4EBE1] border-2 border-dashed border-[#1A1A1A]/20 rounded-xl flex flex-col items-center justify-center box-border">
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
