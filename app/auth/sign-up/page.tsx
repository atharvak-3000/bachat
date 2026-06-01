import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#0D1021] dark:to-[#0F1117] transition-colors duration-250">
      <a
        href="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 font-semibold transition"
      >
        ← Home
      </a>
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
