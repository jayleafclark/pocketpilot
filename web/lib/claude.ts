// Anthropic Claude SDK wrapper — Sprint 2 implementation

export async function askClaude(_systemPrompt: string, _userMessage: string) {
  // TODO: Use Anthropic SDK to chat with Claude
  // Model: claude-sonnet-4-5-20250929 for routine, claude-opus-4-6 for complex
  return { reply: "AI features coming in Sprint 2." };
}

export async function categorizeTransaction(_merchant: string, _amount: number, _description?: string) {
  // TODO: Auto-suggest category + entity
  return { category: null, entity: "personal" };
}

export async function generateRationale(_merchant: string, _amount: number, _category: string, _entity: string) {
  // TODO: Generate IRS-ready business purpose
  return { rationale: "Business rationale generation coming in Sprint 2." };
}
