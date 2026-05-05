/**
 * Workspace installation store — persisted to Turso (libSQL cloud).
 * Tokens survive restarts and redeploys with no extra config.
 */

const { client } = require("./turso");

async function saveInstallation(installation) {
  await client.execute({
    sql: `
      INSERT INTO installations (team_id, team_name, bot_token, bot_user_id, installed_at)
      VALUES (:teamId, :teamName, :botToken, :botUserId, :installedAt)
      ON CONFLICT(team_id) DO UPDATE SET
        team_name    = excluded.team_name,
        bot_token    = excluded.bot_token,
        bot_user_id  = excluded.bot_user_id,
        installed_at = excluded.installed_at
    `,
    args: {
      teamId:      installation.teamId,
      teamName:    installation.teamName,
      botToken:    installation.botToken,
      botUserId:   installation.botUserId,
      installedAt: installation.installedAt || new Date().toISOString(),
    },
  });
  console.log(`✅ Installed for team: ${installation.teamName} (${installation.teamId})`);
}

async function getInstallation(teamId) {
  const res = await client.execute({
    sql:  "SELECT * FROM installations WHERE team_id = ?",
    args: [teamId],
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    teamId:      row.team_id,
    teamName:    row.team_name,
    botToken:    row.bot_token,
    botUserId:   row.bot_user_id,
    installedAt: row.installed_at,
  };
}

async function deleteInstallation(teamId) {
  await client.execute({
    sql:  "DELETE FROM installations WHERE team_id = ?",
    args: [teamId],
  });
}

async function getAllTeamIds() {
  const res = await client.execute("SELECT team_id FROM installations");
  return res.rows.map((r) => r.team_id);
}

module.exports = { saveInstallation, getInstallation, deleteInstallation, getAllTeamIds };
