import Cards from '@/components/Cards';
import Header from '@/components/Header';

export const metadata = {
   title: 'Services - Tiberium Consulting',
   description: 'Explore our comprehensive range of consulting, training, and digital services.'
};

export default function ServicesPage() {
   return (
      <>
         <div className="relative min-h-screen">
            <div
               className="background-fixe"
               style={{ backgroundImage: `url('/images/background.jpg')`, opacity: 0.1 }}
            ></div>
            <Header />
            <Cards />
         </div>
         <footer className="services-footer services-footer-mt">
            <ul>
               <li>Tiberium Consulting</li>
               <li>Copyrights © Tiberium Consulting 2024</li>
            </ul>
         </footer>
      </>
   );
}
