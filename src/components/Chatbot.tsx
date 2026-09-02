import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  Briefcase,
  MessagesSquare,
  Volume2,
  Square,
  Loader2,
} from 'lucide-react'
import {
  postChat,
  postJdFit,
  postSpeak,
  type ChatMessagePayload,
  type JdFitResponsePayload,
} from '@/lib/portfolioApi'

type PanelMode = 'chat' | 'jd'

type Message = {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  citations?: { chunk_id: string; title: string }[]
}

const SESSION_STORAGE_KEY = 'portfolio_chat_session_id'
const MAX_API_MESSAGES = 20
const MAX_SPEAK_CHARS = 2000

const hasApiBaseUrl = (): boolean =>
  Boolean(typeof import.meta.env.VITE_API_BASE_URL === 'string' && import.meta.env.VITE_API_BASE_URL.trim())

const mapMessagesToApiPayload = (msgs: Message[]): ChatMessagePayload[] =>
  msgs
    .filter((m) => m.sender === 'user' || m.sender === 'bot')
    .map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }))
    .slice(-MAX_API_MESSAGES)

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<PanelMode>('chat')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm an AI trained on Abhinav's experience. Ask me anything!",
      sender: 'bot',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [jdInput, setJdInput] = useState('')
  const [jdLoading, setJdLoading] = useState(false)
  const [jdError, setJdError] = useState<string | null>(null)
  const [jdResult, setJdResult] = useState<JdFitResponsePayload | null>(null)
  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<number>>(new Set())
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let sid = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!sid) {
      sid = crypto.randomUUID()
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, sid)
    }
    setSessionId(sid)
  }, [])

  useEffect(() => {
    if (isOpen && panelMode === 'chat' && inputRef.current) {
      inputRef.current.focus()
    }
    if (isOpen && panelMode === 'jd' && jdTextareaRef.current) {
      jdTextareaRef.current.focus()
    }
  }, [isOpen, panelMode])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setPlayingId(null)
  }, [])

  useEffect(() => stopSpeaking, [stopSpeaking])

  const handleSpeak = useCallback(
    async (message: Message) => {
      if (playingId === message.id) {
        stopSpeaking()
        return
      }
      stopSpeaking()
      if (!hasApiBaseUrl()) return
      setSpeakingId(message.id)
      try {
        const blob = await postSpeak(message.text)
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioUrlRef.current = url
        audioRef.current = audio
        audio.addEventListener('ended', stopSpeaking)
        audio.addEventListener('error', stopSpeaking)
        setPlayingId(message.id)
        await audio.play()
      } catch {
        stopSpeaking()
      } finally {
        setSpeakingId(null)
      }
    },
    [playingId, stopSpeaking]
  )

  const handleToggleSources = useCallback((messageId: number) => {
    setExpandedSourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    if (!hasApiBaseUrl()) {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: 'Set VITE_API_BASE_URL in your .env file to enable live answers (see .env.example).',
          sender: 'bot',
          timestamp: new Date(),
        },
      ])
      setInput('')
      return
    }

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsTyping(true)

    const payload = mapMessagesToApiPayload(nextMessages)

    const runOnce = async () =>
      postChat(payload, sessionId ?? undefined)

    try {
      const data = await runOnce()
      const botResponse: Message = {
        id: nextMessages.length + 1,
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
        citations: data.citations,
      }
      setMessages((prev) => [...prev, botResponse])
    } catch {
      try {
        const data = await runOnce()
        const botResponse: Message = {
          id: nextMessages.length + 1,
          text: data.reply,
          sender: 'bot',
          timestamp: new Date(),
          citations: data.citations,
        }
        setMessages((prev) => [...prev, botResponse])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 2,
            text: 'Something went wrong reaching the assistant. Try again in a moment.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ])
      }
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleAnalyzeJd = async () => {
    if (!hasApiBaseUrl()) {
      setJdError('Set VITE_API_BASE_URL in .env to use JD fit (see .env.example).')
      return
    }
    if (jdInput.trim().length < 50) {
      setJdError('Please paste at least 50 characters of the job description.')
      return
    }
    setJdError(null)
    setJdResult(null)
    setJdLoading(true)
    try {
      const data = await postJdFit(jdInput.trim())
      setJdResult(data)
    } catch {
      try {
        const data = await postJdFit(jdInput.trim())
        setJdResult(data)
      } catch {
        setJdError('Could not analyze this JD right now. Try again shortly.')
      }
    } finally {
      setJdLoading(false)
    }
  }

  return (
    <>
      <motion.button
        type="button"
        id="chatbot-button"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat with AI assistant"
        className="neon-ring fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-accent-blue/20 bg-gradient-accent shadow-lg shadow-accent-blue/40 transition-all hover:shadow-xl hover:shadow-accent-blue/60"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-accent-blue/20"
        />
        <MessageCircle className="relative z-10 h-6 w-6 text-slate-900" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Enter') {
                  e.preventDefault()
                  setIsOpen(false)
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Close chat overlay"
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="terminal-card neon-ring fixed bottom-6 right-6 z-50 flex h-[620px] max-h-[calc(100vh-3rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chatbot-dialog-title"
            >
              <div className="flex items-center justify-between border-b border-accent-blue/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent">
                    <Bot className="h-5 w-5 text-slate-900" />
                  </div>
                  <div>
                    <h3 id="chatbot-dialog-title" className="font-semibold">
                      Operator Console
                    </h3>
                    <p className="font-console text-xs text-gray-400">Grounded on portfolio sources</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="rounded-lg p-2 transition-colors hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex border-b border-accent-blue/20 px-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPanelMode('chat')}
                  aria-pressed={panelMode === 'chat'}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                    panelMode === 'chat' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-accent-blue'
                  }`}
                >
                  <MessagesSquare className="h-4 w-4" aria-hidden />
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setPanelMode('jd')}
                  aria-pressed={panelMode === 'jd'}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                    panelMode === 'jd' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-accent-purple'
                  }`}
                >
                  <Briefcase className="h-4 w-4" aria-hidden />
                  Role fit
                </button>
              </div>

              {panelMode === 'chat' ? (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender === 'bot' && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-accent">
                            <Bot className="h-4 w-4 text-slate-900" />
                          </div>
                        )}
                        <div className="max-w-[75%] space-y-2">
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              message.sender === 'user'
                                ? 'bg-gradient-accent text-slate-900'
                                : 'terminal-card text-gray-200'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          </div>
                          {message.sender === 'bot' && (
                            <button
                              type="button"
                              onClick={() => void handleSpeak(message)}
                              disabled={
                                speakingId === message.id || message.text.length > MAX_SPEAK_CHARS
                              }
                              aria-label={playingId === message.id ? 'Stop voice reply' : 'Play voice reply'}
                              title={
                                message.text.length > MAX_SPEAK_CHARS
                                  ? 'Reply is too long to play'
                                  : undefined
                              }
                              className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-gray-400 hover:bg-white/10 hover:text-accent-blue disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {speakingId === message.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                              ) : playingId === message.id ? (
                                <Square className="h-3 w-3" aria-hidden />
                              ) : (
                                <Volume2 className="h-3 w-3" aria-hidden />
                              )}
                              {playingId === message.id ? 'Stop' : 'Play in my voice'}
                            </button>
                          )}
                          {message.sender === 'bot' &&
                            message.citations &&
                            message.citations.length > 0 && (
                              <div className="text-xs text-gray-400">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSources(message.id)}
                                  className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-white/10 hover:text-accent-blue"
                                  aria-expanded={expandedSourceIds.has(message.id)}
                                  aria-controls={`sources-${message.id}`}
                                  id={`sources-trigger-${message.id}`}
                                >
                                  {expandedSourceIds.has(message.id) ? (
                                    <ChevronDown className="h-3 w-3" aria-hidden />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" aria-hidden />
                                  )}
                                  Sources ({message.citations.length})
                                </button>
                                {expandedSourceIds.has(message.id) && (
                                  <ul
                                    id={`sources-${message.id}`}
                                    role="list"
                                    className="mt-1 space-y-1 border-l border-accent-blue/20 pl-3"
                                  >
                                    {message.citations.map((c) => (
                                      <li key={c.chunk_id}>
                                        <span className="text-gray-300">{c.title}</span>
                                        <span className="text-gray-500"> · {c.chunk_id}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                        </div>
                        {message.sender === 'user' && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start gap-3"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-accent">
                          <Bot className="h-4 w-4 text-slate-900" />
                        </div>
                        <div className="terminal-card rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="h-2 w-2 rounded-full bg-accent-purple"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-accent-blue/20 p-4">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        aria-label="Chat message"
                        className="flex-1 rounded-lg border border-accent-blue/20 bg-background-light px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={!input.trim() || isTyping}
                        aria-label="Send message"
                        className="rounded-lg bg-gradient-accent px-4 py-2 text-slate-900 transition-all hover:shadow-lg hover:shadow-accent-blue/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
                  <p className="font-console text-xs text-gray-400">
                    Paste a job description for a structured match view (informational only).
                  </p>
                  <textarea
                    ref={jdTextareaRef}
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    placeholder="Paste the full JD (50+ characters)..."
                    aria-label="Job description text"
                    rows={10}
                    className="min-h-0 flex-1 resize-none rounded-lg border border-accent-blue/20 bg-background-light p-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                  />
                  {jdError && <p className="text-sm text-amber-300">{jdError}</p>}
                  <button
                    type="button"
                    onClick={() => void handleAnalyzeJd()}
                    disabled={jdLoading || jdInput.trim().length < 50}
                    className="rounded-lg bg-gradient-accent py-2 text-sm font-medium text-slate-900 transition-all hover:shadow-lg hover:shadow-accent-blue/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {jdLoading ? 'Analyzing…' : 'Analyze fit'}
                  </button>
                  {jdResult && (
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-accent-blue/20 bg-black/20 p-3 text-sm">
                      <p className="font-medium text-white">{jdResult.summary}</p>
                      <table className="w-full text-left text-xs text-gray-200">
                        <thead>
                          <tr className="border-b border-accent-blue/20 text-gray-400">
                            <th className="py-1 pr-2">Requirement</th>
                            <th className="py-1 pr-2">Fit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jdResult.match_rows.map((row) => (
                            <tr key={row.requirement} className="border-b border-white/5 align-top">
                              <td className="py-2 pr-2">{row.requirement}</td>
                              <td className="py-2 pr-2 capitalize">{row.fit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <ul className="list-disc space-y-1 pl-4 text-xs text-gray-400">
                        {jdResult.disclaimers.map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot
