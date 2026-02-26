"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import ShowTerms from "@/components/showTerms";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return defaultMessage;
};

const LoadingSpinner = () => (
  <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
);

function LoginForm() {
  const [showTerms, setShowTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const validateInput = (): boolean => {
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms & Conditions to continue.");
      return false;
    }

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateInput()) {
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Login successful!");
        router.push("/dashboard");
      }
    } catch (err) {
      const errorMessage = handleApiError(err, "Something went wrong during authentication.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const inactive = searchParams?.get("inactive");
    if (inactive === "1") {
      toast.error(
        `Your account is inactive. To activate it, contact us at info@accufin@gmail.com.`
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (session) {
      if (session.user?.name) {
        toast.success(`Welcome back, ${session.user.name}!`);
      }
      router.push("/dashboard");
    }
  }, [session, router]);

  const toggleTerms = () => {
    setShowTerms(!showTerms);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50 md:pt-[120px] pt-[150px]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-2">
          <img
            src="/image-000.png"
            alt="Accufin Logo"
            className="h-24 w-auto"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg ring-1 ring-gray-100 sm:rounded-xl sm:px-10">
          <form className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 focus:outline-none"
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <EyeClosedIcon className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>


            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="agree-terms"
                  className="block text-sm text-gray-900"
                >
                  I agree to the
                </label>
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className={`${agreedToTerms ? "text-[#007399]" : "text-red-600"} hover:underline focus:outline-none text-sm`}
                >
                  Terms & Conditions
                </button>
              </div>
            </div>

            <div className="mt-4">
              {!agreedToTerms ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="block">
                        <button
                          type="button"
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#007399] hover:bg-[#0082a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={true}
                          aria-disabled="true"
                        >
                          Sign in
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Please agree to Terms & Conditions first.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <LoadingSpinner />
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#007399] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
              >
                Create new account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showTerms && <ShowTerms toggleTerms={toggleTerms} />}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center items-center space-x-2">
              <img
                src="/image-000.png"
                alt="Accufin Logo"
                className="h-24 w-auto"
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007399]"></div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
