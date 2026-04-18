import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from textblob import TextBlob
import os

# Download NLTK data required for preprocessing quietly
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

class TextPreprocessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()

    def clean_text(self, text):
        """
        Applies NLP techniques to clean a text string:
        - Lowercasing
        - Punctuation removal
        - Tokenization
        - Stopword removal
        - Lemmatization
        """
        if pd.isna(text):
            return ""
            
        # 1. Lowercase and remove punctuation & special chars
        text = str(text).lower()
        text = re.sub(r'[^a-z\s]', '', text)
        
        # 2. Tokenization & remove stopwords
        words = text.split()
        words = [w for w in words if w not in self.stop_words]
        
        # 3. Lemmatization
        words = [self.lemmatizer.lemmatize(w) for w in words]
        
        return " ".join(words)
        
    def get_sentiment(self, text):
        """Extracts sentiment polarity (-1.0 to 1.0)"""
        return TextBlob(str(text)).sentiment.polarity

def process_dataset(input_path, output_path):
    print(f"Loading dataset from: {input_path}")
    df = pd.read_csv(input_path)
    
    # Initialize preprocessor
    preprocessor = TextPreprocessor()
    
    print("Cleaning text data (Tokenizing, removing stopwords, lemmatization)...")
    # Apply text cleaning
    df['cleaned_text'] = df['text'].apply(preprocessor.clean_text)
    
    # Check if sentiment exists, if not calculate it
    if 'sentiment' not in df.columns:
        print("Calculating sentiment scores...")
        df['sentiment'] = df['text'].apply(preprocessor.get_sentiment)
        
    print(f"Preprocessing complete. Sample cleaned data:\n{df[['text', 'cleaned_text']].head()}")
    
    # Save the processed dataset
    df.to_csv(output_path, index=False)
    print(f"Processed dataset saved to: {output_path}")
    return df

if __name__ == "__main__":
    # Ensure correct paths if running directly
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, 'data', 'TS-PS14.csv')
    output_file = os.path.join(base_dir, 'data', 'cleaned_TS-PS14.csv')
    
    process_dataset(input_file, output_file)
