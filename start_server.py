import subprocess
import sys
import time
import os
import webbrowser

def main():
    print("=" * 60)
    print("  Interactive DNA Mutation Severity Sandbox - Server Launcher")
    print("=" * 60)
    
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    print("\n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=root_dir)
    
    time.sleep(2)
    
    print("[2/2] Starting Vite Frontend on http://127.0.0.1:5173 ...")
    npx_cmd = "npx.cmd" if os.name == 'nt' else "npx"
    frontend_cmd = [npx_cmd, "vite", "--host", "127.0.0.1", "--port", "5173"]
    frontend_proc = subprocess.Popen(frontend_cmd, cwd=frontend_dir)
    
    print("\n" + "=" * 60)
    print("  STABLE APPLICATION LINKS:")
    print("  - Web App Interface:  http://127.0.0.1:5173")
    print("  - Backend API:        http://127.0.0.1:8000")
    print("  - Interactive Docs:   http://127.0.0.1:8000/docs")
    print("=" * 60)
    print("\nPress Ctrl+C to stop both servers.\n")
    
    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == "__main__":
    main()
