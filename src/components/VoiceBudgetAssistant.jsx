// import React from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Bot, Mic, MicOff } from "lucide-react";
// import { DataContext, CURRENCIES } from "../context/AppContext";
// import { demoData } from "../data/demoData";
// import categorize from "./utils/categorize";

// export default function VoiceBudgetAssistant() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { transactions, currency, updateCurrency, setTransactions } =
//     React.useContext(DataContext);
//   const [isListening, setIsListening] = React.useState(false);
//   const [voiceMessage, setVoiceMessage] = React.useState("");
//   const [voiceSupported, setVoiceSupported] = React.useState(false);
//   const [micPermission, setMicPermission] = React.useState(null);

//   React.useEffect(() => {
//     const SpeechRecognition =
//       window.SpeechRecognition ||
//       window.webkitSpeechRecognition ||
//       window.mozSpeechRecognition ||
//       window.msSpeechRecognition;

//     setVoiceSupported(
//   typeof SpeechRecognition !== "undefined"
// );
//     // Check microphone permission status when available
//     if (navigator.permissions && navigator.permissions.query) {
//       try {
//         navigator.permissions
//           .query({ name: "microphone" })
//           .then((status) => {
//             setMicPermission(status.state);
//             status.onchange = () => setMicPermission(status.state);
//           })
//           .catch(() => setMicPermission(null));
//       } catch {
//         setMicPermission(null);
//       }
//     }
//   }, []);

//   const categories = React.useMemo(() => {
//     const spendingCategories = transactions
//       ?.filter((transaction) => Number(transaction.Amount) < 0)
//       .map((transaction) => categorize(transaction.Description));

//     return [...new Set(spendingCategories || [])];
//   }, [transactions]);

//   const closeDrawer = () => {
//     const drawer = document.getElementById("mobile-drawer");
//     if (drawer) drawer.checked = false;
//   };

//   const dispatchTransactionVoice = (transcript) => {
//     window.dispatchEvent(
//       new CustomEvent("transaction-voice-command", {
//         detail: { transcript },
//       })
//     );
//   };

//   const parseVoiceBudget = (transcript) => {
//     const normalizedTranscript = transcript.toLowerCase();
//     const amountMatch = normalizedTranscript.match(
//       /(?:rs\.?|inr|rupees?|usd|eur|gbp|jpy|aed|\$)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i
//     );
//     const amount = amountMatch
//       ? Number(amountMatch[1].replace(/,/g, ""))
//       : null;
//     const category = categories.find((item) =>
//       normalizedTranscript.includes(item.toLowerCase())
//     );

//     return { amount, category };
//   };

//   const parseVoiceCommand = (transcript) => {
//     const normalizedTranscript = transcript.toLowerCase();
//     const { amount, category } = parseVoiceBudget(transcript);
//     const currencyMatch = CURRENCIES.find((item) => {
//       const normalizedName = item.name.toLowerCase();
//       const normalizedCode = item.code.toLowerCase();

//       return (
//         normalizedTranscript.includes(normalizedCode) ||
//         normalizedTranscript.includes(normalizedName) ||
//         (item.symbol && normalizedTranscript.includes(item.symbol))
//       );
//     });

//     const navTargets = [
//       { key: "home", path: "/" },
//       { key: "dashboard", path: "/" },
//       { key: "budgets", path: "/budgets" },
//       { key: "transactions", path: "/transaction" },
//       { key: "insights", path: "/insights" },
//       { key: "settings", path: "/settings" },
//     ];

//     if (/reset budgets|clear budgets|remove budgets|delete budgets/.test(normalizedTranscript)) {
//       return { action: "resetBudgets" };
//     }

//     if (/load demo|demo data|load data|populate data|load transactions/.test(normalizedTranscript)) {
//       return { action: "loadDemoData" };
//     }

//     if (currencyMatch) {
//       return { action: "setCurrency", payload: currencyMatch };
//     }

//     if (/go to|open|show|navigate to|visit|take me to/.test(normalizedTranscript)) {
//       const page = navTargets.find((item) =>
//         normalizedTranscript.includes(item.key)
//       );

