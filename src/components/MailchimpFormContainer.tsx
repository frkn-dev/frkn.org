import MailchimpSubscribe, { EmailFormFields } from 'react-mailchimp-subscribe';
import MailchimpForm from './MailchimpForm';

const MailchimpFormContainer = () => {
  const postUrl = `https://fuckrkn1.us11.list-manage.com/subscribe/post?u=${
    import.meta.env.VITE_MAILCHIMP_U
  };id=${import.meta.env.VITE_MAILCHIMP_ID}`;

  return (
    <MailchimpSubscribe
      url={postUrl}
      render={({ subscribe, status, message }) => (
        <MailchimpForm
          status={status}
          message={message}
          onValidated={(formData: EmailFormFields) => subscribe(formData)}
        />
      )}
    />
  );
};

export default MailchimpFormContainer;
