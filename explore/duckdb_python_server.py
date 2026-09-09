"""Start DuckDB as an in-process database with HTTP interface"""
import duckdb
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# In-memory database
db = duckdb.connect(":memory:")

class DuckDBHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        
        if parsed.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
            return
            
        if parsed.path == "/query":
            sql = params.get("sql", [""])[0]
            if not sql:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing sql parameter"}).encode())
                return
            
            self._execute_query(sql)
            return
        
        self.send_response(404)
        self.end_headers()
    
    def do_POST(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/query":
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            sql = data.get("sql", "")
            
            if not sql:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing sql in body"}).encode())
                return
            
            self._execute_query(sql)
            return
        
        self.send_response(404)
        self.end_headers()
    
    def _execute_query(self, sql: str):
        try:
            result = db.execute(sql).fetchall()
            columns = [desc[0] for desc in db.description] if db.description else []
            
            def serialize_value(v):
                if v is None:
                    return None
                elif hasattr(v, 'isoformat'):
                    return v.isoformat()
                elif isinstance(v, (list, tuple)):
                    return [serialize_value(item) for item in v]
                elif isinstance(v, dict):
                    return {k: serialize_value(val) for k, val in v.items()}
                return v
            
            rows = [dict(zip(columns, [serialize_value(val) for val in row])) for row in result]
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"columns": columns, "rows": rows}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def log_message(self, format, *args):
        pass  # Suppress logs

server = HTTPServer(("127.0.0.1", 9876), DuckDBHandler)
print("DuckDB HTTP server running on http://127.0.0.1:9876")
server.serve_forever()
