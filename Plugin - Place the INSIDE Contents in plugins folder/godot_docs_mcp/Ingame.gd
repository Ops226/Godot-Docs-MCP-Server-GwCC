extends PluginButton
const PLUGIN_NAME = preload("MetaInfo.tres").product_name

var _server: Node

func _ready() -> void:
	# Load and initialize the documentation server
	_server = load("res://plugins/godot_docs_mcp/DocsServer.gd").new()
	add_child(_server)
	super()
	print("[DocsMCP] Plugin initialized - Documentation server running on port 9081")
