import { useState } from 'react';
import { Bot, User as UserIcon, LayoutGrid, Table, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import RecordCard from './RecordCard';
import RecordTable from './RecordTable';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const [viewMode, setViewMode] = useState('cards');

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const records = message.records || [];
  const totalPages = Math.ceil(records.length / itemsPerPage);

  // Slice records for current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedRecords = records.slice(startIndex, startIndex + itemsPerPage);

  // Function to convert records array to a CSV file and download it
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = ['Application ID', 'Account Name', 'Account No', 'Mobile Number', 'Application Date'];
    
    const csvRows = records.map((r) => [
      `"${r.application_id}"`,
      `"${r.account_name.replace(/"/g, '""')}"`,
      `"${r.account_no}"`,
      `"${r.mobile_number}"`,
      `"${r.application_date}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_search_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm ${
          isUser ? 'bg-indigo-600' : 'bg-slate-800'
        }`}
      >
        {isUser ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Content Container */}
      <div className="max-w-[90%] sm:max-w-[80%] space-y-3">
        {/* Text Bubble */}
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
          }`}
        >
          {message.text}
        </div>

        {/* Records Display Section */}
        {!isUser && records.length > 0 && (
          <div className="space-y-3 mt-2">
            {/* Header & Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Matching Customer Records ({records.length}):
              </p>

              <div className="flex items-center gap-2">
                {/* Export CSV Button */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-all shadow-2xs"
                  title="Download as CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {/* View Switcher Toggle */}
                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                      viewMode === 'cards'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>

                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                      viewMode === 'table'
                        ? 'bg-white text-indigo-600 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Render Cards or Table (Page Sliced) */}
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedRecords.map((record, idx) => (
                  <RecordCard key={idx} record={record} />
                ))}
              </div>
            ) : (
              <RecordTable records={displayedRecords} />
            )}

            {/* Pagination Controls Bar (Only shows if total pages > 1) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 px-1 text-xs">
                <span className="text-slate-500 font-medium">
                  Showing <strong className="text-slate-700">{startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-700">
                    {Math.min(startIndex + itemsPerPage, records.length)}
                  </strong>{' '}
                  of <strong className="text-slate-700">{records.length}</strong> results
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-2 font-medium text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}