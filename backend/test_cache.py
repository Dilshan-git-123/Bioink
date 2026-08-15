from knowledge_engine.cache import cache

cache.set("alginate", {"Material": "Alginate"})

print("Exists:", cache.exists("alginate"))

print("Value:", cache.get("alginate"))

print("Cache Size:", cache.size())

cache.remove("alginate")

print("Exists After Remove:", cache.exists("alginate"))

cache.clear()

print("Cache Size After Clear:", cache.size())