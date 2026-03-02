// OneSignal REST client for push notifications — Sprint 2 implementation

const APP_ID = process.env.ONESIGNAL_APP_ID || "";
const API_KEY = process.env.ONESIGNAL_API_KEY || "";

export async function sendPush(_playerId: string, _title: string, _message: string, _data?: Record<string, string>) {
  if (!APP_ID || !API_KEY) return;
  // TODO: POST to https://onesignal.com/api/v1/notifications
}

export async function sendMorningBrief(_playerId: string, _budget: number, _billsDue: number) {
  // TODO: Morning brief notification
}

export async function sendOverBudgetAlert(_playerId: string, _overAmount: number) {
  // TODO: Over budget warning
}