//       if (page) {
//         return { action: "navigate", payload: page.path };
//       }
//     }

//     if (/budget|spend|spent|limit|set budget/.test(normalizedTranscript)) {
//       if (amount && category) {
//         return { action: "setBudget", payload: { amount, category } };
//       }

//       if (!amount) {
//         return { action: "missingAmount" };
//       }

//       if (!category) {
//         return { action: "missingCategory" };
//       }
//     }

//     return { action: "unknown" };
//   };

//   const startVoiceFill = async () => {
//     const SpeechRecognition =
//       window.SpeechRecognition ||
//       window.webkitSpeechRecognition ||
//       window.mozSpeechRecognition ||
//       window.msSpeechRecognition;
//     // If Permissions API reports denied, short-circuit with a helpful message
//     if (micPermission === "denied") {
//       setVoiceMessage(
//         "Voice error: Microphone permission denied. Open browser site settings and allow microphone."
//       );
//       setIsListening(false);
//       return;
//     }

//     // Request microphone permission explicitly to get clearer errors
//     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//       try {
//         await navigator.mediaDevices.getUserMedia({ audio: true });
//       } catch (err) {
//         console.error("getUserMedia error:", err);
//         if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
//           setVoiceMessage(
//             "Voice error: Microphone permission denied. Allow microphone in browser/site settings."
//           );
//         } else {
//           setVoiceMessage(`Voice error: ${err.name || err.message || "permission error"}`);
//         }
//         setIsListening(false);
//         return;
//       }
//     }

//     if (!SpeechRecognition) {
//       setVoiceMessage("Voice not supported");
//       return;
//     }

//     let recognition;
//     try {
//       recognition = new SpeechRecognition();
//     } catch {
//       setVoiceMessage("Voice not supported");
//       setIsListening(false);
//       return;
//     }

//     recognition.lang = "en-IN";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     setIsListening(true);
//     setVoiceMessage("Listening...");

//     recognition.onresult = (event) => {
//       const transcript = event.results[0][0].transcript;

//       if (location.pathname === "/transaction") {
//         dispatchTransactionVoice(transcript);
//         setVoiceMessage("Searching transactions...");
//         closeDrawer();
//         return;
//       }

//       const command = parseVoiceCommand(transcript);

//       switch (command.action) {
//         case "navigate": {
//           navigate(command.payload);
//           closeDrawer();
//           setVoiceMessage(
//             `Opening ${
//               command.payload === "/" ? "home" : command.payload.replace("/", "")
//             }`
//           );
//           break;
//         }

//         case "setCurrency": {
//           updateCurrency(command.payload);
//           setVoiceMessage(`Currency set to ${command.payload.code}`);
//           break;
//         }

//         case "setBudget": {
//           const { amount, category } = command.payload;
//           const savedBudgets = JSON.parse(localStorage.getItem("budgets")) || {};
//           const updatedBudgets = { ...savedBudgets, [category]: amount };

//           localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
//           window.dispatchEvent(
//             new CustomEvent("budgets-updated", { detail: updatedBudgets })
//           );
//           setVoiceMessage(`${currency.symbol}${amount.toLocaleString()} ${category}`);
//           break;
//         }

//         case "resetBudgets": {
//           localStorage.removeItem("budgets");
//           window.dispatchEvent(new CustomEvent("budgets-updated", { detail: {} }));
//           setVoiceMessage("Budgets reset");
//           break;
//         }

//         case "loadDemoData": {
//           setTransactions(demoData);
//           localStorage.setItem("transactions", JSON.stringify(demoData));
//           setVoiceMessage("Demo data loaded");
//           break;
//         }

//         case "missingAmount": {
//           setVoiceMessage("Say an amount, like: set budget food to 500");
//           break;
//         }

//         case "missingCategory": {
//           setVoiceMessage("Say a category, like: set budget food to 500");
//           break;
//         }

//         default: {
//           setVoiceMessage("Try: spent 500 on food");
//         }
//       }
//       setIsListening(false);
//     };

//   recognition.onerror = (event) => {
//   console.error("SpeechRecognition error:", event);

