from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class miniLM:
    def __init__(self):
        self.model = self.load_model()


    def load_model(self):
        model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", device="cpu")
        return model
    
    def getEmbedding(self, word: str):
        embedding = self.model.encode(word)
        return embedding

    def getEmbeddingsList(self, words: list):
        embeddings = self.model.encode(words)
        return embeddings

    def getSimilarity(self, synonym_embedding, context_embedding : list):
        similarities = cosine_similarity([synonym_embedding], context_embedding)[0]
        similarity = np.mean(similarities)
        
        return similarity
    
    def getOrderedSynonyms(self, synonyms: list, context: list):
        context_embedding = self.getEmbeddingsList(context)
        synonyms_embeddings = self.getEmbeddingsList(synonyms)

        ordered_synonyms = self.sortSynonyms(synonyms, synonyms_embeddings, context_embedding)

        return ordered_synonyms
    
    def sortSynonyms(self, synonyms, synonyms_embeddings, context_embeddings):
        score_synonyms = []
        for synonym, synonym_embedding in zip(synonyms, synonyms_embeddings):
            similarity = self.getSimilarity(synonym_embedding, context_embeddings)
            score_synonyms.append((synonym, similarity))

        score_synonyms.sort(key=lambda x: x[1], reverse=True)
        ordered_synonyms = [word for word, _ in score_synonyms]
        return ordered_synonyms
        
