
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Mcp-Session-Id", "Mcp-Protocol-Version", "Last-Event-ID"],
  exposedHeaders: ["Mcp-Session-Id", "Mcp-Protocol-Version"],
}));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Ripple MCP Server",
  });
});

function createMcpServer() {
  const server = new McpServer({
    name: "ripple-recovery-assistant",
    version: "1.0.0",
  });

  server.tool(
    "evaluate_recovery_strategy",
    "Evaluate a project recovery strategy against Ripple's deadline and ownership rules.",
    {
      strategyName: z.enum([
        "Balanced recovery",
        "Deadline-first recovery",
        "Minimal-change recovery",
      ]),
      evaluationDay: z.number().int().min(1).max(30),
      presentationDay: z.number().int().min(1).max(30),
      owner: z.string(),
    },
    async ({ strategyName, evaluationDay, presentationDay, owner }) => {
      const issues: string[] = [];

      if (presentationDay > 7) {
        issues.push("Presentation exceeds the Day 7 deadline.");
      }

      if (evaluationDay >= presentationDay) {
        issues.push("Evaluation must happen before presentation.");
      }

      if (!owner.trim()) {
        issues.push("An evaluation owner is required.");
      }

      const scores = {
        "Balanced recovery": 100,
        "Deadline-first recovery": 80,
        "Minimal-change recovery": 20,
      };

      const result = {
        strategy: strategyName,
        score: scores[strategyName],
        valid: issues.length === 0,
        evaluationDay,
        presentationDay,
        owner: owner.trim(),
        issues,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    }
  );

  return server;
}

app.post("/mcp", async (req, res) => {
  const server = createMcpServer();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Ripple server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
