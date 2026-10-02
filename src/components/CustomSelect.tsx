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
  isDisabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  isSearchable = true,
  className = '',
  isDisabled = false
}: CustomSelectProps) {
  const id = useId();
  const selectedOption = options.find(opt => opt.value === value) || null;

  const customStyles: StylesConfig<OptionType, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: state.isDisabled ? 'rgba(0, 0, 0, 0.03)' : 'var(--input-bg)',
      borderColor: state.isFocused ? 'var(--accent)' : 'var(--border-color)',
      borderRadius: '0.75rem', // rounded-xl
      boxShadow: state.isFocused ? '0 0 0 3px rgba(77, 162, 60, 0.18)' : 'none',
      minHeight: '42px',
      fontSize: '0.825rem',
      fontWeight: 600,
      color: state.isDisabled ? 'var(--text-secondary)' : 'var(--text-primary)',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.6 : 1,
      '&:hover': {
        borderColor: state.isFocused ? 'var(--accent)' : 'rgba(77, 162, 60, 0.45)'
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
        color: 'var(--accent)'
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
      boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      zIndex: 50,
      animation: 'dropdownReveal 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      transformOrigin: 'top'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'var(--accent)' 
        : state.isFocused 
          ? 'rgba(77, 162, 60, 0.12)' 
          : 'var(--card)',
      color: state.isSelected 
        ? '#FFFFFF' 
        : 'var(--text-primary)',
      fontSize: '0.825rem',
      fontWeight: state.isSelected ? 700 : 500,
      padding: '10px 14px',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--accent)',
        color: '#FFFFFF'
      }
    })
  };

  return (
    <div className={`w-full ${className}`} data-lenis-prevent>
      <Select
        instanceId={id}
        options={options}
        value={selectedOption}
        onChange={(newValue) => onChange(newValue ? newValue.value : '')}
        placeholder={placeholder}
        isSearchable={isSearchable}
        styles={customStyles}
        isDisabled={isDisabled}
      />
    </div>
  );
}
