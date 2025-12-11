import { type FC, type SVGProps } from 'react';

interface SearchIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const SearchIcon: FC<SearchIconProps> = ({ className = '', ...props }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Outer circle - the lens */}
      <circle cx="10" cy="10" r="7" />

      {/* Inner circle - for lens detail/reflection */}
      <circle cx="10" cy="10" r="5" strokeWidth="1" opacity="0.5" />

      {/* Handle */}
      <line x1="16" y1="16" x2="21" y2="21" strokeWidth="2.5" />
    </svg>
  );
};

export default SearchIcon;