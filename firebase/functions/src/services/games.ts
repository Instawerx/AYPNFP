import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { logAudit } from "./audit";

/**
 * Submit game score (callable function)
 * Validates score and prevents cheating
 */
export const submitGameScore = functions.onCall(
  {
    secrets: [],
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new functions.HttpsError("unauthenticated", "User must be authenticated");
    }

    const token = auth.token as unknown as {
      orgId: string;
      fundraiserId?: string;
    };
    const { orgId, fundraiserId } = token;

    const { gameId, score, metadata = {} } = data;

    if (!gameId || typeof score !== "number") {
      throw new functions.HttpsError("invalid-argument", "Missing required fields");
    }

    // Basic anti-cheat: validate score is within reasonable bounds
    const maxScore = 10000; // Adjust based on game
    if (score < 0 || score > maxScore) {
      throw new functions.HttpsError(
        "invalid-argument",
        `Score must be between 0 and ${maxScore}`
      );
    }

    // Additional anti-cheat: check time-based validation
    const gameStartTime = metadata.startTime;
    const gameEndTime = Date.now();
    const minGameDuration = 10000; // 10 seconds minimum

    if (gameStartTime && gameEndTime - gameStartTime < minGameDuration) {
      throw new functions.HttpsError(
        "failed-precondition",
        "Game duration too short (possible cheating)"
      );
    }

    const db = admin.firestore();

    // Create game score record
    const scoreRef = await db
      .collection("orgs")
      .doc(orgId)
      .collection("gameScores")
      .add({
        orgId,
        gameId,
        score,
        userId: auth.uid,
        fundraiserId: fundraiserId || null,
        metadata,
        createdAt: admin.firestore.Timestamp.now(),
      });

    // Update fundraiser stats if applicable
    if (fundraiserId) {
      const fundraiserRef = db
        .collection("orgs")
        .doc(orgId)
        .collection("fundraisers")
        .doc(fundraiserId);

      await fundraiserRef.update({
        gameScores: admin.firestore.FieldValue.arrayUnion({
          gameId,
          score,
          scoreId: scoreRef.id,
          createdAt: admin.firestore.Timestamp.now(),
        }),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }

    // Log audit
    await logAudit({
      orgId,
      action: "game.score.submitted",
      actor: { uid: auth.uid, type: "user" },
      entityRef: `gameScores/${scoreRef.id}`,
      before: null,
      after: { gameId, score },
    });

    return {
      success: true,
      scoreId: scoreRef.id,
      score,
    };
  }
);

/**
 * Get leaderboard for a game
 */
export async function getGameLeaderboard({
  orgId,
  gameId,
  limit = 10,
}: {
  orgId: string;
  gameId: string;
  limit?: number;
}): Promise<any[]> {
  const db = admin.firestore();

  const scoresSnap = await db
    .collection("orgs")
    .doc(orgId)
    .collection("gameScores")
    .where("gameId", "==", gameId)
    .orderBy("score", "desc")
    .limit(limit)
    .get();

  return scoresSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
