import { User, CreditCard, Phone, Calendar, Hash } from 'lucide-react';

export default function RecordTable({ records }) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm mt-2">
      <table className="w-full text-left text-xs text-slate-600 border-collapse">
        {/* Table Header */}
        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                App ID
              </span>
            </th>
            <th className="py-3 px-4">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Account Name
              </span>
            </th>
            <th className="py-3 px-4">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Account No
              </span>
            </th>
            <th className="py-3 px-4">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Mobile Number
              </span>
            </th>
            <th className="py-3 px-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                App Date
              </span>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100">
          {records.map((record, idx) => (
            <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
              <td className="py-2.5 px-4 font-mono font-medium text-indigo-600">
                {record.application_id}
              </td>
              <td className="py-2.5 px-4 font-semibold text-slate-800">
                {record.account_name}
              </td>
              <td className="py-2.5 px-4 font-mono text-slate-700">
                {record.account_no}
              </td>
              <td className="py-2.5 px-4 text-slate-700">
                {record.mobile_number}
              </td>
              <td className="py-2.5 px-4 text-slate-600">
                {record.application_date}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}