//   const err = event?.error || "unknown";

//   switch (err) {
//     case "not-allowed":
//       setVoiceMessage("Microphone permission denied.");
//       break;

//     case "network":
//       setVoiceMessage("Network error occurred.");
//       break;

//     case "no-speech":
//       setVoiceMessage("No speech detected.");
//       break;

//     case "audio-capture":
//       setVoiceMessage("Microphone not found.");
//       break;

//     case "aborted":
//       setVoiceMessage("Voice recognition stopped.");
//       break;

//     default:
//       setVoiceMessage(`Voice error: ${err}`);
//   }

//   setIsListening(false);
// };

// recognition.onend = () => {
//   setIsListening(false);
// };

// try {
//   recognition.start();
// } catch (error) {
//   console.error(error);
//   setVoiceMessage("Unable to start voice recognition.");
// }
//   };
//   return (
//     <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
//       {voiceMessage && (
//         <div className="max-w-[240px] border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-300 shadow-2xl">
//           {voiceMessage}
//         </div>
//       )}

//       {!voiceSupported && (
//         <div className="max-w-[260px] border border-[#FF6B6B]/40 bg-[#0A0A0A] px-4 py-3 text-right text-xs text-red-300 shadow-2xl">
//           Voice works in Chrome/Edge on localhost or HTTPS.
//         </div>
//       )}

//       {micPermission === "denied" && (
//         <div className="max-w-[320px] border border-[#FF6B6B]/40 bg-[#0A0A0A] px-4 py-3 text-right text-xs text-red-300 shadow-2xl">
//           Microphone permission is blocked. Open the lock icon in the address bar → Site settings → Microphone → Allow, then reload the page.
//         </div>
//       )}

//       {!window.isSecureContext && (
//         <div className="max-w-[320px] border border-[#FF6B6B]/40 bg-[#0A0A0A] px-4 py-3 text-right text-xs text-red-300 shadow-2xl">
//           Voice requires HTTPS or localhost. Deploy to Netlify or run on localhost to use voice.
//         </div>
//       )}

//       <button
//         type="button"
//         onClick={startVoiceFill}
//         disabled={!voiceSupported || isListening}
//         className="grid h-14 w-14 place-items-center rounded-full border border-[#FF6B00]/60 bg-[#FF6B00] text-black shadow-[0_0_24px_rgba(255,107,0,0.35)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
//         title="Voice assistant"
//         aria-label="Voice assistant"
//       >
//         {isListening ? (
//           <MicOff size={24} strokeWidth={2.5} />
//         ) : voiceMessage ? (
//           <Mic size={24} strokeWidth={2.5} />
//         ) : (
//           <Bot size={26} strokeWidth={2.5} />
//         )}
//       </button>
//     </div>
//   );
// }
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Mic, MicOff } from "lucide-react";
import { DataContext, CURRENCIES } from "../context/AppContext";
import { demoData } from "../data/demoData";
import categorize from "./utils/categorize";

