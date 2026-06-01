export function LoadingSpinner({ message = 'Loading your data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative w-14 h-14">
        <div
          className="absolute inset-0 rounded-full border-4 border-[#7CAE8E]/20"
        />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#7CAE8E] animate-spin"
        />
        <div className="absolute inset-0 flex items-center justify-center text-xl">
          🌿
        </div>
      </div>
      <p style={{ color: '#7CAE8E', fontFamily: 'Nunito, sans-serif' }} className="text-sm">
        {message}
      </p>
    </div>
  );
}
