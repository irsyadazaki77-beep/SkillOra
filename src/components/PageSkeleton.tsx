import { Loader2 } from "lucide-react";

export function PageSkeleton() {
  return (
    <div className="p-6 md:p-8 w-full max-w-6xl mx-auto flex flex-col gap-6 animate-pulse">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4"></div>
        </div>
      </div>
      <div className="h-[200px] bg-slate-200 dark:bg-slate-800 rounded-3xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        <div className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
      <div className="flex justify-center mt-8">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin opacity-50" />
      </div>
    </div>
  );
}

