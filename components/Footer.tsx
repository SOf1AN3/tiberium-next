import Link from 'next/link';

const Footer = () => {
   const year = new Date().getFullYear();

   return (
      <footer className="footer">
         <div className="footer-inner">
            <div className="footer-brand">
               <span className="header-logo">
                  <span className="header-logo-mark" aria-hidden="true"></span>
                  <span style={{ fontWeight: 800 }}>Tiberium</span>
               </span>
               <p>Consulting & digital solutions : conseil, étude de marché, formation et transformation digitale.</p>
            </div>
            <div className="footer-col">
               <h4>Navigation</h4>
               <Link href="/">Accueil</Link>
               <Link href="/expats">Expats</Link>
               <Link href="/about">À propos</Link>
            </div>
            <div className="footer-col">
               <h4>Contact</h4>
               <a href="mailto:contact@tiberium.com">contact@tiberium.com</a>
               <a href="https://wa.me/213666000000" target="_blank" rel="noopener noreferrer">
                  +213 666 00 00 00
               </a>
            </div>
         </div>
         <div className="footer-bottom">
            <span>Copyrights © Tiberium Consulting {year}</span>
            <span className="myks">Developed By Myks Studios</span>
         </div>
      </footer>
   );
};

export default Footer;