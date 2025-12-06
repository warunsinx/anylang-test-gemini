import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, darkMode, toggleTheme }) => {
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-stone-900 text-stone-100' : 'bg-stone-50 text-stone-900'}`}>
      <div className="max-w-3xl mx-auto min-h-screen flex flex-col border-x border-stone-200 dark:border-stone-800 shadow-2xl relative">
        {/* Header */}
        <header className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center sticky top-0 bg-opacity-90 backdrop-blur-sm z-10 bg-stone-50 dark:bg-stone-900">
          <h1 className="text-2xl font-serif font-bold tracking-tight">Anylang.</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-6 flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="p-6 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 font-serif italic">
          <p>Read. Collect. Memorize.</p>
        </footer>
      </div>
    </div>
  );
};
