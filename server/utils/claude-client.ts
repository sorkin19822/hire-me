import Anthropic from '@anthropic-ai/sdk'

let _client: Anthropic | null = null

export function useClaudeClient(apiKey: string): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey })
  }
  return _client
}
