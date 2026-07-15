import http.server
import socketserver
import webbrowser
import threading
import os
import sys
import time

# Host on port 8000
PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

class DualStackServer(socketserver.TCPServer):
    allow_reuse_address = True

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    try:
        with DualStackServer(("", PORT), Handler) as httpd:
            print(f"\n[Python Server] Serving Arcane Cards at:")
            print(f"  Local:   http://localhost:{PORT}/")
            # Attempt to show network address
            import socket
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                ip = s.getsockname()[0]
                print(f"  Network: http://{ip}:{PORT}/")
                s.close()
            except Exception:
                pass
            print("\nPress Ctrl+C to shutdown.")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == "__main__":
    # Ensure build files exist, if not, try to build them
    if not os.path.exists(DIRECTORY):
        print("Build folder not found. Attempting to build production files...")
        os.system("npm run build")
        
        # Check again
        if not os.path.exists(DIRECTORY):
            print("\n[Error] Could not find or build the production folder ('dist').")
            print("Please run 'npm install' and 'npm run build' first.")
            input("\nPress Enter to exit...")
            sys.exit(1)

    # Start server in a separate background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait a moment for server initialization
    time.sleep(1)

    # Open web browser automatically
    print("Launching browser...")
    webbrowser.open(f"http://localhost:{PORT}")

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down server.")
        sys.exit(0)
