/**
 * Shift request store — persisted to Turso (libSQL cloud).
 * JSON fields (shiftDetails, candidates, conversationHistory) are
 * serialized as TEXT and parsed on read.
 * Scoped by teamId so multiple workspaces never collide.
 */

const { client } = require("./turso");

// ─── Row → object ─────────────────────────────────────────────────────────────

function rowToRequest(row) {
  if (!row) return null;
  return {
    id:                    row.id,
    teamId:                row.team_id,
    requesterId:           row.requester_id,
    shiftDetails:          JSON.parse(row.shift_details),
    candidates:            JSON.parse(row.candidates),
    currentIndex:          Number(row.current_index),
    status:                row.status,
    acceptedBy:            row.accepted_by,
    currentAskedUserId:    row.current_asked_user_id,
    currentAskedChannelId: row.current_asked_channel_id,
    conversationHistory:   JSON.parse(row.conversation_history),
    createdAt:             row.created_at,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function createRequest(teamId, requesterId, shiftDetails, candidates) {
  const id = `${requesterId}-${Date.now()}`;
  await client.execute({
    sql: `
      INSERT INTO requests
        (id, team_id, requester_id, shift_details, candidates, current_index,
         status, accepted_by, current_asked_user_id, current_asked_channel_id,
         conversation_history, created_at)
      VALUES
        (:id, :teamId, :requesterId, :shiftDetails, :candidates, 0,
         'awaiting_names', NULL, NULL, NULL,
         '[]', :createdAt)
    `,
    args: {
      id,
      teamId,
      requesterId,
      shiftDetails: JSON.stringify(shiftDetails),
      candidates:   JSON.stringify(candidates),
      createdAt:    new Date().toISOString(),
    },
  });
  return getRequest(teamId, id);
}

async function getRequest(teamId, requestId) {
  const res = await client.execute({
    sql:  "SELECT * FROM requests WHERE team_id = ? AND id = ?",
    args: [teamId, requestId],
  });
  return rowToRequest(res.rows[0]);
}

async function getActiveRequestForUser(teamId, requesterId) {
  const res = await client.execute({
    sql: `
      SELECT * FROM requests
      WHERE team_id = ? AND requester_id = ?
        AND status IN ('awaiting_names', 'pending')
      ORDER BY created_at DESC LIMIT 1
    `,
    args: [teamId, requesterId],
  });
  return rowToRequest(res.rows[0]);
}

async function getRequestForCandidate(teamId, candidateId) {
  const res = await client.execute({
    sql: `
      SELECT * FROM requests
      WHERE team_id = ? AND current_asked_user_id = ? AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1
    `,
    args: [teamId, candidateId],
  });
  return rowToRequest(res.rows[0]);
}

async function updateRequest(teamId, requestId, updates) {
  const colMap = {
    candidates:             "candidates",
    currentIndex:           "current_index",
    status:                 "status",
    acceptedBy:             "accepted_by",
    currentAskedUserId:     "current_asked_user_id",
    currentAskedChannelId:  "current_asked_channel_id",
    conversationHistory:    "conversation_history",
  };
  const jsonFields = new Set(["candidates", "conversationHistory"]);

  const setClauses = [];
  const args = {};

  for (const [key, col] of Object.entries(colMap)) {
    if (!(key in updates)) continue;
    setClauses.push(`${col} = :${key}`);
    args[key] = jsonFields.has(key) ? JSON.stringify(updates[key]) : updates[key];
  }

  if (setClauses.length === 0) return getRequest(teamId, requestId);

  args.teamId    = teamId;
  args.requestId = requestId;

  await client.execute({
    sql:  `UPDATE requests SET ${setClauses.join(", ")} WHERE team_id = :teamId AND id = :requestId`,
    args,
  });

  return getRequest(teamId, requestId);
}

module.exports = {
  createRequest,
  getRequest,
  getActiveRequestForUser,
  getRequestForCandidate,
  updateRequest,
};
