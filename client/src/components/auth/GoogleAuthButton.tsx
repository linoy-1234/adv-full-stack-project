import { GoogleLogin } from "@react-oauth/google";

interface GoogleAuthButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function GoogleAuthButton({
  onCredential,
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 rounded-xl text-sm border text-[#6B7280] bg-[#F9FAFB]"
      >
        Google sign-in is not configured
      </button>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <GoogleLogin
        onSuccess={(response) => {
          if (!response.credential) {
            onError("Google did not return a credential. Please try again.");
            return;
          }

          onCredential(response.credential);
        }}
        onError={() => {
          onError("Google sign-in failed. Please try again.");
        }}
        text="continue_with"
        shape="rectangular"
        size="large"
        width="100%"
      />
    </div>
  );
}
