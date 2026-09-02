import AboutUs from '@/components/AboutUs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
   title: 'About Us - Tiberium Consulting',
   description: 'Learn more about Tiberium Consulting and our approach to business solutions.'
};

export default function AboutPage() {
   return (
      <div className="relative min-h-screen">
         <div
            className="background-fixe"
            style={{ backgroundImage: `url('/images/background.jpg')`, opacity: 0.1 }}
         ></div>
         <div className="relative z-10">
            <Header />
            <AboutUs />
            <Footer />
         </div>
      </div>
   );
}
