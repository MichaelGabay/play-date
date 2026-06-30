import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSocket } from "@/context/SocketContext"

/**
 * Navigates both host and guest to the Game screen when a question is broadcast.
 * @param {string | undefined} fallbackPin
 * @param {() => object | undefined} [getSessionState]
 */
export function useNewQuestionNavigation(fallbackPin, getSessionState) {
  const navigate = useNavigate()
  const { socket } = useSocket()

  useEffect(() => {
    if (!fallbackPin) return

    const onNewQuestion = ({ pin, question }) => {
      const session = getSessionState?.() ?? {}
      navigate(`/game/${pin ?? fallbackPin}`, {
        state: {
          question,
          ...session,
        },
      })
    }

    socket.on("newQuestion", onNewQuestion)

    return () => {
      socket.off("newQuestion", onNewQuestion)
    }
  }, [socket, fallbackPin, navigate, getSessionState])
}
