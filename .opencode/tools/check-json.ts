import { tool } from "@opencode-ai/plugin"
import { readFileSync } from "fs"
import path from "path"

export default tool({
  description: "Проверить синтаксис JSON файла",
  args: {
    file: tool.schema.string().describe("Путь к JSON файлу"),
  },
  async execute(args, context) {
    const filePath = path.resolve(context.worktree, args.file)
    try {
      JSON.parse(readFileSync(filePath, "utf-8"))
      return `✓ JSON валиден: ${args.file}`
    } catch (error) {
      throw new Error(`✗ Ошибка в ${args.file}: ${error instanceof Error ? error.message : String(error)}`)
    }
  },
})
