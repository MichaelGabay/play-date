/** @type {Map<string, object>} */
const activeRooms = new Map()

/**
 * @param {Map<string, object>} rooms
 * @returns {string}
 */
function generateUniquePin(rooms) {
  let pin = ""
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000))
  } while (rooms.has(pin))
  return pin
}

/**
 * @param {{ playerName: string, gameMode: string, hostSocketId: string }} params
 */
function createRoom({ playerName, gameMode, hostSocketId }) {
  const pin = generateUniquePin(activeRooms)

  const room = {
    pin,
    hostSocketId,
    hostName: playerName.trim(),
    gameMode,
    guestSocketId: null,
    guestName: null,
    votes: {},
    gameActive: false,
    createdAt: Date.now(),
  }

  activeRooms.set(pin, room)
  return room
}

/**
 * @param {string} pin
 */
function getRoom(pin) {
  return activeRooms.get(pin)
}

/**
 * @param {string} pin
 */
function deleteRoom(pin) {
  activeRooms.delete(pin)
}

/**
 * @param {string} pin
 * @param {{ guestSocketId: string, guestName: string }} guest
 */
function addGuestToRoom(pin, { guestSocketId, guestName }) {
  const room = activeRooms.get(pin)
  if (!room || room.guestSocketId) {
    return null
  }

  room.guestSocketId = guestSocketId
  room.guestName = guestName.trim()
  return room
}

/**
 * @param {string} socketId
 */
function findRoomBySocketId(socketId) {
  for (const room of activeRooms.values()) {
    if (room.hostSocketId === socketId || room.guestSocketId === socketId) {
      return room
    }
  }
  return undefined
}

/**
 * Notifies the remaining player and cleans up room state when someone leaves.
 * @param {object} room
 * @param {string} departedSocketId
 * @param {import("socket.io").Server} io
 */
function handlePlayerDeparture(room, departedSocketId, io) {
  const isHost = room.hostSocketId === departedSocketId
  const isGuest = room.guestSocketId === departedSocketId

  if (!isHost && !isGuest) {
    return
  }

  const otherSocketId = isHost ? room.guestSocketId : room.hostSocketId

  if (room.gameActive && otherSocketId) {
    io.to(otherSocketId).emit("partnerDisconnected")
  } else if (isHost) {
    io.to(room.pin).emit("roomClosed", { reason: "host_left" })
  } else if (otherSocketId) {
    io.to(otherSocketId).emit("playerLeft", { reason: "guest_left" })
  }

  if (isHost) {
    deleteRoom(room.pin)
    return
  }

  room.guestSocketId = null
  room.guestName = null
  room.votes = {}
  room.gameActive = false
}

module.exports = {
  activeRooms,
  createRoom,
  getRoom,
  deleteRoom,
  addGuestToRoom,
  findRoomBySocketId,
  handlePlayerDeparture,
}
