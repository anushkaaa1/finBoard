import { useState, useContext } from "react";
import Papa from "papaparse";
import { DataContext, CURRENCIES } from "../context/AppContext";
import { demoData } from "../data/demoData";
import { format } from "date-fns";
import { useModal } from "../context/ModalContext";

// =========================
// REUSABLE SECTION COMPONENT
// =========================
const Section = ({ title, subtitle, children, right }) => (
  <div className="w-full rounded-[24px] border border-[#222] bg-[#141414] p-6 md:p-8 transition-all duration-300 hover:border-[#FF6B00]/30 hover:shadow-[0_0_20px_rgba(255,107,0,0.05)]">

    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

      <div className="space-y-2">
        <h2 className="text-[28px] font-black uppercase tracking-[0.22em] text-[#FF6B00]">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      {right}
    </div>

    {children}
  </div>
);

// Category options matching the app's category system
const CATEGORIES = [
  "Food",
  "Shopping",
  "Bills",
  "Health",
  "Transport",
  "Entertainment",
  "Education",
  "Travel",
  "Other",
];

export default function Settings() {
  const {
    transactions,
    setTransactions,
    currency,
    updateCurrency,
    addTransaction
  } = useContext(DataContext);

  const { showModal } = useModal();

  const [data, setData] = useState([]);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Loading + Success states
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [manualTransaction, setManualTransaction] = useState({
    Date: format(new Date(), "dd/MM/yyyy"),
    Description: "",
    Amount: "",
    Category: "Other",
  });

  // =========================
  // CSV IMPORT
  // =========================
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        setTimeout(() => {
          setData(results.data);

          localStorage.setItem(
            "transactions",
            JSON.stringify(results.data)
          );

          setTransactions(results.data);

          setLoading(false);

        setTransactions(updatedData);
        localStorage.setItem("transactions", JSON.stringify(updatedData));

        setLoading(false);
        setSuccessMessage("CSV Imported Successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      },

      error: () => {
        setLoading(false);
        showModal({
          type: "alert",
          message: "Failed to parse CSV file.",
        });
      },
    });
  };

  // =========================
  // MANUAL ENTRY
  // =========================
  const handleManualSubmit = (e) => {
    e.preventDefault();

    if (
      !manualTransaction.Date ||
      !manualTransaction.Description ||
      !manualTransaction.Amount
    ) {
      showModal({ type: "alert", message: "Please fill all fields" });
      return;
    }

    const newTransaction = {
      Date: manualTransaction.Date,
      Description: manualTransaction.Description,
      Amount: manualTransaction.Amount,
      category: manualTransaction.category,
      Currency: currency,
    };

    addTransaction(newTransaction);

    setManualTransaction({
      Date: format(new Date(), "dd/MM/yyyy"),
      Description: "",
      Amount: "",
      Category: "Other",
    });

    setSuccessMessage("Transaction Added!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const clearAllData = () => {
    showModal({
      type: "confirm",
      message: "Are you sure you want to clear all data?",
      onConfirm: () => {
        setTransactions([]);
        localStorage.removeItem("transactions");
        setSuccessMessage("All Data Cleared!");
        setTimeout(() => setSuccessMessage(""), 3000);
      },
    });
  };

  return (
    <div className="w-full space-y-6">

      {successMessage && (
        <div className="rounded-2xl border border-[#FF6B00]/30 bg-[#111] px-5 py-4 text-sm font-bold tracking-wide text-[#FF6B00] uppercase">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-2">
          <span className="loading loading-spinner loading-lg text-[#FF6B00]" />
        </div>
      )}

      {/* DATA SOURCE */}
      <div className="retro-card p-8">
        <h2 className="text-[#FF6B00] text-lg font-black uppercase tracking-widest mb-6">
          Data Source
        </h2>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">

          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text text-gray-400 font-bold uppercase tracking-wider text-xs">
                Upload CSV File
              </span>
            </label>

            <input
              type="file"
              accept=".csv"
              className="file-input file-input-bordered bg-[#111111] border-[#1F1F1F] text-gray-300 w-full rounded-none focus:border-[#FF6B00] outline-none hover:border-[#FF6B00]/50 transition-colors file:bg-[#FF6B00] file:text-black file:border-none file:uppercase file:font-bold file:px-4"
              onChange={handleFile}
            />
          </div>

          <div className="hidden md:flex items-center text-gray-600 font-black uppercase text-sm">
            Or
          </div>
        }
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="file-input h-[48px] w-full rounded-xl border border-[#222] bg-[#111] text-white"
          />

          <div className="w-full md:w-auto md:mt-7">
            <button
              className="retro-btn w-full md:w-auto flex items-center justify-center gap-2"
              onClick={() => {
                setTransactions(demoData);

                localStorage.setItem(
                  "transactions",
                  JSON.stringify(demoData)
                );

                setSuccessMessage(
                  "Demo data loaded successfully!"
                );

                setTimeout(() => {
                  setSuccessMessage("");
                }, 3000);
              }}
            >
              Load Demo Data
            </button>
          </div>
        </div>
      </Section>

      {/* MANUAL ENTRY */}
      <Section
        title="Manual Entry"
        subtitle="Add transactions manually"
        right={
          <button
            onClick={() => setShowManualEntry(!showManualEntry)}
            className="rounded-xl border border-[#222] px-5 py-2 text-sm font-semibold uppercase text-gray-400"
          >
            {showManualEntry ? "Hide Form" : "Show Form"}
          </button>
        }
      >
        {showManualEntry && (
          <form onSubmit={handleManualSubmit} className="space-y-6">

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

              {/* DATE — Fix: no UTC parsing, split directly */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Date
                </label>
                <input
                  type="date"
                  required
                  // Fix 1: avoid new Date() UTC shift — split dd/MM/yyyy directly to yyyy-MM-dd
                  value={
                    manualTransaction.Date
                      ? manualTransaction.Date.split("/").reverse().join("-")
                      : ""
                  }
                  onChange={(e) => {
                    if (!e.target.value) return;
                    // Fix 2: parse parts directly, no new Date() to avoid UTC shift
                    const [year, month, day] = e.target.value.split("-");
                    setManualTransaction({
                      ...manualTransaction,
                      Date: `${day}/${month}/${year}`,
                    });
                  }}
                  className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
                />
              </div>

              {/* CATEGORY — Fix: added back, was missing */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Category
                </label>
                <select
                  value={manualTransaction.Category}
                  onChange={(e) =>
                    setManualTransaction({
                      ...manualTransaction,
                      Category: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter description"
                  value={manualTransaction.Description}
                  onChange={(e) =>
                    setManualTransaction({
                      ...manualTransaction,
                      Description: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
                />
              </div>

              {/* AMOUNT — Fix: step="0.01" added back for decimal support */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g., -450 or 5000"
                  value={manualTransaction.Amount}
                  onChange={(e) =>
                    setManualTransaction({
                      ...manualTransaction,
                      Amount: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-[#FF6B00] px-7 py-3 font-black uppercase text-black"
              >
                Add Transaction
              </button>

              <button
                type="button"
                onClick={clearAllData}
                className="rounded-xl border border-red-500/40 px-7 py-3 font-black uppercase text-red-400"
              >
                Clear Data
              </button>
            </div>
          </form>
        )}
      </Section>

      {/* CURRENCY */}
      <Section title="Currency Settings">
        <select
          value={currency?.code || ""}
          onChange={(e) => {
            const selected = CURRENCIES.find((c) => c.code === e.target.value);
            if (selected) updateCurrency(selected);
          }}
          className="w-full rounded-xl border border-[#222] bg-[#111] p-4 text-white"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} — {c.name}
            </option>
          ))}
        </select>
      </Section>

      {/* OVERVIEW */}
      {transactions?.length > 0 && (
        <Section title="Data Overview">
          Total Transactions: {transactions.length}
        </Section>
      )}
    </div>
  );
}