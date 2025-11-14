import ollama

class miniLM:


    def getSynonyms(self, word, context):
        # Règle de base : comment le modèle doit se comporter
        system_prompt = """
        You are a linguistic assistant.
        Every time you receive a word,
        you must return only a list with as many English synonyms of that word as possible,
        in CSV format, without determiners, sentences, or punctuation.
        Do not include any spaces between the synonyms, only commas.
        Example:
        input: "beauty"
        output: "attractiveness,loveliness,prettiness,allure,charm,grace,elegance"
        If you cannot find any relevant synonyms, simply reply with "none".
        """

        response = ollama.chat(model="qwen3:0.6b", messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": word}
        ])

        return response["message"]["content"]