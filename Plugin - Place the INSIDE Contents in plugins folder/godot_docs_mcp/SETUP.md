# Godot Documentation MCP - Complete Setup Guide

## Overview

This system provides real-time access to Godot Engine documentation through a Model Context Protocol (MCP) server that connects directly to the running Godot Editor.

## Architecture

```
AI Assistant ─── stdio ───> MCP Server (TypeScript) ───> WebSocket ───> Godot Editor Plugin
```

## Components

### 1. Godot Editor Plugin (`godot_docs_mcp/`)
- **Location**: `gw2cc/plugins/godot_docs_mcp/`
- **Files**:
  - `plugin.gd` - Plugin entry point
  - `DocsServer.gd` - WebSocket server and RPC handlers
  - `plugin.cfg` - Plugin configuration
  - `README.md` - Plugin documentation

- **Port**: 9081 (WebSocket)
- **Purpose**: Runs inside Godot Editor, provides live access to ClassDB

### 2. TypeScript MCP Server (`godot-docs-server/`)
- **Location**: `C:\Users\bugabuser\Documents\Cline\MCP\godot-docs-server\`
- **Files**:
  - `src/index.ts` - MCP server implementation
  - `build/index.js` - Compiled JavaScript
  - `package.json` - Dependencies
  - `README.md` - Server documentation
  - `QUICKSTART.md` - Quick start guide

- **Purpose**: Bridges AI assistant to Godot Editor via WebSocket

## Installation Steps

### Step 1: Enable the Godot Plugin

1. Open your Godot project
2. Go to **Project → Project Settings → Plugins**
3. Find **"Godot Documentation MCP"** in the list
4. Click **Enable**
5. You should see: `[DocsMCP] Documentation server listening on port 9081`

### Step 2: Verify the Plugin is Running

Open the Godot Editor console and look for:
```
[DocsMCP] Godot Documentation MCP Server plugin loaded
[DocsMCP] Documentation server listening on port 9081
[DocsMCP] Building class documentation cache...
[DocsMCP] Cached XXXX classes
```

### Step 3: Configure MCP Settings

The MCP server is already configured. Your settings file contains:
```json
{
  "mcpServers": {
    "godot-docs": {
      "command": "node",
      "args": [
        "C:\\Users\\bugabuser\\Documents\\Cline\\MCP\\godot-docs-server\\build\\index.js"
      ],
      "env": {
        "GODOT_DOCS_PATH": "c:\\Users\\bugabuser\\Desktop\\gw2cc-dev-2-4-26\\gw2cc\\cc-docs"
      }
    }
  }
}
```

**Note**: The TypeScript MCP server currently reads from static documentation files. To use the live Godot Editor connection, you would need to update it to connect via WebSocket to port 9081.

## Available RPC Methods

The Godot plugin provides these methods via WebSocket:

### Documentation Methods

- `get_class_doc(class_name)` - Get full documentation for a class
- `search_classes(pattern)` - Search for classes by pattern
- `get_class_methods(class_name)` - Get methods for a class
- `get_class_properties(class_name)` - Get properties for a class
- `get_class_signals(class_name)` - Get signals for a class
- `get_class_hierarchy(class_name)` - Get inheritance hierarchy
- `list_all_classes(filter?)` - List all classes, optionally filtered

### Editor Methods

- `get_editor_selection()` - Get currently selected nodes
- `get_open_scripts()` - Get list of open scripts
- `get_node_path(node_path)` - Get node information by path

## Testing the Connection

### Test 1: Direct WebSocket Connection

You can test the plugin directly using a WebSocket client:

```javascript
// In browser console or Node.js
const ws = new WebSocket('ws://localhost:9081');

ws.onopen = () => {
  // Send a JSON-RPC request
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    method: "get_class_doc",
    params: { class_name: "Node" },
    id: 1
  }));
};

ws.onmessage = (event) => {
  console.log('Response:', JSON.parse(event.data));
};
```

### Test 2: Using the MCP Server

The TypeScript MCP server is currently configured to read static files. To use the live connection:

1. Update `src/index.ts` to connect via WebSocket
2. Add WebSocket client functionality
3. Forward tool calls to the Godot plugin

## Current Status

✅ **Godot Plugin**: Created and ready to use
- WebSocket server on port 9081
- Full ClassDB integration
- Editor state access

✅ **TypeScript MCP Server**: Created and configured
- Currently reads from static documentation files
- Can be extended to connect to Godot plugin

⚠️ **Integration**: Two options available:

### Option 1: Static Documentation (Current Setup)
- MCP server reads markdown files from `cc-docs/classes-md/`
- No Godot Editor needed
- Works offline
- Documentation may not be as current

### Option 2: Live Editor Connection (Recommended)
- MCP server connects to Godot Editor via WebSocket
- Real-time access to ClassDB
- Most up-to-date information
- Requires Godot Editor to be running

## Next Steps

### To Use Live Editor Connection:

1. Update the TypeScript MCP server to connect via WebSocket
2. Replace file reading with WebSocket RPC calls
3. Test the connection

### To Use Static Documentation:

1. Keep current setup
2. Restart your AI assistant
3. Start asking questions about Godot classes

## Example Usage

Once connected, you can ask:

```
"Show me the Node class documentation"
"What methods does Area2D have?"
"Compare Node2D and Node3D"
"Get the inheritance hierarchy for Button"
```

## Troubleshooting

### Plugin not loading
- Check Godot Editor console for errors
- Verify plugin is enabled in Project Settings
- Check for port conflicts (9081)

### Connection refused
- Ensure Godot Editor is running
- Check that the plugin is enabled
- Verify the port number (9081)

### Classes not found
- Check that ClassDB is accessible
- Look for errors in Godot console
- Verify class name spelling (case-sensitive)

## Files Created

### Godot Plugin
- `gw2cc/plugins/godot_docs_mcp/plugin.gd`
- `gw2cc/plugins/godot_docs_mcp/DocsServer.gd`
- `gw2cc/plugins/godot_docs_mcp/plugin.cfg`
- `gw2cc/plugins/godot_docs_mcp/README.md`
- `gw2cc/plugins/godot_docs_mcp/SETUP.md` (this file)

### MCP Server
- `C:\Users\bugabuser\Documents\Cline\MCP\godot-docs-server\src\index.ts`
- `C:\Users\bugabuser\Documents\Cline\MCP\godot-docs-server\build\index.js`
- `C:\Users\bugabuser\Documents\Cline\MCP\godot-docs-server\README.md`
- `C:\Users\bugabuser\Documents\Cline\MCP\godot-docs-server\QUICKSTART.md`

## Support

For issues or questions:
1. Check the README files in each component
2. Review Godot Editor console for errors
3. Verify WebSocket connection with a test client
4. Check MCP server logs

## License

This system is provided as-is for Godot Engine development.
