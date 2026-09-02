import AboutUs from '@/components/AboutUs';
import Footer from '@/components/Footer';

export const metadata = {
   title: 'About Us - Tiberium Consulting',
   description: 'Learn more about Tiberium Consulting and our approach to business solutions.'
};

export default function AboutPage() {
   return (
      <div className="flex min-h-screen flex-col">
         <main className="page-main">
            <AboutUs />
         </main>
         <Footer />
      </div>
   );
}