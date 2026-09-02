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
  Play,
  Pause,
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
  const [isPaused, setIsPaused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null)
  // Per-message audio cache: once a reply has been voiced, its Audio element and
  // blob URL are kept here so re-pressing play never re-calls Fish Audio and can
  // resume/replay instantly, bound to that message's id regardless of what else
  // has played since.
  const audioCacheRef = useRef<Map<number, HTMLAudioElement>>(new Map())
  const audioUrlCacheRef = useRef<Map<number, string>>(new Map())

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

  // Pauses whichever cached audio is currently active, without discarding it —
  // the element and its blob URL stay bound to that message id so it can be
  // resumed or replayed later with no re-fetch.
  const pauseActiveAudio = useCallback(() => {
    if (playingId !== null) {
      audioCacheRef.current.get(playingId)?.pause()
    }
    setIsPaused(true)
  }, [playingId])

  const releaseAllAudio = useCallback(() => {
    audioCacheRef.current.forEach((audio) => {
      audio.pause()
      audio.src = ''
    })
    audioCacheRef.current.clear()
    audioUrlCacheRef.current.forEach((url) => URL.revokeObjectURL(url))
    audioUrlCacheRef.current.clear()
    setPlayingId(null)
    setIsPaused(false)
  }, [])

  useEffect(() => releaseAllAudio, [releaseAllAudio])

  const handleSpeak = useCallback(
    async (message: Message) => {
      // Same reply already bound as the active one: just toggle play/pause,
      // preserving position — no network call either way.
      if (playingId === message.id) {
        const audio = audioCacheRef.current.get(message.id)
        if (!audio) return
        if (audio.paused) {
          if (audio.ended) audio.currentTime = 0
          setIsPaused(false)
          await audio.play()
        } else {
          audio.pause()
          setIsPaused(true)
        }
        return
      }

      // Switching to a different reply: pause (don't discard) whatever was active.
      pauseActiveAudio()

      const cached = audioCacheRef.current.get(message.id)
      if (cached) {
        setPlayingId(message.id)
        setIsPaused(false)
        cached.currentTime = cached.ended ? 0 : cached.currentTime
        await cached.play()
        return
      }

      if (!hasApiBaseUrl()) return
      setSpeakingId(message.id)
      try {
        const blob = await postSpeak(message.text)
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioUrlCacheRef.current.set(message.id, url)
        audioCacheRef.current.set(message.id, audio)
        audio.addEventListener('ended', () => setIsPaused(true))
        audio.addEventListener('error', () => {
          audioCacheRef.current.delete(message.id)
          const staleUrl = audioUrlCacheRef.current.get(message.id)
          if (staleUrl) {
            URL.revokeObjectURL(staleUrl)
            audioUrlCacheRef.current.delete(message.id)
          }
          setPlayingId(null)
          setIsPaused(false)
        })
        setPlayingId(message.id)
        setIsPaused(false)
        await audio.play()
      } catch {
        setPlayingId(null)
        setIsPaused(false)
      } finally {
        setSpeakingId(null)
      }
    },
    [playingId, pauseActiveAudio]
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat with AI assistant"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-canvas shadow-lg shadow-black/40 transition-colors hover:bg-white sm:bottom-6 sm:right-6"
      >
        <MessageCircle className="h-5 w-5" />
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
              className="fixed inset-0 z-50 bg-black/60"
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.15 }}
              className="panel fixed inset-x-4 bottom-4 z-50 flex h-[min(620px,calc(100dvh-2rem))] flex-col overflow-hidden sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(620px,calc(100dvh-3rem))] sm:w-full sm:max-w-md"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chatbot-dialog-title"
            >
              <div className="flex items-center justify-between border-b border-line p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 id="chatbot-dialog-title" className="text-sm font-medium text-ink">
                      Ask Abhinav
                    </h3>
                    <p className="font-mono text-xs text-ink-subtle">Answers grounded in résumé data</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-canvas-inset hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex border-b border-line px-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPanelMode('chat')}
                  aria-pressed={panelMode === 'chat'}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-t-md px-3 py-2 text-sm transition-colors ${
                    panelMode === 'chat' ? 'bg-canvas-inset text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <MessagesSquare className="h-4 w-4" aria-hidden />
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setPanelMode('jd')}
                  aria-pressed={panelMode === 'jd'}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-t-md px-3 py-2 text-sm transition-colors ${
                    panelMode === 'jd' ? 'bg-canvas-inset text-ink' : 'text-ink-muted hover:text-ink'
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
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender === 'bot' && (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-muted">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className="max-w-[75%] space-y-2">
                          <div
                            className={`rounded-md px-3.5 py-2 text-sm leading-relaxed ${
                              message.sender === 'user'
                                ? 'bg-ink text-canvas'
                                : 'panel-inset text-ink'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.text}</p>
                          </div>
                          {message.sender === 'bot' && (
                            <button
                              type="button"
                              onClick={() => void handleSpeak(message)}
                              disabled={
                                speakingId === message.id || message.text.length > MAX_SPEAK_CHARS
                              }
                              aria-label={
                                playingId === message.id
                                  ? isPaused
                                    ? 'Resume voice reply'
                                    : 'Pause voice reply'
                                  : 'Play voice reply'
                              }
                              title={
                                message.text.length > MAX_SPEAK_CHARS
                                  ? 'Reply is too long to play'
                                  : undefined
                              }
                              className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-ink-subtle transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {speakingId === message.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                              ) : playingId === message.id && !isPaused ? (
                                <Pause className="h-3 w-3" aria-hidden />
                              ) : playingId === message.id && isPaused ? (
                                <Play className="h-3 w-3" aria-hidden />
                              ) : (
                                <Volume2 className="h-3 w-3" aria-hidden />
                              )}
                              {playingId === message.id
                                ? isPaused
                                  ? 'Resume'
                                  : 'Pause'
                                : 'Play in my voice'}
                            </button>
                          )}
                          {message.sender === 'bot' &&
                            message.citations &&
                            message.citations.length > 0 && (
                              <div className="text-xs text-ink-subtle">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSources(message.id)}
                                  className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-ink"
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
                                    className="mt-1 space-y-1 border-l border-line pl-3"
                                  >
                                    {message.citations.map((c) => (
                                      <li key={c.chunk_id}>
                                        <span className="text-ink-muted">{c.title}</span>
                                        <span className="text-ink-subtle"> · {c.chunk_id}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                        </div>
                        {message.sender === 'user' && (
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-muted">
                            <User className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start gap-3"
                      >
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-muted">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="panel-inset rounded-md px-4 py-3">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-ink-subtle"
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t border-line p-4">
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        aria-label="Chat message"
                        className="flex-1 rounded-md border border-line bg-canvas-inset px-3 py-2 text-sm text-ink placeholder-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-link"
                      />
                      <button
                        type="button"
                        onClick={() => void handleSend()}
                        disabled={!input.trim() || isTyping}
                        aria-label="Send message"
                        className="rounded-md bg-ink px-3.5 py-2 text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
                  <p className="font-mono text-xs text-ink-subtle">
                    Paste a job description for a structured match view (informational only).
                  </p>
                  <textarea
                    ref={jdTextareaRef}
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    placeholder="Paste the full JD (50+ characters)..."
                    aria-label="Job description text"
                    rows={10}
                    className="min-h-0 flex-1 resize-none rounded-md border border-line bg-canvas-inset p-3 text-sm text-ink placeholder-ink-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-link"
                  />
                  {jdError && <p className="text-sm text-signal-attention">{jdError}</p>}
                  <button
                    type="button"
                    onClick={() => void handleAnalyzeJd()}
                    disabled={jdLoading || jdInput.trim().length < 50}
                    className="rounded-md bg-ink py-2 text-sm font-medium text-canvas transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {jdLoading ? 'Analyzing…' : 'Analyze fit'}
                  </button>
                  {jdResult && (
                    <div className="panel-inset min-h-0 flex-1 space-y-3 overflow-y-auto p-3 text-sm">
                      <p className="font-medium text-ink">{jdResult.summary}</p>
                      <table className="w-full text-left text-xs text-ink-muted">
                        <thead>
                          <tr className="border-b border-line text-ink-subtle">
                            <th className="py-1 pr-2 font-normal">Requirement</th>
                            <th className="py-1 pr-2 font-normal">Fit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jdResult.match_rows.map((row) => (
                            <tr key={row.requirement} className="border-b border-line-muted align-top">
                              <td className="py-2 pr-2">{row.requirement}</td>
                              <td className="py-2 pr-2 capitalize">{row.fit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <ul className="list-disc space-y-1 pl-4 text-xs text-ink-subtle">
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
