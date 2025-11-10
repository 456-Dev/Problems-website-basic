export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12 border-2 border-white bg-black p-6">
      <div className="relative w-16 h-16 border-2 border-vintage-yellow">
        <div className="absolute inset-1 border-2 border-vintage-green animate-spin" style={{ animationDuration: '1s' }}></div>
      </div>
      <p className="mt-4 text-white text-base">Loading videos...</p>
    </div>
  );
}

