/**
 * In-memory state store for shift requests.
 * In production, swap this for Redis or a database.
 */

const requests = new Map();

/**
 * @param {string} requesterId
 * @param {object} shiftDetails
 * @param {string[]} candidates  - ordered Slack user IDs supplied by the requester
 */
function createRequest(requesterId, shiftDetails, candidates) {
  const id = `${requesterId}-${Date.now()}`;
  const request = {
    id,
    requesterId,
    shiftDetails,
    candidates,
    currentIndex: 0,
    // "awaiting_names" → waiting for requester to tell us who to ask
    // "pending"        → actively reaching out to candidates
    // "accepted"       → someone agreed
    // "exhausted"      → everyone declined
    status: "awaiting_names",
    acceptedBy: null,
    currentAskedUserId: null,    // user ID of the person currently being messaged
    currentAskedChannelId: null, // DM channel with that person
    conversationHistory: [],     // Claude message history for the active 1-on-1
    createdAt: new Date().toISOString(),
  };
  requests.set(id, request);
  return request;
}

function getRequest(id) {
  return requests.get(id) || null;
}

/** Active request owned by this requester (any non-terminal status). */
function getActiveRequestForUser(requesterId) {
  for (const req of requests.values()) {
    if (
      req.requesterId === requesterId &&
      (req.status === "awaiting_names" || req.status === "pending")
    ) {
      return req;
    }
  }
  return null;
}

/** Pending request where this candidate is the one currently being spoken to. */
function getRequestForCandidate(candidateId) {
  for (const req of requests.values()) {
    if (req.status === "pending" && req.currentAskedUserId === candidateId) {
      return req;
    }
  }
  return null;
}

function updateRequest(id, updates) {
  const req = requests.get(id);
  if (!req) return null;
  Object.assign(req, updates);
  requests.set(id, req);
  return req;
}

module.exports = {
  createRequest,
  getRequest,
  getActiveRequestForUser,
  getRequestForCandidate,
  updateRequest,
};
