/**
 * Simple test to verify backend read status API
 */

import { documentReadStatusAPI } from "@/lib/api/documentReadStatus";

export async function testBackendReadStatus() {

  try {
    // Test 1: Get batch read status for some document IDs
    const testIds = [1, 2, 3]; // Replace with actual document IDs
    const batchResult = await documentReadStatusAPI.getBatchReadStatus(
      testIds,
      "INCOMING_EXTERNAL"
    );

    // Test 2: Mark first document as read
    if (testIds.length > 0) {
      await documentReadStatusAPI.markAsRead(testIds[0], "INCOMING_EXTERNAL");

      // Test 3: Check if it's really marked as read
      const singleResult = await documentReadStatusAPI.isDocumentRead(
        testIds[0],
        "INCOMING_EXTERNAL"
      );
    }
  } catch (error) {
  }
}


