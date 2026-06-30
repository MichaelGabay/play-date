export const GAME_MODES = [
  {
    id: "relaxed_and_light",
    label: "קליל ונינוח",
    description: "שאלות קלילות לשבירת הקרח",
    emoji: "☕",
    questionCount: 100,
  },
  {
    id: "warming_up_personal",
    label: "מתחמם ואישי",
    description: "שאלות שמעמיקות את החיבור",
    emoji: "💫",
    questionCount: 100,
  },
  {
    id: "naughty_and_daring",
    label: "עוברים לשלב הבא",
    description: "שאלות נועזות לזוגות אמיצים",
    emoji: "🔥",
    questionCount: 100,
  },
]

export const MOCK_LOBBY_PLAYERS = [
  { id: 1, name: "את/ה", isHost: true, isReady: true },
  { id: 2, name: "ממתין/ה לשותף/ה...", isHost: false, isReady: false },
]

export const MOCK_ROOM_PIN = "482916"
