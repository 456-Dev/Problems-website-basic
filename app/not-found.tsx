import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center animate-fade-in border-2 border-vintage-red p-8 bg-black">
        <h1 className="text-6xl font-bold text-vintage-yellow-styled mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mb-4">Page not found</h2>
        <p className="text-white mb-6 max-w-md">
          This page doesn't exist.<br/>
          Check out our episodes instead!
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-vintage-green text-black font-bold border-2 border-white hover:bg-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}


