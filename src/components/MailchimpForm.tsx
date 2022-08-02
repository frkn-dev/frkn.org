import React, { useContext, useEffect, useState } from 'react';
import { DataContext } from '../App';
import { content } from '../content/modal';

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
    <form onSubmit={handleSubmit} className="flex flex-col mt-auto mb-12 p-4">
      <h3 className="text-2xl mb-12 font-semibold">{content.header[lang]}</h3>
      <label className="mb-2">Email</label>
      <input
        type="email"
        onChange={handleInputChange}
        value={email}
        required
        className="p-4 focus-visible:outline-zinc-900 mb-4 rounded-lg border border-zinc-200"
      />
      {status === 'sending' && (
        <p className="text-teal-zinc-600">Subscribing...</p>
      )}
      {status === 'error' && (
        <p className="text-red-600">{message as string}</p>
      )}
      {status === 'success' && (
        <p className="text-teal-600">{message as string}</p>
      )}
      <input
        type="submit"
        value={content.subscribe[lang]}
        disabled={
          status === 'success' || email === '' || email.indexOf('@') === -1
        }
        className="flex-auto lg:flex-initial text-center min-w-fit py-4 lg:px-8 px-6 rounded-lg lg:text-xl lg:leading-tight transition-all duration-200 bg-zinc-800 text-zinc-50 hover:bg-red-900 mt-4 disabled:bg-zinc-400"
      />
    </form>
  );
};

export default MailchimpForm;
