import * as functions from "firebase-functions/v2/identity";

/**
 * Trigger when a new user is created
 * Creates a user document in Firestore
 */
export const onUserCreated = functions.beforeUserCreated(async (event) => {
  const { uid, email } = event.data;

  // User document will be created by the application after org assignment
  // This trigger is for future enhancements (e.g., welcome email)

  console.log(`New user created: ${uid} (${email})`);
  
  return;
});

/**
 * Trigger when a user is deleted
 * Cleans up user data and logs the deletion
 * TODO: Implement using Firestore trigger or Cloud Tasks when needed
 */
// export const onUserDeleted = ... (implement when needed)
