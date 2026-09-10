/** French TTS via Web Speech API — no external deps. */

let preferred: SpeechSynthesisVoice | null = null

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const voices = window.speechSynthesis.getVoices()
  preferred =
    voices.find((v) => v.lang.startsWith('fr') && /Google|Natural|Premium|Audrey|Thomas/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('fr')) ??
    voices[0] ??
    null
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

export function ttsSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function ttsStop() {
  window.speechSynthesis?.cancel()
}

export function ttsSpeak(text: string, opts?: { rate?: number; pitch?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ttsSupported()) {
      reject(new Error('TTS unsupported'))
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    if (preferred) utter.voice = preferred
    utter.lang = 'fr-FR'
    utter.rate = opts?.rate ?? 0.92
    utter.pitch = opts?.pitch ?? 1
    utter.onend = () => resolve()
    utter.onerror = () => resolve()
    window.speechSynthesis.speak(utter)
  })
}

export async function ttsAnnounceTurn(name: string) {
  await ttsSpeak(`C’est au tour de ${name}`, { pitch: 1.08 })
}

export async function ttsAskChoice() {
  await ttsSpeak('Action ou vérité ?')
}

export async function ttsReadChallenge(text: string, duration?: number) {
  const extra = duration && duration > 0 ? ` Tu as ${duration} secondes.` : ''
  await ttsSpeak(`${text}.${extra}`, { rate: 0.88 })
}

export async function ttsCountdown(secondsLeft: number) {
  if (secondsLeft <= 10 && secondsLeft > 0) {
    await ttsSpeak(String(secondsLeft), { rate: 1.15, pitch: 1.15 })
  }
}

export async function ttsTimeUp() {
  await ttsSpeak('Temps écoulé !', { pitch: 1.2 })
}
