import httpx
import json
from typing import AsyncGenerator

class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    async def stream_chat(self, model: str, prompt: str) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": True
        }
        
        async with httpx.AsyncClient() as client:
            try:
                async with client.stream("POST", url, json=payload, timeout=None) as response:
                    if response.status_code != 200:
                        yield f"Error: Unable to connect to Ollama. Status: {response.status_code}"
                        return
                    
                    async for chunk in response.aiter_lines():
                        if chunk:
                            try:
                                data = json.loads(chunk)
                                if "response" in data:
                                    yield data["response"]
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                yield f"Error communicating with Ollama: {str(e)}"

ollama_service = OllamaService()
