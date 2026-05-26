import React from "react";
import { Link } from "react-router-dom";
import { DataContext } from "../context/AppContext";
import categorize from "../components/utils/categorize";
import { parse } from "date-fns";
const categoryIcons = {
  FOOD: "🍔",
  TRANSPORT: "✈️",
  SHOPPING: "🛒",
  INCOME: "💰",
  BILLS: "📄",
  HEALTH: "🏥",
  OTHER: "📌",
};
export default function Transaction() {
  const { transactions, currency } = React.useContext(DataContext);
  
  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [datePreset, setDatePreset] = React.useState("all");
  const [selectedCategories, setSelectedCategories] = React.useState([]);
  const [sortBy, setSortBy] = React.useState("date-desc");
  const [minAmount, setMinAmount] = React.useState("");
  const [maxAmount, setMaxAmount] = React.useState("");
  const [voiceSupported, setVoiceSupported] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceMessage, setVoiceMessage] = React.useState("");

  React.useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  // Get unique categories
  const allCategories = React.useMemo(() => {
    const cats = new Set();
    transactions?.forEach(t => cats.add(categorize(t.Description)));
    return Array.from(cats).sort();
  }, [transactions]);

  // Get date range based on preset
  const getDateRange = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(preset) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 86400000) };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 86400000);
        return { start: yesterday, end: today };
      case "this-week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: new Date() };
      case "last-week":
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 7);
        return { start: lastWeekStart, end: lastWeekEnd };
      case "this-month":
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date() };
      case "last-month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: lastMonth, end: lastMonthEnd };
      case "last-3-months":
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start: threeMonthsAgo, end: new Date() };
      case "this-year":
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date() };
      default:
        return null;
    }
  };

  // Filter and sort transactions
  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.Description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date preset filter
    if (datePreset !== "all") {
      const dateRange = getDateRange(datePreset);
      if (dateRange) {
        filtered = filtered.filter(t => {
          try {
            const transactionDate = parse(t.Date, "dd/MM/yyyy", new Date());
            return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
          } catch (e) {
            return true;
          }
        });
      }
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => 
        selectedCategories.includes(categorize(t.Description))
      );
    }

    // Amount range filter
    if (minAmount !== "" || maxAmount !== "") {
      filtered = filtered.filter(t => {
        const amount = Math.abs(Number(t.Amount));
        const min = minAmount !== "" ? Number(minAmount) : -Infinity;
        const max = maxAmount !== "" ? Number(maxAmount) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return parse(a.Date, "dd/MM/yyyy", new Date()) - parse(b.Date, "dd/MM/yyyy", new Date());
        case "date-desc":
          return parse(b.Date, "dd/MM/yyyy", new Date()) - parse(a.Date, "dd/MM/yyyy", new Date());
        case "amount-asc":
          return Number(a.Amount) - Number(b.Amount);
        case "amount-desc":
          return Number(b.Amount) - Number(a.Amount);
        case "category":
          return categorize(a.Description).localeCompare(categorize(b.Description));
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, datePreset, selectedCategories, sortBy, minAmount, maxAmount]);

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDatePreset("all");
    setSelectedCategories([]);
    setSortBy("date-desc");
    setMinAmount("");
    setMaxAmount("");
  };

  const parseVoiceNumber = (text) => {
    const match = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?)/);
    return match ? Number(match[1].replace(/,/g, "")) : null;
  };

  const parseVoiceTransactionCommand = (transcript) => {
    const cleanedTranscript = transcript
      .toLowerCase()
      .trim()
      .replace(/[.?!]+$/g, "")
      .replace(/\s+/g, " ");

    const normalized = cleanedTranscript;

    // Check sort commands FIRST (before date checks)
    if (/sort.*(amount|price)|amount.*sort|high to low|low to high|highest|lowest/.test(normalized)) {
      if (/low|ascending|asc|least|smallest|minimum/.test(normalized)) {
        return { action: "setSortBy", payload: "amount-asc" };
      }
      return { action: "setSortBy", payload: "amount-desc" };
    }

    if (/sort.*(date|recent|newest|oldest)|date.*sort|recent first|newest first|oldest first/.test(normalized)) {
      if (/oldest|ascending|asc/.test(normalized)) {
        return { action: "setSortBy", payload: "date-asc" };
      }
      return { action: "setSortBy", payload: "date-desc" };
    }

    if (/sort.*(category|alphabetical)|category.*sort|alphabetical|a to z|z to a/.test(normalized)) {
      return { action: "setSortBy", payload: "category" };
    }

    // Now check for time period / date preset commands
    const dateMap = {
      "today": "today",
      "yesterday": "yesterday",
      "this week": "this-week",
      "last week": "last-week",
      "this month": "this-month",
      "last month": "last-month",
      "last 3 months": "last-3-months",
      "last three months": "last-3-months",
      "three months": "last-3-months",
      "this year": "this-year",
      "all time": "all",
      "all": "all",
    };

    for (const phrase in dateMap) {
      if (normalized.includes(phrase)) {
        return { action: "setDatePreset", payload: dateMap[phrase] };
      }
    }

    if (/clear filters|reset filters|show all|remove filters|clear search/.test(normalized)) {
      return { action: "clearFilters" };
    }

    if (/export|download|csv/.test(normalized)) {
      return { action: "export" };
    }

    const categoryMatch = allCategories.find((category) => normalized.includes(category.toLowerCase()));
    if (categoryMatch && /show|filter|category|transactions|spend|spent|expenses|income|shopping|food|transport|bills|health/.test(normalized)) {
      return { action: "setCategory", payload: categoryMatch };
    }

    const searchMatch = normalized.match(/(?:search for|find|show|filter by|look for)\s+(.+)/);
    if (searchMatch) {
      const value = searchMatch[1].trim();
      if (value) {
        return { action: "setSearchTerm", payload: value };
      }
    }

    if (/min|minimum|at least|amount over|greater than/.test(normalized)) {
      const value = parseVoiceNumber(normalized);
      if (value !== null) {
        return { action: "setMinAmount", payload: value };
      }
    }

    if (/max|maximum|at most|less than|below/.test(normalized)) {
      const value = parseVoiceNumber(normalized);
      if (value !== null) {
        return { action: "setMaxAmount", payload: value };
      }
    }

    return { action: "setSearchTerm", payload: normalized };
  };

  const handleTransactionVoiceTranscript = (transcript) => {
    const command = parseVoiceTransactionCommand(transcript);

    switch (command.action) {
      case "setDatePreset":
        setDatePreset(command.payload);
        setVoiceMessage(`Date filter set to ${command.payload.replace(/-/g, " ")}`);
        break;
      case "clearFilters":
        clearFilters();
        setVoiceMessage("Filters cleared");
        break;
      case "export":
        exportToCSV();
        setVoiceMessage("Exporting CSV");
        break;
      case "setSortBy":
        setSortBy(command.payload);
        setVoiceMessage(`Sorting by ${command.payload.replace(/-/g, " ")}`);
        break;
      case "setCategory":
        setSelectedCategories([command.payload]);
        setSearchTerm("");
        setVoiceMessage(`Filtering by ${command.payload}`);
        break;
      case "setSearchTerm":
        setSearchTerm(command.payload);
        setVoiceMessage(`Searching for ${command.payload}`);
        break;
      case "setMinAmount":
        setMinAmount(command.payload);
        setVoiceMessage(`Minimum amount set to ${command.payload}`);
        break;
      case "setMaxAmount":
        setMaxAmount(command.payload);
        setVoiceMessage(`Maximum amount set to ${command.payload}`);
        break;
      default:
        setVoiceMessage("Try: 'today', 'this month', 'sort by amount', 'show food', 'clear filters'");
    }
  };

  React.useEffect(() => {
    const handleExternalVoice = (event) => {
      if (event?.detail?.transcript) {
        handleTransactionVoiceTranscript(event.detail.transcript);
      }
    };

    window.addEventListener("transaction-voice-command", handleExternalVoice);
    return () => {
      window.removeEventListener("transaction-voice-command", handleExternalVoice);
    };
  }, [allCategories]);

  const startVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceMessage("Voice not supported");
      return;
    }

    let recognition;
    try {
      recognition = new SpeechRecognition();
    } catch {
      setVoiceMessage("Voice not supported");
      return;
    }

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setVoiceMessage("Listening for transaction commands...");

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const command = parseVoiceTransactionCommand(transcript);

      switch (command.action) {
        case "setDatePreset":
          setDatePreset(command.payload);
          setVoiceMessage(`Date filter set to ${command.payload.replace(/-/g, " ")}`);
          break;
        case "clearFilters":
          clearFilters();
          setVoiceMessage("Filters cleared");
          break;
        case "export":
          exportToCSV();
          setVoiceMessage("Exporting CSV");
          break;
        case "setSortBy":
          setSortBy(command.payload);
          setVoiceMessage(`Sorting by ${command.payload.replace(/-/g, " ")}`);
          break;
        case "setCategory":
          setSelectedCategories([command.payload]);
          setSearchTerm("");
          setVoiceMessage(`Filtering by ${command.payload}`);
          break;
        case "setSearchTerm":
          setSearchTerm(command.payload);
          setVoiceMessage(`Searching for ${command.payload}`);
          break;
        case "setMinAmount":
          setMinAmount(command.payload);
          setVoiceMessage(`Minimum amount set to ${command.payload}`);
          break;
        case "setMaxAmount":
          setMaxAmount(command.payload);
          setVoiceMessage(`Maximum amount set to ${command.payload}`);
          break;
        default:
          setVoiceMessage("Say search for groceries, show food, today, or clear filters");
      }
    };

    recognition.onerror = (event) => {
      setVoiceMessage(event?.error ? `Voice error: ${event.error}` : "Try again");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const exportToCSV = () => {
  if (!filteredTransactions.length) return;

  const headers = ["Date", "Description", "Amount", "Category"];

  const rows = filteredTransactions.map((item) => [
    item.Date,
    item.Description,
    item.Amount,
    categorize(item.Description),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "transactions.csv");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return transactions && transactions.length > 0 ? (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filter Panel */}
      <div className="retro-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-[#FF6B00] text-lg font-black uppercase tracking-widest">Filters & Search</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button 
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-[#FF6B00] uppercase tracking-wider font-bold transition-colors"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={startVoiceSearch}
              disabled={!voiceSupported || isListening}
              className="text-xs bg-[#1F1F1F] border border-[#2a2a2a] px-3 py-2 rounded uppercase tracking-widest font-bold text-gray-300 hover:text-white hover:border-[#FF6B00] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isListening ? "LISTENING" : "VOICE SEARCH"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Search Description</label>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="retro-input p-3 w-full"
            />
          </div>

          {/* Date Preset */}
          <div className="lg:col-span-2">
            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Time Period</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="retro-input p-3 w-full"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this-week">This Week</option>
              <option value="last-week">Last Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="this-year">This Year</option>
            </select>
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Min Amount</label>
            <input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="retro-input p-3 w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Max Amount</label>
            <input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="retro-input p-3 w-full"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="retro-input p-3 w-full"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
              <option value="category">Category (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mt-4">
          <label className="block text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">Filter by Category</label>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors ${
                  selectedCategories.includes(category)
                    ? 'bg-[#FF6B00] text-black border-[#FF6B00]'
                    : 'bg-[#1F1F1F] text-gray-300 border-[#2a2a2a] hover:border-[#FF6B00]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-400">
          Showing <span className="text-[#FF6B00] font-bold">{filteredTransactions.length}</span> of <span className="font-bold">{transactions.length}</span> transactions
        </div>
        {voiceMessage && (
          <div className="mt-2 text-sm text-gray-400">
            <span className="font-bold text-[#FF6B00]">Voice:</span> {voiceMessage}
          </div>
        )}
      </div>

      {/* Transactions Table */}
  {/* <div className="flex justify-end mb-4">
  <button
    onClick={exportToCSV}
    className="px-4 py-2 bg-[#FF6B00] text-black font-bold rounded hover:opacity-90 transition"
  >
    Export CSV
  </button>
</div> */}
      <div className="retro-card overflow-x-auto">
          <div className="flex justify-end items-center px-4 pt-4">
  <button
    onClick={exportToCSV}
    className="px-3 py-2 bg-[#FF6B00] text-black text-sm font-bold rounded-md hover:opacity-90 transition"
  >
    Export CSV
  </button>
</div>
        <table className="table w-full border-collapse">
          <thead>
            <tr className="bg-[#111111] text-[#FF6B00] border-b border-[#1F1F1F] uppercase tracking-widest text-sm">
              <th className="py-4 px-6 font-bold">Date</th>
              <th className="py-4 px-6 font-bold">Description</th>
              <th className="py-4 px-6 font-bold text-right">Amount</th>
              <th className="py-4 px-6 font-bold">Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((data, i) => (
              <tr key={i} className="border-b border-[#1F1F1F]/50 hover:bg-[#1a1a1a] transition-colors">
                <td className="py-4 px-6 text-gray-400 whitespace-nowrap">{data.Date}</td>
                <td className="py-4 px-6 font-medium max-w-sm truncate" title={data.Description}>{data.Description}</td>
                <td className={`py-4 px-6 font-black text-right whitespace-nowrap ${Number(data.Amount) > 0 ? 'text-[#00C49F]' : 'text-white'}`}>
                  {Number(data.Amount) > 0 ? '+' : ''}{currency.symbol}{Math.abs(Number(data.Amount)).toLocaleString()}
                </td>
                <td className="py-4 px-6">
                  <span className="bg-[#1F1F1F] text-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm border border-[#2a2a2a]">
                    {categorize(data.Description)}
                  </span>
                
                </td>
                
               <td className="py-4 px-6">
  <span className="bg-[#1F1F1F] text-gray-300 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm border border-[#2a2a2a] flex items-center gap-2 w-fit">
    <span>
      {categoryIcons[categorize(data.Description)] || "📌"}
    </span>
    {categorize(data.Description)}
  </span>
</td>
              </tr>
                  
            ))}
          </tbody>
            
        </table>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
      <div className="retro-card p-12 flex flex-col items-center max-w-md text-center border-[#FF6B00]/30 shadow-[0_0_20px_rgba(255,107,0,0.1)]">
        <div className="w-16 h-16 bg-[#FF6B00]/10 flex items-center justify-center rounded-full mb-6 text-[#FF6B00]">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        </div>
        <h2 className="text-2xl font-black tracking-wider text-white mb-2 uppercase">No Transactions</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">No transactions found. Upload your data to view the history.</p>
        <Link 
          to='/settings' 
          className="retro-btn"
        >
          Configure Settings
        </Link>
      </div>
    </div>
  );
}
