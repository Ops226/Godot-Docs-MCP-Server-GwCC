## Godot Documentation Server
## Provides documentation access via JSON-RPC over WebSocket

extends Node

const PORT = 9081

var _tcp_server = TCPServer.new()
var _clients = {}
var _next_client_id = 1
var _rpc = JSONRPC.new()

var _class_cache = {}
var _class_list = []

func _ready():
	_register_methods()
	_start_server()
	_build_class_cache()

func _process(_delta):
	_accept_new_connections()
	_process_clients()

func _start_server():
	var err = _tcp_server.listen(PORT)
	if err != OK:
		push_error("[DocsMCP] Failed to start server on port " + str(PORT))
		set_process(false)
		return
	print("[DocsMCP] Documentation server listening on port " + str(PORT))

func _accept_new_connections():
	while _tcp_server.is_connection_available():
		var client_id = _next_client_id
		_next_client_id += 1
		
		var ws = WebSocketPeer.new()
		ws.accept_stream(_tcp_server.take_connection())
		_clients[client_id] = ws
		print("[DocsMCP] Client " + str(client_id) + " connected")

func _process_clients():
	for client_id in _clients.keys():
		var client = _clients[client_id]
		client.poll()
		
		if client.get_ready_state() == WebSocketPeer.STATE_OPEN:
			_handle_client_packets(client_id, client)
		elif client.get_ready_state() == WebSocketPeer.STATE_CLOSED:
			_handle_client_disconnect(client_id, client)

func _handle_client_packets(client_id, client):
	while client.get_available_packet_count() > 0:
		var packet = client.get_packet()
		if not client.was_string_packet():
			continue
		
		var request_json = packet.get_string_from_utf8()
		print("[DocsMCP] < Client " + str(client_id) + ": " + request_json)
		
		var response_json = _rpc.process_string(request_json)
		print("[DocsMCP] > Client " + str(client_id) + ": " + response_json)
		
		if not response_json.is_empty():
			client.send_text(response_json)

func _handle_client_disconnect(client_id, client):
	var code = client.get_close_code()
	var reason = client.get_close_reason()
	print("[DocsMCP] Client " + str(client_id) + " disconnected")
	_clients.erase(client_id)

func _register_methods():
	_rpc.set_method("get_class_doc", _rpc_get_class_doc.bind())
	_rpc.set_method("search_classes", _rpc_search_classes.bind())
	_rpc.set_method("get_class_methods", _rpc_get_class_methods.bind())
	_rpc.set_method("get_class_properties", _rpc_get_class_properties.bind())
	_rpc.set_method("get_class_signals", _rpc_get_class_signals.bind())
	_rpc.set_method("get_class_hierarchy", _rpc_get_class_hierarchy.bind())
	_rpc.set_method("list_all_classes", _rpc_list_all_classes.bind())
	_rpc.set_method("get_class_list", _rpc_get_class_list.bind())

func _build_class_cache():
	print("[DocsMCP] Building class documentation cache...")
	_class_list = ClassDB.get_class_list()
	_class_list.sort()
	print("[DocsMCP] Cached " + str(_class_list.size()) + " classes")

func _rpc_get_class_doc(p_class_name):
	if p_class_name == null or p_class_name.is_empty():
		return {"error": "class_name parameter is required"}
	
	if not ClassDB.class_exists(p_class_name):
		return {"error": "Class '" + p_class_name + "' not found"}
	
	var doc = {}
	doc["name"] = p_class_name
	doc["inherits"] = ClassDB.get_parent_class(p_class_name)
	doc["properties"] = []
	doc["methods"] = []
	doc["signals"] = []
	doc["constants"] = []
	
	return doc

func _rpc_search_classes(pattern):
	if pattern == null or pattern.is_empty():
		return {"error": "pattern parameter is required"}
	
	var results = []
	for cls in _class_list:
		if pattern.to_lower() in cls.to_lower():
			results.append(cls)
	
	return {"pattern": pattern, "results": results}

func _rpc_get_class_methods(p_class_name):
	if p_class_name == null or p_class_name.is_empty():
		return {"error": "class_name parameter is required"}
	
	if not ClassDB.class_exists(p_class_name):
		return {"error": "Class '" + p_class_name + "' not found"}
	
	var method_list = ClassDB.class_get_method_list(p_class_name, true)
	return {"class_name": p_class_name, "methods": method_list}

func _rpc_get_class_properties(p_class_name):
	if p_class_name == null or p_class_name.is_empty():
		return {"error": "class_name parameter is required"}
	
	if not ClassDB.class_exists(p_class_name):
		return {"error": "Class '" + p_class_name + "' not found"}
	
	var property_list = ClassDB.class_get_property_list(p_class_name, true)
	return {"class_name": p_class_name, "properties": property_list}

func _rpc_get_class_signals(p_class_name):
	if p_class_name == null or p_class_name.is_empty():
		return {"error": "class_name parameter is required"}
	
	if not ClassDB.class_exists(p_class_name):
		return {"error": "Class '" + p_class_name + "' not found"}
	
	var signal_list = ClassDB.class_get_signal_list(p_class_name, true)
	return {"class_name": p_class_name, "signals": signal_list}

func _rpc_get_class_hierarchy(p_class_name):
	if p_class_name == null or p_class_name.is_empty():
		return {"error": "class_name parameter is required"}
	
	if not ClassDB.class_exists(p_class_name):
		return {"error": "Class '" + p_class_name + "' not found"}
	
	var hierarchy = [p_class_name]
	var current = p_class_name
	
	while current != "":
		var parent = ClassDB.get_parent_class(current)
		if parent.is_empty() or parent == current:
			break
		hierarchy.append(parent)
		current = parent
	
	hierarchy.reverse()
	return {"class_name": p_class_name, "hierarchy": hierarchy}

func _rpc_list_all_classes(filter = ""):
	if filter == null or filter.is_empty():
		return {"classes": _class_list, "count": _class_list.size()}
	
	var results = []
	for cls in _class_list:
		if filter.to_lower() in cls.to_lower():
			results.append(cls)
	
	return {"filter": filter, "classes": results, "count": results.size()}

func _rpc_get_class_list():
	return {"classes": _class_list, "count": _class_list.size()}
