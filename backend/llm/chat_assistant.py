import logging
from llm.gemini_client import _get_client

logger = logging.getLogger(__name__)

def generate_chat_response(messages: list, db_context: dict) -> str:
    """
    Generates a chat response using Gemini, injecting the database context.
    messages: list of dicts [{"role": "user"|"ai", "text": "..."}]
    db_context: dict with "projects" and "experiments"
    """
    client = _get_client()
    if not client:
        return "Sorry, the AI is currently unavailable. Please verify the GEMINI_API_KEY."
        
    system_prompt = "You are BioInkAI Research Assistant, an AI expert in bio-fabrication, 3D bioprinting, and biomaterials.\n"
    system_prompt += "Here is the user's current workspace data:\n"
    
    projects = db_context.get("projects", [])
    if projects:
        system_prompt += "Recent Projects:\n"
        # Reverse to show newest first, limit to 50
        for p in list(reversed(projects))[:50]: 
            system_prompt += f"- Project: {p.get('name')} | Tissue: {p.get('tissue_type')} | Status: {p.get('status')}\n"
            
    experiments = db_context.get("experiments", [])
    if experiments:
        system_prompt += "Recent Experiments (Predictions & Protocols):\n"
        for e in list(reversed(experiments))[:50]:
            system_prompt += f"- Name: {e.get('name')} | Tissue: {e.get('tissue')} | Formulations: {e.get('materials')}\n"
            
    system_prompt += "\nAnswer the user's questions based on this context and your domain knowledge. Keep it professional, concise, and helpful. Format your responses with markdown when appropriate (e.g., bullet points, bold text).\n"
    
    # Build a simple unified prompt
    prompt = system_prompt + "\n\nConversation History:\n"
    
    # We only take the last 6 messages to keep context window manageable and focused
    recent_messages = messages[-6:] if len(messages) > 6 else messages
    
    for msg in recent_messages:
        role = "User" if msg.get("role") == "user" else "BioInkAI"
        prompt += f"{role}: {msg.get('text')}\n\n"
        
    prompt += "BioInkAI:"
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = getattr(response, "text", None)
        if not text:
            return "I'm having trouble processing that right now."
        return str(text).strip()
    except Exception as exc:
        logger.error(f"[Chat Assistant] Failed: {exc}")
        return "Sorry, I encountered an error while communicating with the AI model."
