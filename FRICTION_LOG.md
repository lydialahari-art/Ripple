**Task attempted:** 
Connect the Ripple React frontend to a deployed MCP backend and evaluate project recovery strategies.

**Steps taken:**
1. Built the React and TypeScript frontend and the Node.js/Express MCP server.
2. Configured the `evaluate_recovery_strategy` tool using the MCP SDK and Streamable HTTP.
3. Deployed the backend on Render and tested the health endpoint, MCP initialization, tool discovery, and tool execution using PowerShell.
4. Connected the frontend to the backend and handled structured MCP responses and validation errors.
5. Tested recovery scenarios to verify that deadline violations were reported in the interface.

**Expected result:** 
The frontend should communicate reliably with the deployed MCP server, receive structured evaluation results, and display scores and validation messages correctly.

**Actual result:** 
The integration required additional debugging to handle structured responses and validation errors correctly. Build and deployment testing also required several iterations before the frontend and backend worked together as expected.

**Severity:** 
Moderate — these issues delayed integration and testing but were resolved sufficiently to demonstrate the core workflow.

**Workaround used:** 
Tested the backend independently through its health endpoint and MCP protocol requests in PowerShell, corrected response handling in the frontend, and rebuilt and redeployed the application.

**Actionable suggestion:** 
Provide a beginner-friendly end-to-end example showing how to connect a React frontend to a deployed MCP server using Streamable HTTP, including protocol initialization, tool discovery, structured response handling, error handling, and deployment troubleshooting. Clearer examples of frontend integration and production deployment would reduce debugging time for developers building their first MCP application.
