"use server"

import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import mammoth from "mammoth"
import { PDFParse } from "pdf-parse"

const MAX_SOURCE_CHARS = 80_000

export async function digestKnowledgeBase(formData: FormData): Promise<string> {
  const notes = String(formData.get("notes") || "").trim()
  const files = formData.getAll("files").filter((file): file is File => file instanceof File && file.size > 0)
  const extractedSources: string[] = []

  if (notes) {
    extractedSources.push(`# Manual Notes\n\n${notes}`)
  }

  for (const file of files) {
    const text = await extractFileText(file)
    if (text.trim()) {
      extractedSources.push(`# ${file.name}\n\n${text}`)
    }
  }

  const sourceText = extractedSources.join("\n\n---\n\n").slice(0, MAX_SOURCE_CHARS)

  if (!sourceText.trim()) {
    throw new Error("Add text or upload at least one readable file first.")
  }

  const { text } = await generateText({
    model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
    temperature: 0.2,
    prompt: `Create a concise Markdown company knowledge base for sales battle-card generation.

The output must be a clean .md profile that another AI can use quickly without reading the raw source files.

Use this structure:
# Company Profile
## What We Sell
## Ideal Customers
## Core Value Proposition
## Differentiators
## Proof Points
## Pricing Or Commercial Notes
## Common Customer Pain Points We Solve
## Common Objections And Responses
## Tone And Messaging
## Do Not Claim

Rules:
- Keep it factual and useful for sales strategy.
- Preserve specific names, products, numbers, prices, case studies, and proof points if provided.
- Do not invent facts.
- If a section has no source evidence, write "Not specified."
- Return only Markdown.

Source material:
${sourceText}`,
  })

  return text.trim()
}

async function extractFileText(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase()
  const buffer = Buffer.from(await file.arrayBuffer())

  if (extension === "txt" || extension === "md" || file.type.startsWith("text/")) {
    return buffer.toString("utf8")
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (extension === "pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    try {
      const result = await parser.getText()
      return result.text
    } finally {
      await parser.destroy()
    }
  }

  throw new Error(`${file.name} is not supported. Upload PDF, DOCX, Markdown, or TXT files.`)
}
