import ContactForm from '@/components/ContactForm';
import Header from '@/components/Header';

export const metadata = {
   title: 'Contact Us - Tiberium Consulting',
   description: 'Get in touch with Tiberium Consulting. Send us a message and we will respond promptly.'
};

export default function ContactPage() {
   return (
      <div style={{ position: 'relative', overflow: 'hidden', height: '100vh' }}>
         <div
            className="background-fixe"
            style={{
               backgroundImage: `url('/images/background.jpg')`,
               position: 'absolute',
               top: '50%',
               left: '50%',
               width: '100%',
               height: '100%',
               objectFit: 'cover',
               transform: 'translate(-50%, -50%)',
               zIndex: '-1',
               opacity: '0.1'
            }}
         ></div>
         <Header />
         <ContactForm />
      </div>
   );
}
