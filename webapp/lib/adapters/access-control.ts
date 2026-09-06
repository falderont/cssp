
/**
 * CSSP integrates at the system/API layer of whichever PACS the provider runs
 * (Lenel OnGuard, Genetec Security Center, etc.) — issue a temporary
 * credential for a visitor's visit window, revoke it after, reflect check-in/
 * check-out back. See docs/prd-v5.md Section 3. Wire protocol (OSDP vs. legacy
 * Wiegand) is the PACS/reader's concern, not this interface's.
 */
export interface AccessControlAdapter {
  issueVisitorCredential(input: {
    visitorName: string;
    facilityName: string;
    visitStart: Date;
    visitEnd: Date;
  }): Promise<{ credentialRef: string }>;
  revokeCredential(credentialRef: string): Promise<void>;
  syncCheckInStatus(credentialRef: string): Promise<"unused" | "checked_in" | "checked_out">;
}

/**
 * MVP/demo implementation — no real PACS to call. Kept behind the interface
 * above so a real Lenel/Genetec adapter is a drop-in, not a rewrite.
 */
export class MockAccessControlAdapter implements AccessControlAdapter {
  async issueVisitorCredential() {
    const credentialRef = `MOCK-CRED-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    return { credentialRef };
  }

  async revokeCredential(): Promise<void> {
    // No-op: nothing to tell a real PACS in the mock.
  }

  async syncCheckInStatus(): Promise<"unused" | "checked_in" | "checked_out"> {
    return "unused";
  }
}

export const accessControlAdapter: AccessControlAdapter = new MockAccessControlAdapter();
