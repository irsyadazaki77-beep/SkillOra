import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export function Table({ children, className = "", wrapperClassName = "", ...props }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 ${wrapperClassName}`}>
      <table className={`w-full text-left text-xs sm:text-sm border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-slate-100 dark:divide-slate-800 ${className}`} {...props}>{children}</tbody>;
}

export function TableRow({ children, className = "", isHoverable = true, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { isHoverable?: boolean }) {
  return (
    <tr className={`transition-colors ${isHoverable ? "hover:bg-slate-50/50 dark:hover:bg-slate-800/40" : ""} ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`py-3 px-3.5 sm:px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`py-3 px-3.5 sm:px-4 text-slate-700 dark:text-slate-300 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}
