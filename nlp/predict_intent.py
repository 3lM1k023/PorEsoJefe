# nlp/predict_intent.py
import json
import sys
from pathlib import Path
from joblib import load

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "intent_model.joblib"


def predict(text: str, top_k: int = 5):
    model = load(MODEL_PATH)  # pipeline: vectorizer + classifier
    proba = None
    labels = None

    # Si el clasificador soporta predict_proba
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba([text])[0]
        labels = list(model.classes_)
        # Top k
        idxs = sorted(range(len(proba)), key=lambda i: proba[i], reverse=True)[:top_k]
        best_i = idxs[0]
        best_intent = labels[best_i]
        best_conf = float(proba[best_i])
        top = [{"intent": labels[i], "confidence": float(proba[i])} for i in idxs]
        return {"intent": best_intent, "confidence": best_conf, "top": top}

    # Si NO hay proba (SVM, etc.), al menos devuelve label con confidence aproximada
    pred = model.predict([text])[0]
    return {"intent": str(pred), "confidence": 0.55, "top": [{"intent": str(pred), "confidence": 0.55}]}


def main():
    # Uso:
    #   python nlp/predict_intent.py "texto..."
    # Opcional:
    #   python nlp/predict_intent.py "texto..." 5
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Falta texto"}, ensure_ascii=False))
        sys.exit(1)

    text = sys.argv[1]
    top_k = 5
    if len(sys.argv) >= 3:
        try:
            top_k = int(sys.argv[2])
        except:
            top_k = 5

    if not MODEL_PATH.exists():
        print(json.dumps({"error": f"No existe el modelo: {MODEL_PATH}"}, ensure_ascii=False))
        sys.exit(1)

    result = predict(text, top_k=top_k)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
