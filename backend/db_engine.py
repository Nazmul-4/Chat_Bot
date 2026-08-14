import os
import re
import pandas as pd
# CSV file name in your project root
# CSV_FILE = "AccountNumberInformation.csv"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "AccountNumberInformation.csv")

# Common Benglish/English filler words to strip out during text searches
FILLER_WORDS = {
    "amake", "er", "dao", "den", "bolo", "details", "check", "koren", "ta",
    "nam", "id", "info", "information", "show", "give", "me", "find", "search",
    "list", "all", "customer", "account", "number", "no", "hisab", "tarikh", "date",
    "please", "ki", "ka", "ke", "karo", "kon"
}

def load_dataframe() -> pd.DataFrame:
    """Loads and formats the CSV file into a Pandas DataFrame."""
    if not os.path.exists(CSV_FILE):
        raise FileNotFoundError(f"CSV file '{CSV_FILE}' not found.")
        
    return pd.read_csv(
        CSV_FILE,
        dtype={
            "Application Id": str,
            "Account Name": str,
            "Account No": str,
            "Mobile Number": str,
            "Application Date": str
        }
    ).fillna("N/A")

def search_database(query: str) -> list[dict]:
    """
    Searches the database for matching records (Names, Dates, IDs, Phones, Account Nos).
    Returns ALL matching records as a list of dictionary objects without any truncation.
    """
    df = load_dataframe()
    query_clean = query.strip()
    
    if not query_clean:
        return []

    matched_df = pd.DataFrame()

    # STEP 1: Number Search (IDs, Mobile Numbers, Account Numbers)
    extracted_numbers = re.findall(r'\b\d{2,}\b', query_clean)
    if extracted_numbers:
        masks = []
        for num in extracted_numbers:
            masks.append(df["Application Id"].astype(str).str.contains(re.escape(num), case=False, na=False))
            masks.append(df["Account No"].astype(str).str.contains(re.escape(num), case=False, na=False))
            masks.append(df["Mobile Number"].astype(str).str.contains(re.escape(num), case=False, na=False))
        combined_mask = pd.concat(masks, axis=1).any(axis=1)
        matched_df = df[combined_mask]

    # STEP 2: Keyword / Partial Substring Search (First, Middle, Last Names & Dates)
    if matched_df.empty:
        words = re.findall(r'\w+', query_clean.lower())
        cleaned_keywords = [w for w in words if w not in FILLER_WORDS and len(w) > 1]
        
        if cleaned_keywords:
            masks = []
            for kw in cleaned_keywords:
                kw_mask = df.apply(lambda row: row.astype(str).str.contains(re.escape(kw), case=False).any(), axis=1)
                masks.append(kw_mask)
            if masks:
                combined_mask = pd.concat(masks, axis=1).all(axis=1)
                matched_df = df[combined_mask]

    # STEP 3: Raw Fallback Substring Search
    if matched_df.empty:
        matched_df = df[df.apply(lambda row: row.astype(str).str.contains(re.escape(query_clean), case=False).any(), axis=1)]

    # Format the matched DataFrame rows into clean JSON-serializable dictionaries
    records = []
    for _, row in matched_df.iterrows():
        records.append({
            "application_id": str(row['Application Id']).split(".")[0].strip(),
            "account_name": str(row['Account Name']).strip(),
            "account_no": str(row['Account No']).split(".")[0].strip(),
            "mobile_number": str(row['Mobile Number']).split(".")[0].strip(),
            "application_date": str(row['Application Date']).strip()
        })

    return records


# Quick local test runner
if __name__ == "__main__":
    test_query = "NAZMUL"
    print(f"Testing search for: '{test_query}'")
    results = search_database(test_query)
    print(f"Total Matches Found: {len(results)}\n")
    for idx, item in enumerate(results, 1):
        print(f"{idx}. {item['account_name']} | ID: {item['application_id']} | Acc: {item['account_no']}")