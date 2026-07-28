'use client'

import { useId } from 'react'
import Select, { StylesConfig } from 'react-select'

interface OptionType {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: OptionType[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  isSearchable = true,
  className = ''
}: CustomSelectProps) {
  const id = useId();
  const selectedOption = options.find(opt => opt.value === value) || null;

  const customStyles: StylesConfig<OptionType, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'var(--card)',
      borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-color)',
      borderRadius: '0.75rem', // rounded-xl
      boxShadow: state.isFocused ? '0 0 0 1px var(--primary)' : 'none',
      minHeight: '42px',
      fontSize: '0.825rem',
      fontWeight: 600,
      color: 'var(--text-primary)',
      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer',
      '&:hover': {
        borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-color)'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 12px',
      paddingLeft: className.includes('pl-10') ? '36px' : '12px'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-primary)',
      fontWeight: 750
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-secondary)',
      fontWeight: 500
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'var(--text-secondary)',
      '&:hover': {
        color: 'var(--text-primary)'
      }
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--card)',
      borderRadius: '0.75rem',
      border: '1px solid var(--border-color)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      zIndex: 50,
      animation: 'dropdownReveal 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      transformOrigin: 'top'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'var(--primary)' 
        : state.isFocused 
          ? 'var(--border-color)' 
          : 'var(--card)',
      color: state.isSelected 
        ? 'var(--background)' 
        : 'var(--text-primary)',
      fontSize: '0.825rem',
      fontWeight: state.isSelected ? 700 : 500,
      padding: '10px 14px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--primary)',
        color: 'var(--background)'
      }
    })
  };

  return (
    <div className={`w-full ${className}`}>
      <Select
        instanceId={id}
        options={options}
        value={selectedOption}
        onChange={(newValue) => onChange(newValue ? newValue.value : '')}
        placeholder={placeholder}
        isSearchable={isSearchable}
        styles={customStyles}
      />
    </div>
  );
}
