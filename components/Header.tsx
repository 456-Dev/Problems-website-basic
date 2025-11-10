"use client";

export default function Header() {
  return (
    <header className="border-b-4 border-white bg-black">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left side - Title (left-aligned, centered with NYC Map button) */}
        <div className="flex flex-col text-left">
          <span className="text-3xl font-bold text-white leading-none">
            Question
          </span>
          <span className="text-3xl font-bold text-white leading-none">
            The
          </span>
          <span className="text-3xl font-bold text-white leading-none">
            Day
          </span>
        </div>
        
        {/* Center - Logo */}
        <div className="flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="Question The Day Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Right side - Stacked buttons (red on top, green on bottom) */}
        <nav className="flex flex-col gap-1">
          <a
            href="https://youtube.com/@bignosemichael"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black bg-vintage-red hover:bg-white hover:text-vintage-red font-bold border-2 border-white px-4 py-1 text-center text-sm transition-colors"
          >
            Subscribe
          </a>
          <a
            href="/index.html"
            className="text-black bg-vintage-yellow hover:bg-white font-bold border-2 border-white px-4 py-1 text-center text-sm transition-colors"
          >
            NYC Map
          </a>
          <a
            href="#videos"
            className="text-black bg-vintage-green hover:bg-white font-bold border-2 border-white px-4 py-1 text-center text-sm transition-colors"
          >
            Episodes
          </a>
        </nav>
      </div>
    </header>
  );
}

