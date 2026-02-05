# Godot Documentation MCP Plugin

A Godot Editor plugin that provides real-time access to Godot class documentation via the Model Context Protocol (MCP).

## Features

- **Live Documentation Access**: Query Godot class documentation directly from the running editor
- **ClassDB Integration**: Access all registered classes, methods, properties, and signals
- **Editor Integration**: Get information about selected nodes and open scripts
- **WebSocket Server**: JSON-RPC 2.0 over WebSocket for easy integration
- **Real-time Data**: Documentation is retrieved live from the editor, not from static files

## Installation

1. Copy this plugin folder to your Godot project's `plugins/` directory
2. Enable the plugin in Project Settings → Plugins
3. The server will start automatically when the editor opens

## Usage

The plugin starts a WebSocket server on port 9081. Connect to it from your MCP client:

```
ws://localhost:9081
```

## Available RPC Methods

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

## Example Usage

### JSON-RPC Request

```json
{
  "jsonrpc": "2.0",
  "method": "get_class_doc",
  "params": {
    "class_name": "Node"
  },
  "id": 1
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "name": "Node",
    "inherits": "Object",
    "properties": [...],
    "methods": [...],
    "signals": [...],
    "constants": [...]
  },
  "id": 1
}
```

## Architecture

```
Godot Editor → DocsServer.gd → WebSocket → MCP Client → AI Assistant
```

The plugin runs inside the Godot Editor and provides:
1. Real-time access to ClassDB
2. Live editor state information
3. WebSocket server for external connections

## Integration with MCP Server

This plugin is designed to work with the TypeScript MCP server. The MCP server connects to this plugin via WebSocket and forwards documentation requests to the running Godot Editor.

## Troubleshooting

### Server not starting
- Check that port 9081 is not already in use
- Look for error messages in the Godot editor console
- Verify the plugin is enabled in Project Settings

### Connection refused
- Ensure Godot Editor is running
- Check that the plugin is enabled
- Verify the port number (default: 9081)

## Development

To extend this plugin:

1. Add new RPC methods in `_register_methods()`
2. Implement the method function
3. Rebuild the plugin or restart Godot Editor

## License

This plugin is provided as-is for Godot development.
