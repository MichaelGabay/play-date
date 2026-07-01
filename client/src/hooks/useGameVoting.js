import { useCallback, useEffect, useState } from "react"
import { useSocket } from "@/context/SocketContext"
import { pickRandomQuestion, withShuffledOptions } from "@/data/questions"
import { hapticLight, hapticPartnerTurn, hapticSuccess } from "@/lib/haptics"

/**
 * Manages voting, live partner feedback, synchronized reveal, and next-question flow.
 * @param {{
 *   pin: string,
 *   question: object,
 *   isHost: boolean,
 *   gameMode: string,
 *   askedQuestionIds: number[],
 *   hostName: string,
 *   guestName: string,
 * }} session
 */
export function useGameVoting({
  pin,
  question: initialQuestion,
  isHost,
  gameMode,
  askedQuestionIds: initialAskedIds,
  hostName,
  guestName,
}) {
  const { socket } = useSocket()

  const [question, setQuestion] = useState(initialQuestion)
  const [askedQuestionIds, setAskedQuestionIds] = useState(initialAskedIds ?? [])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [partnerHasVoted, setPartnerHasVoted] = useState(false)
  const [results, setResults] = useState(null)
  const [nextQuestionError, setNextQuestionError] = useState("")
  const [partnerDisconnected, setPartnerDisconnected] = useState(false)

  const resetVotingState = useCallback(() => {
    setSelectedAnswer(null)
    setHasVoted(false)
    setPartnerHasVoted(false)
    setResults(null)
    setNextQuestionError("")
  }, [])

  useEffect(() => {
    const onPartnerVoted = () => {
      setPartnerHasVoted(true)
      hapticPartnerTurn()
    }

    const onRevealResults = (payload) => {
      setResults(payload)
      setPartnerHasVoted(false)
      hapticSuccess()
    }

    const onNewQuestion = ({ question: nextQuestion }) => {
      setQuestion(nextQuestion)
      resetVotingState()
    }

    const onQuestionError = ({ message }) => {
      setNextQuestionError(message || "לא ניתן לשלוח שאלה")
    }

    const onVoteError = ({ message }) => {
      setNextQuestionError(message || "לא ניתן לשלוח הצבעה")
    }

    const onPartnerDisconnected = () => {
      setPartnerDisconnected(true)
    }

    socket.on("partnerVoted", onPartnerVoted)
    socket.on("revealResults", onRevealResults)
    socket.on("newQuestion", onNewQuestion)
    socket.on("questionError", onQuestionError)
    socket.on("voteError", onVoteError)
    socket.on("partnerDisconnected", onPartnerDisconnected)

    return () => {
      socket.off("partnerVoted", onPartnerVoted)
      socket.off("revealResults", onRevealResults)
      socket.off("newQuestion", onNewQuestion)
      socket.off("questionError", onQuestionError)
      socket.off("voteError", onVoteError)
      socket.off("partnerDisconnected", onPartnerDisconnected)
    }
  }, [socket, resetVotingState])

  const submitVote = useCallback(
    (answer) => {
      if (hasVoted || results) return

      hapticLight()
      setSelectedAnswer(answer)
      setHasVoted(true)
      socket.emit("submitVote", { pin, answer })
    },
    [hasVoted, results, socket, pin]
  )

  const handleNextQuestion = useCallback(() => {
    if (!isHost) return

    setNextQuestionError("")
    const picked = pickRandomQuestion(gameMode, askedQuestionIds)

    if (!picked) {
      setNextQuestionError("אין עוד שאלות זמינות במצב זה")
      return
    }

    const nextQuestion = withShuffledOptions(picked)
    const updatedAskedIds = [...askedQuestionIds, nextQuestion.id]
    setAskedQuestionIds(updatedAskedIds)
    socket.emit("sendQuestion", { pin, question: nextQuestion })
  }, [isHost, gameMode, askedQuestionIds, socket, pin])

  const leaveGame = useCallback(() => {
    socket.emit("leaveGame", { pin })
  }, [socket, pin])

  return {
    question,
    selectedAnswer,
    hasVoted,
    partnerHasVoted,
    results,
    nextQuestionError,
    partnerDisconnected,
    submitVote,
    handleNextQuestion,
    leaveGame,
    hostName,
    guestName,
    isHost,
  }
}
