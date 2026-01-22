const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-t border-purple-500 mt-auto shadow-[0_-8px_32px_rgba(139,92,246,0.4)]" style={{ transform: 'perspective(2000px) rotateX(-1deg)', transformStyle: 'preserve-3d' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0">
          <div className="text-center">
            <p className="text-white text-sm font-medium drop-shadow-lg">Created By IT Team</p>
            <p className="text-sky-100 text-xs drop-shadow-md">&copy; {new Date().getFullYear()} MNR Group. All rights reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