export default function VoiceBudgetAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactions, currency, updateCurrency, setTransactions } =
    React.useContext(DataContext);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceMessage, setVoiceMessage] = React.useState("");
  const [voiceSupported, setVoiceSupported] = React.useState(false);
  const [micPermission, setMicPermission] = React.useState(null);
  
  // Create a client-safe state for checking secure contexts
  const [isSecure, setIsSecure] = React.useState(true);

  React.useEffect(() => {
    // 1. Safely check window variables inside useEffect
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition ||
          window.webkitSpeechRecognition ||
          window.mozSpeechRecognition ||
          window.msSpeechRecognition
        : null;

    setVoiceSupported(typeof SpeechRecognition !== "undefined" && SpeechRecognition !== null);
    
    // 2. Safely check the secure context status on the client side
    if (typeof window !== "undefined") {
      setIsSecure(window.isSecureContext);
    }

    // Check microphone permission status when available
    if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions
          .query({ name: "microphone" })
          .then((status) => {
            setMicPermission(status.state);
            status.onchange = () => setMicPermission(status.state);
          })
          .catch(() => setMicPermission(null));
      } catch {
        setMicPermission(null);
      }
    }
  }, []);

  const categories = React.useMemo(() => {
    const spendingCategories = transactions
      ?.filter((transaction) => Number(transaction.Amount) < 0)
      .map((transaction) => categorize(transaction.Description));

    return [...new Set(spendingCategories || [])];
  }, [transactions]);

  const closeDrawer = () => {
    if (typeof document !== "undefined") {
      const drawer = document.getElementById("mobile-drawer");
      if (drawer) drawer.checked = false;
    }
  };

  const dispatchTransactionVoice = (transcript) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("transaction-voice-command", {
          detail: { transcript },
        })
      );
    }
  };

  const parseVoiceBudget = (transcript) => {
    const normalizedTranscript = transcript.toLowerCase();
    const amountMatch = normalizedTranscript.match(
      /(?:rs\.?|inr|rupees?|usd|eur|gbp|jpy|aed|\$)?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/i
    );
    const amount = amountMatch
      ? Number(amountMatch[1].replace(/,/g, ""))
      : null;
    const category = categories.find((item) =>
      normalizedTranscript.includes(item.toLowerCase())
    );

    return { amount, category };
  };

  const parseVoiceCommand = (transcript) => {
    const normalizedTranscript = transcript.toLowerCase();
    const { amount, category } = parseVoiceBudget(transcript);
    const currencyMatch = CURRENCIES.find((item) => {
      const normalizedName = item.name.toLowerCase();
      const normalizedCode = item.code.toLowerCase();

      return (
        normalizedTranscript.includes(normalizedCode) ||
        normalizedTranscript.includes(normalizedName) ||
        (item.symbol && normalizedTranscript.includes(item.symbol))
      );
    });

    const navTargets = [
      { key: "home", path: "/" },
      { key: "dashboard", path: "/" },
      { key: "budgets", path: "/budgets" },
      { key: "transactions", path: "/transaction" },
      { key: "insights", path: "/insights" },
      { key: "settings", path: "/settings" },
    ];

    if (/reset budgets|clear budgets|remove budgets|delete budgets/.test(normalizedTranscript)) {
      return { action: "resetBudgets" };
    }

    if (/load demo|demo data|load data|populate data|load transactions/.test(normalizedTranscript)) {
      return { action: "loadDemoData" };
    }

    if (currencyMatch) {
      return { action: "setCurrency", payload: currencyMatch };
    }

    if (/go to|open|show|navigate to|visit|take me to/.test(normalizedTranscript)) {
      const page = navTargets.find((item) =>
        normalizedTranscript.includes(item.key)
      );

      if (page) {
        return { action: "navigate", payload: page.path };
      }
    }

    if (/budget|spend|spent|limit|set budget/.test(normalizedTranscript)) {
      if (amount && category) {
        return { action: "setBudget", payload: { amount, category } };
      }

      if (!amount) {
        return { action: "missingAmount" };
      }

      if (!category) {
        return { action: "missingCategory" };
      }
    }

    return { action: "unknown" };
  };

  const startVoiceFill = async () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (micPermission === "denied") {
      setVoiceMessage(
        "Voice error: Microphone permission denied. Open browser site settings and allow microphone."
      );
      setIsListening(false);
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        console.error("getUserMedia error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setVoiceMessage(
            "Voice error: Microphone permission denied. Allow microphone in browser/site settings."
          );
        } else {
          setVoiceMessage(`Voice error: ${err.name || err.message || "permission error"}`);
        }
        setIsListening(false);
        return;
      }
    }

    if (!SpeechRecognition) {
      setVoiceMessage("Voice not supported");
      return;
    }

    let recognition;
    try {
      recognition = new SpeechRecognition();
    } catch {
      setVoiceMessage("Voice not supported");
      setIsListening(false);
      return;
    }

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setVoiceMessage("Listening...");

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      if (location.pathname === "/transaction") {
        dispatchTransactionVoice(transcript);
        setVoiceMessage("Searching transactions...");
        closeDrawer();
        return;
      }

      const command = parseVoiceCommand(transcript);

      switch (command.action) {
        case "navigate": {
          navigate(command.payload);
          closeDrawer();
          setVoiceMessage(
            `Opening ${
              command.payload === "/" ? "home" : command.payload.replace("/", "")
            }`
          );
          break;
        }

        case "setCurrency": {
          updateCurrency(command.payload);
          setVoiceMessage(`Currency set to ${command.payload.code}`);
          break;
        }

        case "setBudget": {
          const { amount, category } = command.payload;
          const savedBudgets = JSON.parse(localStorage.getItem("budgets")) || {};
          const updatedBudgets = { ...savedBudgets, [category]: amount };

          localStorage.setItem("budgets", JSON.stringify(updatedBudgets));
          window.dispatchEvent(
            new CustomEvent("budgets-updated", { detail: updatedBudgets })
          );
          setVoiceMessage(`${currency.symbol}${amount.toLocaleString()} ${category}`);
          break;
        }

        case "resetBudgets": {
          localStorage.removeItem("budgets");
          window.dispatchEvent(new CustomEvent("budgets-updated", { detail: {} }));
          setVoiceMessage("Budgets reset");
          break;
        }

        case "loadDemoData": {
          setTransactions(demoData);
          localStorage.setItem("transactions", JSON.stringify(demoData));
          setVoiceMessage("Demo data loaded");
          break;
        }

        case "missingAmount": {
          setVoiceMessage("Say an amount, like: set budget food to 500");
          break;
        }

        case "missingCategory": {
          setVoiceMessage("Say a category, like: set budget food to 500");
          break;
        }

        default: {
          setVoiceMessage("Try: spent 500 on food");
        }
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("SpeechRecognition error:", event);
      const err = event?.error || "unknown";

      switch (err) {
        case "not-allowed":
          setVoiceMessage("Microphone permission denied.");
          break;
        case "network":
          setVoiceMessage("Network error occurred.");
          break;
        case "no-speech":
          setVoiceMessage("No speech detected.");
          break;
        case "audio-capture":
          setVoiceMessage("Microphone not found.");
          break;
        case "aborted":
          setVoiceMessage("Voice recognition stopped.");
          break;
        default:
          setVoiceMessage(`Voice error: ${err}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
      setVoiceMessage("Unable to start voice recognition.");
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {voiceMessage && (
        <div className="max-w-[240px] border border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-300 shadow-2xl">
          {voiceMessage}
        </div>
      )}

      {!voiceSupported && (
        <div className="max-w-[260px] border border-[#FF6B6B]/40 bg-[#0A0A0A] px-4 py-3 text-right text-xs text-red-300 shadow-2xl">
          Voice works in Chrome/Edge on localhost or HTTPS.
        </div>
      )}

      {micPermission === "denied" && (
        <div className="max-w-[320px] border border-[#FF6B6B]/40 bg-[#0A0A0A] px-4 py-3 text-right text-xs text-red-300 shadow-2xl">
          Microphone permission is blocked. Open the lock icon in the address bar → Site settings → Microphone → Allow, then reload the page.
        </div>
      )}

      {/* Replaced window.isSecureContext with client-safe state */}
      {!isSecure && (
        <div className="max-w-[320px] border border-[#FF6B6B]/40 bg-[#0A0A0A] px-4 py-3 text-right text-xs text-red-300 shadow-2xl">
          Voice requires HTTPS or localhost. Deploy to Netlify or run on localhost to use voice.
        </div>
      )}

      <button
        type="button"
        onClick={startVoiceFill}
        disabled={!voiceSupported || isListening}
        className="grid h-14 w-14 place-items-center rounded-full border border-[#FF6B00]/60 bg-[#FF6B00] text-black shadow-[0_0_24px_rgba(255,107,0,0.35)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
        title="Voice assistant"
        aria-label="Voice assistant"
      >
        {isListening ? (
          <MicOff size={24} strokeWidth={2.5} />
        ) : voiceMessage ? (
          <Mic size={24} strokeWidth={2.5} />
        ) : (
          <Bot size={26} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}