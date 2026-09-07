import type { ModelCatalogEntry } from "./types";

const GB = 1024 ** 3;

export const bundledModelCatalog: ModelCatalogEntry[] = [
  {
    id: "qwen2.5-3b-q4",
    name: "Qwen 2.5 3B Instruct",
    family: "Qwen 2.5",
    parameterCount: "3B",
    quantization: "Q4_K_M",
    downloadBytes: Math.round(2.1 * GB),
    requiredMemoryBytes: 4 * GB,
    minimumContextTokens: 4096,
    tier: "limited",
    supportedBackends: ["metal", "cuda", "vulkan", "cpu"],
    modelUri: "hf:bartowski/Qwen2.5-3B-Instruct-GGUF:Qwen2.5-3B-Instruct-Q4_K_M.gguf",
    capabilitySummary: "A lightweight text assistant for everyday questions and short tasks. It prioritizes speed and lower memory use over deep reasoning.",
    capabilities: ["Questions and explanations", "Writing and rewriting", "Summaries", "Basic coding assistance", "Multilingual text"],
    limitations: ["Can make mistakes or invent facts", "Weaker on complex reasoning and long code", "No live web knowledge while offline", "Text only in this configuration"]
  },
  {
    id: "qwen2.5-7b-q4",
    name: "Qwen 2.5 7B Instruct",
    family: "Qwen 2.5",
    parameterCount: "7B",
    quantization: "Q4_K_M",
    downloadBytes: Math.round(4.7 * GB),
    requiredMemoryBytes: 8 * GB,
    minimumContextTokens: 8192,
    tier: "standard",
    supportedBackends: ["metal", "cuda", "vulkan", "cpu"],
    modelUri: "hf:bartowski/Qwen2.5-7B-Instruct-GGUF:Qwen2.5-7B-Instruct-Q4_K_M.gguf",
    capabilitySummary: "A balanced general-purpose text assistant with stronger instruction following, writing, coding, mathematics, and structured answers than the smaller model.",
    capabilities: ["Questions and explanations", "Writing and rewriting", "Coding assistance", "Math and logical problem solving", "Summaries and structured output", "Multilingual text"],
    limitations: ["Can make mistakes or invent facts", "No live web knowledge while offline", "Not a substitute for professional advice", "Text only in this configuration"]
  },
  {
    id: "qwen2.5-14b-q4",
    name: "Qwen 2.5 14B Instruct",
    family: "Qwen 2.5",
    parameterCount: "14B",
    quantization: "Q4_K_M",
    downloadBytes: Math.round(9 * GB),
    requiredMemoryBytes: 14 * GB,
    minimumContextTokens: 8192,
    tier: "performance",
    supportedBackends: ["metal", "cuda", "vulkan", "cpu"],
    modelUri: "hf:bartowski/Qwen2.5-14B-Instruct-GGUF:Qwen2.5-14B-Instruct-Q4_K_M.gguf",
    capabilitySummary: "A higher-quality local text assistant for more demanding writing, coding, analysis, mathematics, and multi-step instructions, with a higher memory cost.",
    capabilities: ["Detailed questions and explanations", "Long-form writing and rewriting", "Coding assistance", "Math and multi-step reasoning", "Summaries and structured output", "Multilingual text"],
    limitations: ["Can make mistakes or invent facts", "Slower than smaller models, especially on CPU", "No live web knowledge while offline", "Text only in this configuration"]
  }
];
