"""
run.py — Application entry point
----------------------------------
Run this file to start the development server:
    python run.py

The Flask dev server will be available at http://localhost:5000
"""

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        # use_reloader=True reloads the server on source file changes
        use_reloader=True,
    )
