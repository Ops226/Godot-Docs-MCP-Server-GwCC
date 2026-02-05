# Godot Documentation MCP - Live Connection Setup


##  Configuration Details
```json
{
  "mcpServers": {
    "godot-docs": {
      "command": "node",
      "args": [
        "C:\\Users\\UserName\\Documents\\Cline\\MCP\\godot-docs-server\\build\\index-live.js"
      ],
      "env": {
        "GODOT_WS_URL": "ws://localhost:9081"
      }
    }
  }
}
```

## How to Use

### Step 1: Start Godot Editor
1. Open your Godot project (`gw2cc`)
2. The `godot_docs_mcp` plugin should load automatically
3. You should see in the Godot console:
   ```
   [DocsMCP] Documentation server listening on port 9081
   [DocsMCP] Cached 1504 classes
   ```

### Step 2: Restart Cline
1. Close and reopen Cline/Windsurf
2. The MCP server will automatically connect to Godot
3. You'll see: `✓ Connected to Godot Documentation Server`

### Step 3: Ask Questions!
Now you can ask Cline questions about Godot classes:

**Examples:**
- "Show me the Node class documentation"
- "What methods does Area2D have?"
- "Search for all classes containing 'Button'"
- "Get the inheritance hierarchy for Label"
- "What properties does Control have?"
- "List all signals that Node emits"

## Available Tools

The MCP server provides these tools to Cline:

1. **get_class_doc** - Get full documentation for a Godot class
2. **search_classes** - Search for classes by name pattern
3. **get_class_methods** - Get list of methods for a class
4. **get_class_properties** - Get list of properties for a class
5. **get_class_signals** - Get list of signals for a class
6. **get_class_hierarchy** - Get inheritance hierarchy
7. **list_all_classes** - List all available classes (1504 total)

## Benefits of Live Connection

✅ **Real-time Data**: Direct access to Godot's ClassDB
✅ **Always Current**: No need to update documentation files
✅ **Complete Coverage**: All 1504 classes available
✅ **Fast Performance**: Direct WebSocket connection
✅ **Editor Integration**: Access to live Godot Editor state

## Troubleshooting

### Connection Refused
**Problem**: MCP server can't connect to Godot
**Solution**: 
- Make sure Godot Editor is running
- Check that the plugin is enabled
- Verify port 9081 is not blocked

### Classes Not Found
**Problem**: Queries return no results
**Solution**:
- Check Godot console for errors
- Verify plugin loaded successfully
- Try restarting Godot Editor

### MCP Server Not Starting
**Problem**: Cline doesn't show the godot-docs tools
**Solution**:
- Verify `index-live.js` exists in the build directory
- Check that Node.js is installed
- Restart Cline/Windsurf

##  File Locations

**Godot Plugin**:
- `gw2cc/plugins/godot_docs_mcp/DocsServer.gd`
- `gw2cc/plugins/godot_docs_mcp/Ingame.gd`
- `gw2cc/plugins/godot_docs_mcp/Ingame.tscn`

**MCP Server**:
- `C:\Users\UserName\Documents\Cline\MCP\godot-docs-server\src\index-live.ts`
- `C:\Users\UserName\Documents\Cline\MCP\godot-docs-server\build\index-live.js`

**Configuration**:
- `C:\Users\UserName\AppData\Roaming\Windsurf - Next\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`

##  Testing the Connection

You can test the connection manually:

```python
# test_connection.py
import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:9081"
    async with websockets.connect(uri) as ws:
        request = {
            "jsonrpc": "2.0",
            "method": "get_class_list",
            "id": 1
        }
        await ws.send(json.dumps(request))
        response = await ws.recv()
        result = json.loads(response)
        print(f"Found {result['result']['count']} classes")

asyncio.run(test())
```

## You're All Set!

The live connection is now configured and ready to use. Just start Godot Editor and restart Cline to begin querying Godot's class documentation in real-time!
