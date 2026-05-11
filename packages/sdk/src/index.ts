export interface RealtimeEvent<TPayload = unknown> {
  event_id: string;
  event_type: string;
  event_version: number;
  occurred_at: string;
  channel: string;
  payload: TPayload;
}

export function buildWidgetUrl(baseUrl: string, token: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}

