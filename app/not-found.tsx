import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
   title: '404 - Page Not Found | Tiberium',
   description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
   return (
      <div className="flex min-h-screen flex-col">
         <main className="page-main">
            <div className="not-found-page">
               <div className="not-found-content">
                  <span className="not-found-code">404</span>
                  <h1>Page not found</h1>
                  <p>
                     The page you are looking for does not exist or has been
                     moved.
                  </p>
                  <Link href="/" className="btn btn-primary">
                     Back to home
                  </Link>
               </div>
            </div>
         </main>
         <Footer />
      </div>
   );
}
