import asyncio
from websockets import serve
from flask import Flask

from flask_svelte import render_template

app = Flask(__name__)

async def test(websocket): 
    await websocket.recv()
    websocket.send("test")

async def main(): 
    async with serve(test, "localhost", 5000) as server: 
        await server.serve_forever()

@app.route("/")
def index():
    asyncio.run(main())
    return render_template("index.html", name="Vigil")