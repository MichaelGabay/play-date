const path = require("path")
require("dotenv").config({ path: path.join(__dirname, ".env") })

const express = require("express")
const http = require("http")
const cors = require("cors")
const { Server } = require("socket.io")
const {
  createRoom,
  getRoom,
  deleteRoom,
  addGuestToRoom,
  findRoomBySocketId,
  handlePlayerDeparture,
} = require("./rooms")

const PORT = process.env.PORT || 3000
const CLIENT_URLS = (
  process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean)

const app = express()
app.use(cors({ origin: CLIENT_URLS }))
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URLS,
    methods: ["GET", "POST"],
  },
})

io.on("connection", (socket) => {
  socket.on("createRoom", ({ playerName = "", gameMode = "" } = {}) => {
    const trimmedName = String(playerName || "").trim()

    if (!trimmedName) {
      socket.emit("createError", { message: "יש להזין שם" })
      return
    }

    const existingRoom = findRoomBySocketId(socket.id)
    if (existingRoom && existingRoom.hostSocketId === socket.id) {
      existingRoom.hostName = trimmedName
      socket.join(existingRoom.pin)
      socket.emit("roomCreated", {
        pin: existingRoom.pin,
        hostName: existingRoom.hostName,
        gameMode: existingRoom.gameMode,
      })
      return
    }

    const room = createRoom({
      playerName: trimmedName,
      gameMode,
      hostSocketId: socket.id,
    })

    socket.join(room.pin)

    socket.emit("roomCreated", {
      pin: room.pin,
      hostName: room.hostName,
      gameMode: room.gameMode,
    })
  })

  socket.on("joinRoom", ({ pin, playerName = "" } = {}) => {
    const normalizedPin = String(pin || "").trim()
    const trimmedName = String(playerName || "").trim()

    if (!trimmedName) {
      socket.emit("joinError", { message: "יש להזין שם" })
      return
    }

    if (!/^\d{6}$/.test(normalizedPin)) {
      socket.emit("joinError", { message: "קוד חדר לא תקין" })
      return
    }

    const room = getRoom(normalizedPin)

    if (!room) {
      socket.emit("joinError", { message: "החדר לא נמצא או שפג תוקפו" })
      return
    }

    if (room.guestSocketId) {
      socket.emit("joinError", { message: "החדר כבר מלא" })
      return
    }

    if (room.hostSocketId === socket.id) {
      socket.emit("joinError", { message: "לא ניתן להצטרף לחדר שיצרת" })
      return
    }

    const updatedRoom = addGuestToRoom(normalizedPin, {
      guestSocketId: socket.id,
      guestName: trimmedName,
    })

    if (!updatedRoom) {
      socket.emit("joinError", { message: "לא ניתן להצטרף לחדר" })
      return
    }

    socket.join(normalizedPin)

    socket.emit("joinSuccess", {
      pin: updatedRoom.pin,
      hostName: updatedRoom.hostName,
      guestName: updatedRoom.guestName,
      gameMode: updatedRoom.gameMode,
    })

    socket.to(normalizedPin).emit("playerJoined", {
      pin: updatedRoom.pin,
      guestName: updatedRoom.guestName,
      playerCount: 2,
    })
  })

  socket.on("sendQuestion", ({ pin, question } = {}) => {
    const normalizedPin = String(pin || "").trim()
    const room = getRoom(normalizedPin)

    if (!room) {
      socket.emit("questionError", { message: "החדר לא נמצא" })
      return
    }

    if (room.hostSocketId !== socket.id) {
      socket.emit("questionError", { message: "רק המארח/ת יכול/ה לשלוח שאלה" })
      return
    }

    if (!question || typeof question !== "object") {
      socket.emit("questionError", { message: "שאלה לא תקינה" })
      return
    }

    room.votes = {}
    room.gameActive = true

    io.to(normalizedPin).emit("newQuestion", {
      pin: normalizedPin,
      question,
    })
  })

  socket.on("submitVote", ({ pin, answer } = {}) => {
    const normalizedPin = String(pin || "").trim()
    const room = getRoom(normalizedPin)

    if (!room) {
      socket.emit("voteError", { message: "החדר לא נמצא" })
      return
    }

    const isHost = room.hostSocketId === socket.id
    const isGuest = room.guestSocketId === socket.id

    if (!isHost && !isGuest) {
      socket.emit("voteError", { message: "אינך בחדר זה" })
      return
    }

    if (!answer || typeof answer !== "string") {
      socket.emit("voteError", { message: "תשובה לא תקינה" })
      return
    }

    if (room.votes[socket.id]) {
      return
    }

    room.votes[socket.id] = answer
    const voteCount = Object.keys(room.votes).length

    if (voteCount === 1) {
      const otherSocketId = isHost ? room.guestSocketId : room.hostSocketId
      if (otherSocketId) {
        io.to(otherSocketId).emit("partnerVoted")
      }
    } else if (voteCount === 2) {
      const hostChoice = room.votes[room.hostSocketId]
      const guestChoice = room.votes[room.guestSocketId]
      const isMatch = hostChoice === guestChoice

      io.to(normalizedPin).emit("revealResults", {
        hostName: room.hostName,
        guestName: room.guestName,
        hostChoice,
        guestChoice,
        isMatch,
      })

      room.votes = {}
    }
  })

  socket.on("leaveGame", ({ pin } = {}) => {
    const normalizedPin = String(pin || "").trim()
    const room = getRoom(normalizedPin)

    if (!room) {
      return
    }

    const isHost = room.hostSocketId === socket.id
    const isGuest = room.guestSocketId === socket.id

    if (!isHost && !isGuest) {
      return
    }

    handlePlayerDeparture(room, socket.id, io)
    socket.leave(normalizedPin)
  })

  socket.on("disconnect", () => {
    const room = findRoomBySocketId(socket.id)
    if (!room) return

    handlePlayerDeparture(room, socket.id, io)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
  console.log(`CORS origins: ${CLIENT_URLS.join(", ")}`)
})
