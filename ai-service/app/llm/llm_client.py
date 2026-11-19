import json
import re
import asyncio
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from ..config import settings

def extract_json(text: str) -> Optional[Any]:
    """Robustly extract and parse JSON from LLM text responses, handling code blocks and prose."""
    if not text:
        return None
    cleaned = text.strip()
    
    # Strip markdown code blocks like ```json ... ```
    if "```" in cleaned:
        pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
        match = re.search(pattern, cleaned, re.IGNORECASE)
        if match:
            cleaned = match.group(1).strip()
            
    try:
        return json.loads(cleaned)
    except Exception:
        # Fallback regex search for outermost { ... } or [ ... ]
        curly = re.search(r"(\{[\s\S]*\})", cleaned)
        if curly:
            try:
                return json.loads(curly.group(1))
            except Exception:
                pass
        bracket = re.search(r"(\[[\s\S]*\])", cleaned)
        if bracket:
            try:
                return json.loads(bracket.group(1))
            except Exception:
                pass
    return None

def _sync_gemini_call(model_name: str, key: str, prompt: str, system_prompt: str, json_mode: bool = False) -> Optional[str]:
    """Synchronous reliable call using standard Windows WinSock socket stack with zero thinking budget for max speed."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
    
    gen_config = {
        "temperature": 0.1,
        "maxOutputTokens": 4096,
        "thinkingConfig": {
            "thinkingBudget": 0
        }
    }
    if json_mode:
        gen_config["responseMimeType"] = "application/json"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system_prompt}\n\n{prompt}"}]
            }
        ],
        "generationConfig": gen_config
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20.0) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            candidates = body.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                text_pieces = [p.get("text", "") for p in parts if "text" in p]
                text = "".join(text_pieces).strip()
                if text:
                    print(f"✨ [LLM] Gemini ({model_name}) generated response successfully ({len(text)} chars).")
                    return text
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8', errors='ignore')[:150]
        print(f"[LLM] Gemini HTTP Error {e.code} for {model_name}: {err_msg}")
    except Exception as e:
        print(f"[LLM] Gemini request error with {model_name}: {e}")
    return None

class LlmClient:
    @staticmethod
    async def generate_completion(prompt: str, system_prompt: str = "You are an expert AI recruiting and resume analysis assistant.", json_mode: bool = False) -> Optional[str]:
        # 1. Try Gemini API if key is available
        if settings.GEMINI_API_KEY:
            models_to_try = [
                "gemini-3-flash-preview",
                "gemini-3.1-flash-lite",
                "gemini-3.5-flash",
                "gemini-3.8-flash",
                "gemini-flash-latest"
            ]
            for model_name in models_to_try:
                res = await asyncio.to_thread(_sync_gemini_call, model_name, settings.GEMINI_API_KEY, prompt, system_prompt, json_mode)
                if res:
                    return res

        return None

    @staticmethod
    async def generate_json(prompt: str, system_prompt: str = "You are an expert AI recruiting assistant. Return valid JSON only.") -> Optional[Any]:
        """Generate structured JSON directly via LLM completion with automatic markdown stripping."""
        text = await LlmClient.generate_completion(prompt, system_prompt, json_mode=True)
        if not text:
            return None
        return extract_json(text)
