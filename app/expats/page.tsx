import ExpatsServices from '@/components/ExpatsServices';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
   title: 'Expats Services - Tiberium Consulting',
   description: 'Specialized services for expatriates, including relocation support and local integration assistance.'
};

export default function ExpatPage() {
   return (
      <div className="relative min-h-screen">
         <div
            className="background-fixe"
            style={{ backgroundImage: `url('/images/background.jpg')`, opacity: 0.2 }}
         ></div>
         <div className="relative z-10">
            <Header />
            <ExpatsServices />
         </div>
         <Footer />
      </div>
   );
}
