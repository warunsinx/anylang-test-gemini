import React from 'react';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = "px-6 py-3 font-serif font-medium transition-all duration-200 border disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-stone-900 text-stone-50 border-stone-900 hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 dark:hover:bg-stone-300",
    secondary: "bg-stone-200 text-stone-900 border-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-800 dark:hover:bg-stone-700",
    outline: "bg-transparent text-stone-900 border-stone-900 hover:bg-stone-100 dark:text-stone-100 dark:border-stone-100 dark:hover:bg-stone-800",
    danger: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900 hover:border-red-300"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-serif mb-1 opacity-80">{label}</label>}
      <input 
        className={`w-full bg-transparent border-b-2 border-stone-300 dark:border-stone-700 px-2 py-2 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 font-serif transition-colors ${className}`}
        {...props}
      />
    </div>
  );
};

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: string[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-serif mb-1 opacity-80">{label}</label>}
      <div className="relative">
        <select 
          className={`w-full appearance-none bg-transparent border-b-2 border-stone-300 dark:border-stone-700 px-2 py-2 pr-8 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100 font-serif transition-colors cursor-pointer ${className}`}
          {...props}
        >
          <option value="" disabled>Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt} className="bg-stone-50 dark:bg-stone-900">{opt}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
};

// Card
export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-stone-300 dark:hover:border-stone-600' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// Badge
export const Badge: React.FC<{ children: React.ReactNode, active?: boolean, onClick?: () => void }> = ({ children, active, onClick }) => {
  return (
    <span 
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 text-xs font-serif font-medium border cursor-pointer transition-colors ${
        active 
          ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100' 
          : 'bg-transparent text-stone-500 border-stone-300 hover:border-stone-900 dark:text-stone-400 dark:border-stone-700 dark:hover:border-stone-100'
      }`}
    >
      {children}
    </span>
  );
};

// Tabs
interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex space-x-1 border-b border-stone-200 dark:border-stone-800 mb-6">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 py-2 font-serif text-sm transition-colors relative top-[1px] ${
            activeTab === tab
              ? 'text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100 font-bold'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};