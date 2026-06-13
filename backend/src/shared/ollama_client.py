import logging
from ollama import AsyncClient
from src.core.config import settings

logger = logging.getLogger(__name__)

ollama_client = AsyncClient(host=settings.OLLAMA_HOST)

resolved_model_cache = None

async def resolve_local_model(default_model: str = "llama3") -> str:
    global resolved_model_cache
    if resolved_model_cache is not None:
        return resolved_model_cache

    try:
        models_response = await ollama_client.list()
        available_models = []
        for m in models_response.get('models', []):
            name = m.get('name') or m.get('model')
            if name:
                available_models.append(name)
        
        if available_models:
            for m in available_models:
                if default_model in m:
                    resolved_model_cache = m
                    logger.info(f"[OBSERVABILITY] Resolved default Ollama model: {resolved_model_cache}")
                    return resolved_model_cache
            
            resolved_model_cache = available_models[0]
            logger.warning(f"[OBSERVABILITY] Model '{default_model}' not found in local Ollama list {available_models}. Dynamic fallback selected: '{resolved_model_cache}'")
            return resolved_model_cache
    except Exception as e:
        logger.error(f"[OBSERVABILITY] Failed to query Ollama list endpoint: {str(e)}. Defaulting to: {default_model}")
        
    resolved_model_cache = default_model
    return default_model

async def generate_completion(prompt: str, model: str = "llama3", format="json") -> str:
    active_model = await resolve_local_model(model)
    print(f"[OBSERVABILITY] Invoking Ollama model: '{active_model}' dynamically...")
    response = await ollama_client.generate(model=active_model, prompt=prompt, format=format)
    return response['response']

async def get_embeddings(text: str, model: str = "nomic-embed-text") -> list[float]:
    active_model = model
    try:
        models_response = await ollama_client.list()
        available_models = []
        for m in models_response.get('models', []):
            name = m.get('name') or m.get('model')
            if name:
                available_models.append(name)
                
        found = False
        for m in available_models:
            if "embed" in m:
                active_model = m
                found = True
                break
        if not found and available_models:
            active_model = available_models[0]
    except Exception:
        pass
        
    response = await ollama_client.embeddings(model=active_model, prompt=text)
    return response['embedding']
