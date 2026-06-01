import * as React from "react"

export type DataTableProps<T> = {
  columns: { key: string; header: React.ReactNode; render: (row: T) => React.ReactNode }[]
  data: T[]
  emptyMessage: string
}

export default function DataTable<T>({
  columns,
  data,
  emptyMessage,
}: DataTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-xl border bg-white px-4 py-10 text-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="border-b border-gray-200 p-3 text-left text-sm font-medium text-gray-700"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
            >
              {columns.map((c) => (
                <td key={c.key} className="p-3 text-sm text-gray-800">
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
