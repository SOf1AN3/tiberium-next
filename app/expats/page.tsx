import ExpatsServices from '@/components/ExpatsServices';
import Footer from '@/components/Footer';

export const metadata = {
   title: 'Expats Services - Tiberium Consulting',
   description: 'Specialized services for expatriates, including relocation support and local integration assistance.'
};

export default function ExpatPage() {
   return (
      <div className="flex min-h-screen flex-col">
         <main className="page-main">
            <ExpatsServices />
         </main>
         <Footer />
      </div>
   );
}