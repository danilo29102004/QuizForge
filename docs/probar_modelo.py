import json, sys, urllib.request

model = sys.argv[1]
texto = open("docs/texto-prueba.txt", encoding="utf-8").read()
prompt = ("Genera 5 preguntas tipo test sobre el siguiente texto. Responde solo con JSON: "
          '{"questions":[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},'
          '"correct":"A","explanation":"..."}]}. Texto: ' + texto)

body = json.dumps({"model": model, "prompt": prompt, "format": "json", "stream": False}).encode()
req = urllib.request.Request("http://localhost:11434/api/generate", body,
                             {"Content-Type": "application/json"})
r = json.load(urllib.request.urlopen(req, timeout=900))

out = r["response"]
nombre = "docs/salida-" + model.replace(":", "_") + ".json"
open(nombre, "w", encoding="utf-8").write(out)

print("Duración total: %.1f s" % (r["total_duration"] / 1e9))
print("Velocidad: %.2f tokens/s" % (r["eval_count"] / (r["eval_duration"] / 1e9)))

try:
    data = json.loads(out)
except Exception as e:
    sys.exit("JSON inválido: %s" % e)
print("JSON válido; guardado en", nombre)

qs = data.get("questions", []) if isinstance(data, dict) else []
print("Preguntas:", len(qs), "(se esperaban 5)")

def cumple(q):
    if not isinstance(q, dict):
        return False
    o = q.get("options")
    return (isinstance(o, dict) and set(o) == set("ABCD")
            and q.get("correct") in list("ABCD")
            and bool(q.get("explanation")))

for i, q in enumerate(qs, 1):
    if cumple(q):
        print("  Pregunta %d: cumple REQ-02" % i)
    else:
        tipo = type(q.get("options")).__name__ if isinstance(q, dict) else type(q).__name__
        print("  Pregunta %d: NO cumple REQ-02 (options es de tipo %s)" % (i, tipo))
