import React from "react";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export function Table({ children, className = "", wrapperClassName = "", ...props }: TableProps) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111114] ${wrapperClassName}`}
    >
      <table className={`w-full text-left text-[13px] border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-zinc-50/80 dark:bg-zinc-900/70 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200/80 dark:border-zinc-800 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-zinc-100 dark:divide-zinc-800/80 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = "",
  isHoverable = true,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { isHoverable?: boolean }) {
  return (
    <tr
      className={`transition-colors ${
        isHoverable ? "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({ children, className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-tight whitespace-nowrap ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`py-2.5 px-4 text-zinc-800 dark:text-zinc-200 align-middle tabular-nums ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
