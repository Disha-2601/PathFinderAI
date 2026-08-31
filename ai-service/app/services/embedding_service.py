"""
Embedding Service for fast, cached dense vector encoding using all-MiniLM-L6-v2
"""

import os
from collections import OrderedDict
from threading import RLock
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer

_model_instance = None
_CACHE_MAX_SIZE = int(os.getenv("EMBEDDING_CACHE_MAX_SIZE", "2048"))
_embedding_cache: OrderedDict[str, List[float]] = OrderedDict()
_cache_lock = RLock()


def _cache_key(text: str) -> str:
    normalized = " ".join((text or "").strip().lower().split())
    return normalized or "__empty__"


def _get_cached_embedding(key: str) -> List[float] | None:
    with _cache_lock:
        cached = _embedding_cache.get(key)
        if cached is None:
            return None
        _embedding_cache.move_to_end(key)
        return list(cached)


def _set_cached_embedding(key: str, embedding: List[float]) -> None:
    if not key:
        return
    with _cache_lock:
        _embedding_cache[key] = list(embedding)
        _embedding_cache.move_to_end(key)
        while len(_embedding_cache) > _CACHE_MAX_SIZE:
            _embedding_cache.popitem(last=False)


def get_embedding_model() -> SentenceTransformer:
    """Get or initialize singleton instance of SentenceTransformer."""
    global _model_instance
    if _model_instance is None:
        _model_instance = SentenceTransformer('all-MiniLM-L6-v2')
    return _model_instance


def encode_text(text: str) -> List[float]:
    """Encode a single text into a 384-dimensional normalized vector list."""
    key = _cache_key(text)
    cached = _get_cached_embedding(key)
    if cached is not None:
        return cached

    model = get_embedding_model()
    embedding = model.encode(text, normalize_embeddings=True)
    embedding_list = embedding.tolist()
    _set_cached_embedding(key, embedding_list)
    return embedding_list


def encode_texts(texts: List[str]) -> np.ndarray:
    """Encode a list of texts into normalized numpy array of embeddings, reusing cached duplicates."""
    if not texts:
        return np.empty((0, 384), dtype=np.float32)

    keys = [_cache_key(text) for text in texts]
    resolved: dict[str, List[float]] = {}
    missing_keys: List[str] = []
    missing_texts: List[str] = []

    for text, key in zip(texts, keys):
        cached = _get_cached_embedding(key)
        if cached is not None:
            resolved[key] = cached
        elif key and key not in resolved and key not in missing_keys:
            missing_keys.append(key)
            missing_texts.append(text)

    if missing_texts:
        model = get_embedding_model()
        embeddings = model.encode(missing_texts, normalize_embeddings=True)
        for key, embedding in zip(missing_keys, embeddings):
            embedding_list = embedding.tolist()
            _set_cached_embedding(key, embedding_list)
            resolved[key] = embedding_list

    return np.asarray([resolved[key] for key in keys], dtype=np.float32)
