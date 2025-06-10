/**
 * MCP (Model Context Protocol) API endpoints
 * Handles communication with MCP servers
 */
import { Router } from 'express';
import { spawn } from 'child_process';

const router = Router();

/**
 * Handle MCP calls to Dodo Payments
 * POST /api/mcp/dodopayments_api
 */
router.post('/dodopayments_api', async (req, res) => {
  try {
    const { function: functionName, args } = req.body;
    
    if (!functionName || !args) {
      return res.status(400).json({ error: 'Function name and args are required' });
    }

    // Extract the actual tool name from the function name (remove mcp1_ prefix)
    const toolName = functionName.replace('mcp1_', '');
    
    // Call the Dodo Payments MCP server directly
    const result = await callDodoPaymentsMCP(toolName, args);
    
    return res.status(200).json({ result });
  } catch (error) {
    console.error('Error in MCP call:', error);
    return res.status(500).json({ 
      error: 'MCP call failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Call Dodo Payments MCP server
 */
async function callDodoPaymentsMCP(toolName: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const mcpProcess = spawn('npx', ['-y', 'dodopayments-mcp', '--client=cursor'], {
      env: {
        ...process.env,
        DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY || 'Y5h-0edhftQ-_aWv.UDaLs-NfZ0DRsjzWCVZztJH_9xCF9UL7dHbe34fZZyDQd6Ij'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    mcpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`MCP process exited with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        // Parse the JSON response from MCP server
        const result = JSON.parse(output);
        resolve(result);
      } catch (parseError) {
        reject(new Error(`Failed to parse MCP response: ${parseError}`));
      }
    });

    mcpProcess.on('error', (error) => {
      reject(new Error(`Failed to start MCP process: ${error.message}`));
    });

    // Send the request to MCP server
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    mcpProcess.stdin.end();
  });
}

export default router;