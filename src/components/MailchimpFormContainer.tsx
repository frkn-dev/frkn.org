import MailchimpSubscribe from 'react-mailchimp-subscribe';
import MailchimpForm from './MailchimpForm';
import { content } from '../content/modal';

interface ModalProps {
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lang: string;
}

const MailchimpFormContainer = ({ setModalOpen, lang }: ModalProps) => {
  const postUrl = `https://fuckrkn1.us11.list-manage.com/subscribe/post?u=${
    import.meta.env.VITE_MAILCHIMP_U
  };id=${import.meta.env.VITE_MAILCHIMP_ID}`;

  return (
    <div className="absolute flex flex-col items-center justify-center bg-white h-screen md:h-fit md:top-1/2 md:-translate-y-1/2 w-full md:max-w-xl lg:left-1/2 lg:-translate-x-1/2 shadow-lg pt-12 pb-6 md:rounded-3xl">
      <MailchimpSubscribe
        url={postUrl}
        render={({ subscribe, status, message }) => (
          <MailchimpForm
            status={status}
            message={message}
            onValidated={(formData: any) => subscribe(formData)}
          />
        )}
      />
      <button
        className="mt-auto py-6 w-full hover:underline underline-offset-4"
        onClick={() => setModalOpen(false)}
      >
        {content.close[lang]}
      </button>
    </div>
  );
};

export default MailchimpFormContainer;
