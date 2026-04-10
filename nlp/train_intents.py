# nlp/train_intents.py
import json
from pathlib import Path
from collections import Counter

import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
from sklearn.metrics import classification_report, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "datasets" / "intents_v1.jsonl"
MODEL_PATH = BASE_DIR / "intent_model.joblib"


def load_jsonl(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"No existe el dataset en: {path}")

    X, y = [], []
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                raise ValueError(f"JSON inválido en línea {i}: {e}\nContenido: {line[:200]}")

            if "text" not in obj or "intent" not in obj:
                raise ValueError(f"Falta 'text' o 'intent' en línea {i}: {obj}")

            text = str(obj["text"]).strip()
            intent = str(obj["intent"]).strip()
            if not text or not intent:
                raise ValueError(f"'text' o 'intent' vacío en línea {i}: {obj}")

            X.append(text)
            y.append(intent)

    return X, y


def main():
    print("=== Entrenamiento de clasificador de intenciones ===")
    print("Dataset:", DATA_PATH)
    print("Existe:", DATA_PATH.exists())

    X, y = load_jsonl(DATA_PATH)
    print(f"\nEjemplos totales: {len(X)}")
    print("Distribución de clases:", Counter(y))

    # Si una clase tiene muy pocos ejemplos, stratify puede fallar.
    # (Regla: cada clase debe tener al menos 2 ejemplos en test)
    test_size = 0.25
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),   # unigramas y bigramas
            analyzer="word"
        )),
        ("clf", LinearSVC(class_weight="balanced", random_state=42))
    ])

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    print("\n=== Reporte de clasificación ===")
    print(classification_report(y_test, y_pred, digits=3))

    labels = sorted(list(set(y)))
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    print("=== Matriz de confusión (labels en este orden) ===")
    print(labels)
    print(cm)

    joblib.dump(model, MODEL_PATH)
    print(f"\n Modelo guardado en: {MODEL_PATH}")

    # Demo rápida
    demo = [
        "¿Quién debe llevar el registro de accidentes de tránsito en el municipio?",
        "¿Qué reglamento aplica para la circulación en Jojutla?"
    ]
    preds = model.predict(demo)
    print("\n=== Demo ===")
    for q, p in zip(demo, preds):
        print(f"- {q}  ->  {p}")


if __name__ == "__main__":
    main()
