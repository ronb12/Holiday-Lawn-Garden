import http.server
import socketserver
import os
import webbrowser
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
import threading

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache control headers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

class FileChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(('.html', '.css', '.js')):
            print(f"\nFile changed: {event.src_path}")
            print("Changes detected. Please refresh your browser to see updates.")

def start_server():
    handler = CustomHTTPRequestHandler
    handler.directory = DIRECTORY
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"\nServer started at http://localhost:{PORT}")
        print("Press Ctrl+C to stop the server")
        print("\nWatching for file changes...")
        httpd.serve_forever()

def main():
    # Start the server in a separate thread
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # Set up file monitoring
    event_handler = FileChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, DIRECTORY, recursive=True)
    observer.start()
    
    # Open the browser
    webbrowser.open(f'http://localhost:{PORT}')
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\nServer stopped")
    
    observer.join()

if __name__ == "__main__":
    main() 