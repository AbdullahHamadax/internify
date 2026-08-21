export const GROQ_MODEL = "openai/gpt-oss-120b";

// GPT-OSS is a reasoning model. Keep reasoning private and lightweight so the
// existing response parsers receive only the final answer within their limits.
export const GROQ_REASONING_CONFIG = {
  reasoning_effort: "low",
  reasoning_format: "hidden",
} as const;
