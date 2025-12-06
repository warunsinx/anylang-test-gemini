import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Button, Input, Select, Card, Badge, Tabs } from './components/UI';
import { AppState, UserConfig, Article, Vocabulary, SUPPORTED_LANGUAGES } from './types';
import { generateArticle } from './services/geminiService';

export default function App() {
  // --- STATE ---
  
  // Persisted Config
  const [config, setConfig] = useState<UserConfig>(() => {
    const saved = localStorage.getItem('anylang_config');
    const parsed = saved ? JSON.parse(saved) : {};
    
    // Migration for old config style
    return {
      learningLanguages: parsed.learningLanguages || (parsed.targetLanguage ? [parsed.targetLanguage] : []),
      nativeLanguage: parsed.nativeLanguage || '',
      totalWordsLearned: parsed.totalWordsLearned || 0,
      theme: parsed.theme || 'light'
    };
  });

  // Persisted Articles
  const [articles, setArticles] = useState<Article[]>(() => {
    const saved = localStorage.getItem('anylang_articles');
    return saved ? JSON.parse(saved) : [];
  });

  // Session State
  const [sessionLang, setSessionLang] = useState<string>(() => {
    if (config.learningLanguages.length > 0) return config.learningLanguages[0];
    return '';
  });
  
  const [appState, setAppState] = useState<AppState>(() => {
    return (config.learningLanguages.length > 0 && config.nativeLanguage) ? AppState.DASHBOARD : AppState.ONBOARDING;
  });

  // UI State moved to top level to prevent Hook errors
  const [tempTargetLang, setTempTargetLang] = useState('');
  
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState('Reading List'); // 'Reading List' | 'Completed'

  // Quiz State
  const [quizState, setQuizState] = useState<{
    currentQuestionIndex: number;
    score: number;
    showResult: boolean; // Show result of current question
    selectedOption: string | null; // ID of selected vocabulary definition
    options: Vocabulary[]; // Current options for the question
  }>({
    currentQuestionIndex: 0,
    score: 0,
    showResult: false,
    selectedOption: null,
    options: []
  });

  // --- EFFECTS ---

  useEffect(() => {
    localStorage.setItem('anylang_config', JSON.stringify(config));
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config]);

  useEffect(() => {
    localStorage.setItem('anylang_articles', JSON.stringify(articles));
  }, [articles]);

  // Ensure session lang matches available languages
  useEffect(() => {
    if (!sessionLang && config.learningLanguages.length > 0) {
      setSessionLang(config.learningLanguages[0]);
    }
  }, [config.learningLanguages, sessionLang]);


  // --- HELPERS ---

  const activeArticle = articles.find(a => a.id === activeArticleId);

  const getFilteredArticles = (status: 'new' | 'completed') => {
    return articles
      .filter(a => a.language === sessionLang)
      .filter(a => status === 'completed' ? a.status === 'completed' : a.status !== 'completed')
      .sort((a, b) => b.createdAt - a.createdAt);
  };

  // --- HANDLERS ---

  const handleOnboarding = () => {
    if (config.learningLanguages.length > 0 && config.nativeLanguage) {
      setSessionLang(config.learningLanguages[0]);
      setAppState(AppState.DASHBOARD);
    }
  };

  const addLanguage = (lang: string) => {
    if (!config.learningLanguages.includes(lang)) {
      setConfig(prev => ({
        ...prev,
        learningLanguages: [...prev.learningLanguages, lang]
      }));
    }
  };

  const removeLanguage = (lang: string) => {
    const newLangs = config.learningLanguages.filter(l => l !== lang);
    setConfig(prev => ({ ...prev, learningLanguages: newLangs }));
    if (sessionLang === lang && newLangs.length > 0) {
      setSessionLang(newLangs[0]);
    } else if (newLangs.length === 0) {
      setSessionLang('');
      setAppState(AppState.ONBOARDING);
    }
  };

  const toggleTheme = () => {
    setConfig(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
        setError("Please enter a topic.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const newArticle = await generateArticle(sessionLang, config.nativeLanguage, topic);
      setArticles(prev => [newArticle, ...prev]);
      setActiveArticleId(newArticle.id);
      setAppState(AppState.READING);
      setTopic('');
    } catch (err: any) {
      setError(err.message || "Failed to generate.");
    } finally {
      setLoading(false);
    }
  };

  const prepareQuiz = (article: Article) => {
    // Initialize first question options
    const firstQuestionOpts = generateOptions(article, 0);
    setQuizState({
      currentQuestionIndex: 0,
      score: 0,
      showResult: false,
      selectedOption: null,
      options: firstQuestionOpts
    });
    setAppState(AppState.QUIZ);
  };

  const generateOptions = (article: Article, questionIndex: number) => {
    const correctVocab = article.vocabulary[questionIndex];
    const otherVocabs = article.vocabulary.filter((_, idx) => idx !== questionIndex);
    // Shuffle others and pick 3
    const shuffledOthers = [...otherVocabs].sort(() => 0.5 - Math.random()).slice(0, 3);
    // Combine and shuffle
    return [correctVocab, ...shuffledOthers].sort(() => 0.5 - Math.random());
  };

  const handleQuizAnswer = (vocabId: string) => {
    if (!activeArticle || quizState.showResult) return;

    const correctId = activeArticle.vocabulary[quizState.currentQuestionIndex].id;
    const isCorrect = vocabId === correctId;

    setQuizState(prev => ({
      ...prev,
      selectedOption: vocabId,
      showResult: true,
      score: isCorrect ? prev.score + 1 : prev.score
    }));
  };

  const nextQuizQuestion = () => {
    if (!activeArticle) return;

    const nextIndex = quizState.currentQuestionIndex + 1;
    
    if (nextIndex < activeArticle.vocabulary.length) {
      setQuizState({
        currentQuestionIndex: nextIndex,
        score: quizState.score,
        showResult: false,
        selectedOption: null,
        options: generateOptions(activeArticle, nextIndex)
      });
    } else {
      // Quiz Finished - Move index to trigger Result View
      setQuizState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
      
      // If 10/10, Mark as completed and update stats
      if (quizState.score === activeArticle.vocabulary.length) {
        setArticles(prev => prev.map(a => 
          a.id === activeArticle.id ? { ...a, status: 'completed' } : a
        ));
        setConfig(prev => ({
          ...prev,
          totalWordsLearned: prev.totalWordsLearned + activeArticle.vocabulary.length
        }));
      }
    }
  };

  // --- VIEWS ---

  const renderOnboarding = () => {
    const handleAddTemp = () => {
        if(tempTargetLang && !config.learningLanguages.includes(tempTargetLang)) {
            setConfig(prev => ({...prev, learningLanguages: [...prev.learningLanguages, tempTargetLang]}));
            setTempTargetLang('');
        }
    };

    return (
      <div className="flex flex-col h-full justify-center items-center space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-serif font-bold">Anylang.</h2>
          <p className="opacity-60">Minimalist Language Learning.</p>
        </div>
        
        <div className="w-full max-w-sm space-y-6">
          <Select 
            label="I speak (Native Language)" 
            options={SUPPORTED_LANGUAGES}
            value={config.nativeLanguage}
            onChange={(e) => setConfig({ ...config, nativeLanguage: e.target.value })}
          />
          
          <div className="space-y-2">
            <Select 
                label="I want to learn (Select one or more)" 
                options={SUPPORTED_LANGUAGES}
                value={tempTargetLang}
                onChange={(e) => setTempTargetLang(e.target.value)}
            />
             <Button 
                variant="secondary" 
                fullWidth 
                onClick={handleAddTemp} 
                disabled={!tempTargetLang}
                className="text-sm py-2"
            >
                Add Language
            </Button>
            
            <div className="flex flex-wrap gap-2 mt-2">
                {config.learningLanguages.map(lang => (
                    <Badge key={lang} onClick={() => removeLanguage(lang)}>
                        {lang} ✕
                    </Badge>
                ))}
            </div>
          </div>

          <Button 
            fullWidth 
            onClick={handleOnboarding}
            disabled={config.learningLanguages.length === 0 || !config.nativeLanguage}
          >
            {config.learningLanguages.length > 0 ? "Start Journey" : "Select a Language"}
          </Button>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const activeList = getFilteredArticles('new');
    const completedList = getFilteredArticles('completed');
    const displayList = dashboardTab === 'Reading List' ? activeList : completedList;

    return (
      <div className="flex flex-col h-full space-y-6 animate-fade-in">
        {/* Header Logic */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <div className="flex-1">
                    <label className="text-xs uppercase tracking-widest opacity-50 block mb-1">Current Session</label>
                    <div className="relative inline-block w-full max-w-[200px]">
                        <select 
                            value={sessionLang}
                            onChange={(e) => {
                                if (e.target.value === 'ADD_NEW') {
                                    setAppState(AppState.ONBOARDING);
                                } else {
                                    setSessionLang(e.target.value);
                                }
                            }}
                            className="bg-transparent text-2xl font-serif font-bold cursor-pointer focus:outline-none w-full appearance-none pr-6 truncate"
                        >
                            {config.learningLanguages.map(l => (
                                <option key={l} value={l} className="bg-stone-50 dark:bg-stone-900">{l}</option>
                            ))}
                            <option value="ADD_NEW" className="bg-stone-50 dark:bg-stone-900 text-stone-400 font-normal text-sm">+ Add Language</option>
                        </select>
                         <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="text-3xl font-serif font-bold">{config.totalWordsLearned}</span>
                    <span className="block text-xs uppercase tracking-widest opacity-50">Words Collected</span>
                 </div>
            </div>
            
            {/* Generate Input */}
            <div className="bg-white dark:bg-stone-800 p-4 border border-stone-200 dark:border-stone-700 shadow-sm flex flex-col sm:flex-row gap-4">
                 <Input 
                    placeholder={`Topic in ${sessionLang} (e.g. Coffee, Travel)`} 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="flex-grow"
                 />
                 <Button onClick={handleGenerate} disabled={loading}>
                    {loading ? "Generating..." : "Generate New"}
                 </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <Tabs 
            tabs={['Reading List', 'Completed']} 
            activeTab={dashboardTab} 
            onChange={setDashboardTab} 
        />

        {/* List */}
        <div className="flex-grow overflow-y-auto space-y-4 pb-12">
            {displayList.length === 0 ? (
                <div className="text-center py-12 opacity-40 font-serif italic">
                    {dashboardTab === 'Reading List' ? "No articles yet. Generate one!" : "No completed articles yet."}
                </div>
            ) : (
                displayList.map(article => (
                    <Card 
                        key={article.id} 
                        onClick={() => {
                            setActiveArticleId(article.id);
                            setAppState(AppState.READING);
                        }}
                        className="group hover:border-stone-900 dark:hover:border-stone-100 transition-colors"
                    >
                        <h3 className="text-xl font-bold font-serif mb-2">{article.title}</h3>
                        <p className="line-clamp-2 opacity-60 text-sm font-serif">{article.content}</p>
                        <div className="mt-4 flex justify-between items-center text-xs opacity-40 uppercase tracking-widest">
                            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                            <span>{article.vocabulary.length} Vocabs</span>
                        </div>
                    </Card>
                ))
            )}
        </div>
      </div>
    );
  };

  const renderArticle = () => {
    if (!activeArticle) return null;
    return (
        <div className="flex flex-col space-y-8 animate-fade-in pb-20">
            <div className="space-y-2">
                <Button 
                    variant="outline" 
                    className="text-xs px-3 py-1 mb-2 border-0 pl-0 hover:bg-transparent hover:text-stone-500"
                    onClick={() => setAppState(AppState.DASHBOARD)}
                >
                    ← Back to Dashboard
                </Button>
                <div className="flex justify-between items-start">
                    <h2 className="text-3xl font-serif font-bold leading-tight flex-1 mr-4">
                        {activeArticle.title}
                    </h2>
                    {activeArticle.status === 'completed' && <Badge active>Completed</Badge>}
                </div>
            </div>

            {/* Content */}
            <div className="prose dark:prose-invert font-serif leading-loose text-lg text-justify opacity-90 border-b border-stone-200 dark:border-stone-800 pb-8">
                {activeArticle.content.split('\n').map((para, idx) => (
                    <p key={idx} className="mb-4">{para}</p>
                ))}
            </div>

            {/* Vocabulary List */}
            <div className="space-y-6">
                <h3 className="text-xl font-serif font-bold">Vocabulary Collection</h3>
                <div className="grid gap-4">
                    {activeArticle.vocabulary.map((vocab, idx) => (
                        <div key={vocab.id} className="p-4 border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/50">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-bold font-serif text-lg">{vocab.term}</h4>
                                <span className="text-xs font-mono opacity-50">{vocab.pronunciation}</span>
                            </div>
                            <p className="text-stone-600 dark:text-stone-400 italic mb-2">{vocab.definition}</p>
                            <p className="text-xs opacity-60">"{vocab.contextSentence}"</p>
                        </div>
                    ))}
                </div>
            </div>
            
            {activeArticle.status !== 'completed' && (
                <div className="sticky bottom-6 flex justify-center pt-6 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent dark:from-stone-900 dark:via-stone-900 p-4">
                    <Button onClick={() => prepareQuiz(activeArticle)} className="shadow-xl">
                        Take Quiz to Archive
                    </Button>
                </div>
            )}
        </div>
    );
  };

  const renderQuiz = () => {
    if (!activeArticle) return null;
    
    // Quiz Completed View
    if (quizState.currentQuestionIndex >= activeArticle.vocabulary.length) {
        const isPerfect = quizState.score === activeArticle.vocabulary.length;
        
        return (
             <div className="flex flex-col h-full justify-center items-center space-y-8 animate-fade-in text-center">
                 <h2 className="text-5xl font-serif font-bold">{quizState.score} / {activeArticle.vocabulary.length}</h2>
                 <p className="text-xl font-serif italic opacity-70">
                    {isPerfect ? "Perfect Score! Article Archived." : "Good try, but you need a perfect score (10/10) to archive."}
                 </p>
                 <div className="space-y-4 w-full max-w-xs">
                    {isPerfect ? (
                        <Button fullWidth onClick={() => {
                            setAppState(AppState.DASHBOARD);
                            setDashboardTab('Completed');
                        }}>Return to Dashboard</Button>
                    ) : (
                        <>
                            <Button fullWidth onClick={() => prepareQuiz(activeArticle)}>Retake Quiz</Button>
                            <Button fullWidth variant="outline" onClick={() => setAppState(AppState.READING)}>Back to Article</Button>
                        </>
                    )}
                 </div>
             </div>
        );
    }

    // Active Quiz View
    const currentVocab = activeArticle.vocabulary[quizState.currentQuestionIndex];
    
    return (
        <div className="flex flex-col h-full animate-fade-in max-w-lg mx-auto w-full pt-8">
            <div className="mb-8 flex justify-between items-center text-xs font-mono opacity-50 uppercase tracking-widest">
                <span>Quiz</span>
                <span>{quizState.currentQuestionIndex + 1} / {activeArticle.vocabulary.length}</span>
            </div>

            <div className="mb-8 text-center space-y-2">
                <span className="text-xs opacity-50 uppercase tracking-widest">What is the definition of</span>
                <h2 className="text-4xl font-serif font-bold py-4">{currentVocab.term}</h2>
            </div>

            <div className="space-y-3">
                {quizState.options.map((opt) => {
                    const isSelected = quizState.selectedOption === opt.id;
                    const isCorrect = opt.id === currentVocab.id;
                    
                    let btnVariant: 'outline' | 'primary' | 'danger' = 'outline';
                    if (quizState.showResult) {
                        if (isCorrect) btnVariant = 'primary';
                        else if (isSelected && !isCorrect) btnVariant = 'danger';
                    }

                    return (
                        <button
                            key={opt.id}
                            disabled={quizState.showResult}
                            onClick={() => handleQuizAnswer(opt.id)}
                            className={`w-full p-4 text-left border font-serif transition-all duration-200 
                                ${btnVariant === 'outline' ? 'border-stone-300 hover:border-stone-900 dark:border-stone-700 dark:hover:border-stone-100' : ''}
                                ${btnVariant === 'primary' ? 'bg-stone-900 text-white border-stone-900 dark:bg-stone-100 dark:text-black dark:border-stone-100' : ''}
                                ${btnVariant === 'danger' ? 'bg-red-100 text-red-900 border-red-500 dark:bg-red-900/50 dark:text-red-100 dark:border-red-500' : ''}
                            `}
                        >
                            {opt.definition}
                        </button>
                    );
                })}
            </div>

            {quizState.showResult && (
                <div className="mt-8 animate-fade-in">
                    <Button fullWidth onClick={nextQuizQuestion}>
                        {quizState.currentQuestionIndex === activeArticle.vocabulary.length - 1 ? "See Results" : "Next Question"}
                    </Button>
                </div>
            )}
            
             <Button 
                variant="outline" 
                className="mt-auto mb-4 border-0 text-xs opacity-50 hover:bg-transparent"
                onClick={() => setAppState(AppState.READING)}
            >
                Cancel Quiz
            </Button>
        </div>
    );
  };

  return (
    <Layout darkMode={config.theme === 'dark'} toggleTheme={toggleTheme}>
      {appState === AppState.ONBOARDING && renderOnboarding()}
      {appState === AppState.DASHBOARD && renderDashboard()}
      {appState === AppState.READING && renderArticle()}
      {appState === AppState.QUIZ && renderQuiz()}
    </Layout>
  );
}