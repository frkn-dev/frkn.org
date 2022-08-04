import React, { useContext, useEffect, useState } from 'react';
import { DataContext } from '../App';
import { content } from '../content/subscribe';

interface FormProps {
  status: 'sending' | 'error' | 'success' | null;
  message: string | Error | null;
  onValidated: (formData: any) => void;
}

const MailchimpForm = ({ status, message, onValidated }: FormProps) => {
  const [email, setEmail] = useState('');
  const appContext = useContext(DataContext);
  if (!appContext) return null;
  const { lang, setLang } = appContext;

  useEffect(() => {
    if (status === 'success') setEmail('');
  }, [status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    email &&
      email.indexOf('@') > -1 &&
      onValidated({
        'mce-EMAIL': email,
      });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col md:flex-row md:items-stretch"
    >
      <div className="flex-1 flex-col">
        <input
          type="email"
          placeholder="Email"
          onChange={handleInputChange}
          value={email}
          required
          className="w-full p-4 focus-visible:outline-zinc-900 rounded-lg border border-zinc-200"
        />
        {status === 'sending' && (
          <p className="text-left text-teal-zinc-600 mt-2">Subscribing...</p>
        )}
        {status === 'error' && (
          <p className="text-left text-red-600 mt-2">{message as string}</p>
        )}
        {status === 'success' && (
          <p className="text-left text-teal-600 mt-2">{message as string}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={
          status === 'success' || email === '' || email.indexOf('@') === -1
        }
        className="flex flex-col h-14 px-4 items-center md:items-start justify-center text-zinc-500 hover:underline underline-offset-4 cursor-pointer"
      >
        {content.button[lang]}
        <span className="text-sm text-zinc-900">{content.subtext[lang]}</span>
      </button>
    </form>
  );
};

export default MailchimpForm;
