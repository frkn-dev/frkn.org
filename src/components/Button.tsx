import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  text: string;
  url: string;
  role?: string;
}

const Button = ({ text, url, role = '' }: ButtonProps) => {
  return (
    <Link
      to={url}
      className={`flex-auto lg:flex-initial text-center min-w-fit py-4 lg:px-8 px-6 rounded-lg lg:text-xl lg:leading-tight transition-all duration-200 ${
        role === 'primary'
          ? 'bg-zinc-800 text-zinc-50 hover:bg-red-900'
          : 'bg-zinc-100 hover:bg-zinc-200'
      }`}
    >
      {text}
    </Link>
  );
};

export default Button;
