import { User, CreditCard, Phone, Calendar, Hash } from 'lucide-react';



export default function RecordCard({ record }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 p-4 transition-all duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800 text-sm">
            {record.account_name}
          </span>
        </div>
        <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Hash className="w-3 h-3" />
          ID: {record.application_id}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Acc: <strong className="text-slate-700">{record.account_no}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Mob: <strong className="text-slate-700">{record.mobile_number}</strong></span>
        </div>

        <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Date: <strong className="text-slate-700">{record.application_date}</strong></span>
        </div>
      </div>
    </div>
  );
}