import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Mic,
  MapPin,
  Fuel,
  CloudRain,
  AlertTriangle,
  Navigation,
  Wrench,
  MessageCircle,
  Truck,
  Menu,
  X,
  Phone,
  Clock,
  TrendingUp,
} from "lucide-react";
import heroTruckImage from "../../imports/image.png";
import fleetTruckImage from "../../imports/image-1.png";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

export function DriverAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey there! I'm your AI co-pilot. How can I assist you on the road today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    {
      icon: Fuel,
      label: "Find Fuel",
      color: "from-orange-500 to-red-600",
    },
    {
      icon: MapPin,
      label: "Navigation",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: CloudRain,
      label: "Weather",
      color: "from-purple-500 to-pink-600",
    },
    {
      icon: Wrench,
      label: "Maintenance",
      color: "from-green-500 to-emerald-600",
    },
  ];

  const handleQuickAction = (label: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: `Help me with ${label.toLowerCase()}`,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    simulateResponse(label);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    simulateResponse(inputValue);
  };

  const simulateResponse = (query: string) => {
    setIsTyping(true);
    setTimeout(() => {
      const responses: Record<string, string> = {
        "Find Fuel":
          "I found 3 truck stops within 15 miles. The closest is TA Travel Center at Exit 42, 8 miles ahead. Diesel is $3.89/gallon. Want directions?",
        Navigation:
          "Where would you like to go? I can provide optimized routes, check traffic conditions, and find truck-friendly roads.",
        Weather:
          "Current conditions: Clear skies, 68°F. Next 50 miles: Partly cloudy with no precipitation expected. Safe travels!",
        Maintenance:
          "Your next scheduled maintenance is in 2,450 miles. Oil change and tire rotation recommended. Should I find service centers along your route?",
      };

      let responseText =
        responses[query] ||
        "I'm here to help! I can assist with navigation, fuel stops, weather updates, maintenance reminders, and emergency assistance. What do you need?";

      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Hero Section with Main Truck Image */}
      <div className="relative h-[50vh] md:h-[55vh] overflow-hidden">
        {/* Truck Image */}
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={heroTruckImage}
          alt="Highway Truck"
          className="absolute inset-0 w-full h-full object-contain object-center brightness-105 contrast-110"

        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 via-transparent to-orange-900/40" />

        {/* Header Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-black/40 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/20"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
                <Truck className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  Driver AI
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs text-blue-200">
                    Online & Assisting
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 text-white hover:bg-white/10 transition-all"
            >
              <Menu size={24} />
            </motion.button>
          </div>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
              <MapPin className="text-orange-400" size={18} />
              <span className="text-white text-sm font-medium">
                Dallas → Chicago
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
              <Clock className="text-blue-400" size={18} />
              <span className="text-white text-sm font-medium">
                4h 23m remaining
              </span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-4 py-2 border border-white/20">
              <TrendingUp
                className="text-green-400"
                size={18}
              />
              <span className="text-white text-sm font-medium">
                342 miles today
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Quick Actions Sidebar */}
<div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
  <div className="flex flex-col gap-3">
    {quickActions.map((action, index) => (
      <motion.button
        key={action.label}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleQuickAction(action.label)}
        className={`group relative w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color}
          flex items-center justify-center shadow-lg`}
      >
        <action.icon
          size={22}
          className="text-white"
        />

        <div
          className="
            absolute left-16
            whitespace-nowrap
            opacity-0
            group-hover:opacity-100
            transition-all
            bg-black/80
            text-white
            px-3 py-1
            rounded-lg
            text-sm
          "
        >
          {action.label}
        </div>
      </motion.button>
    ))}
  </div>
</div>

      {/* Messages Area with Fleet Image Card */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900/50 to-slate-950 px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6 ml-20">
          {/* Featured Fleet Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-48 rounded-3xl overflow-hidden group cursor-pointer"
          >
            <img
              src={fleetTruckImage}
              alt="Truck Fleet"
              className="
absolute inset-0
w-full
h-full
object-cover
brightness-105
contrast-110
group-hover:scale-105
transition-transform
duration-500
"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Your Fleet Status
              </h3>
              <p className="text-blue-200 text-sm">
                All vehicles operational • Route optimized • 0
                alerts
              </p>
            </div>
          </motion.div>

          {/* Messages */}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl ${
                    message.sender === "user"
                      ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30"
                      : "bg-white/10 backdrop-blur-2xl border border-white/20 text-white shadow-lg"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">
                    {message.text}
                  </p>
                  <p className="text-xs mt-3 opacity-60 flex items-center gap-2">
                    <Clock size={12} />
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-5 rounded-3xl shadow-lg">
                <div className="flex gap-1.5">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0,
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400"
                  />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0.2,
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400"
                  />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: 0.4,
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400"
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-2 focus-within:border-orange-500/60 focus-within:shadow-lg focus-within:shadow-orange-500/20 transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && handleSendMessage()
              }
              placeholder="Ask me anything about your journey..."
              className="flex-1 bg-transparent px-5 py-4 text-white placeholder-white/50 outline-none text-base"
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
            >
              <Mic size={22} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className={`p-3.5 rounded-2xl transition-all shadow-lg ${
                inputValue.trim()
                  ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-orange-500/30 hover:shadow-orange-500/50"
                  : "bg-white/10 text-white/30 cursor-not-allowed shadow-none"
              }`}
            >
              <Send size={22} />
            </motion.button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-4">
            <p className="text-xs text-white/40">
              Powered by AI
            </p>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <p className="text-xs text-white/40">
              Available 24/7
            </p>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <p className="text-xs text-white/40">
              Your safety is our priority
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}