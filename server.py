import http.server
import socketserver
import socket
import webbrowser
import sys
import os

# Configuration
PORT = 8000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def get_local_ip():
    try:
        # Connect to an external server (doesn't send data) to get the local IP used for routing
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

def run_server():
    # Change to the script's directory to serve files correctly
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    local_ip = get_local_ip()
    url = f"http://{local_ip}:{PORT}"
    
    print(f"Starting Presidency Software Portal...")
    print(f"----------------------------------------")
    print(f"Local Access:   http://localhost:{PORT}")
    print(f"Network Access: {url}")
    print(f"----------------------------------------")
    print("Press Ctrl+C to stop the server.")

    # Try to open the browser automatically
    try:
        webbrowser.open(url)
    except:
        pass

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 48: # Address already in use
            print(f"Error: Port {PORT} is already in use.")
            print("Please close any other running servers or try again later.")
        else:
            print(f"Error starting server: {e}")
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    run_server()
