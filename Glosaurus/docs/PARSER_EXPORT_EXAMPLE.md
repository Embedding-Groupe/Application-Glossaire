# Parser Export Format Examples

## JSON Export Example

```json
{
  "fileName": "my_document.pdf",
  "exportDate": "2026-02-09T10:30:45.123Z",
  "totalTerms": 5,
  "termsInGlossary": 3,
  "termsNotInGlossary": 2,
  "terms": [
    {
      "term": "API",
      "occurrence": 12,
      "inGlossary": true
    },
    {
      "term": "authentication",
      "occurrence": 8,
      "inGlossary": true
    },
    {
      "term": "database",
      "occurrence": 5,
      "inGlossary": true
    },
    {
      "term": "microservice",
      "occurrence": 3,
      "inGlossary": false
    },
    {
      "term": "deployment",
      "occurrence": 2,
      "inGlossary": false
    }
  ]
}
```

## Markdown Export Example

```markdown
# Parser Analysis Results

**File/Folder:** my_document.pdf

**Export Date:** February 9, 2026 at 10:30:45 AM

**Summary:**

- Total terms found: 5
- Terms in glossary: 3
- Terms not in glossary: 2

## Results

| Term           | Occurrences | In Glossary |
| -------------- | ----------- | ----------- |
| API            | 12          | ✓ Yes       |
| authentication | 8           | ✓ Yes       |
| database       | 5           | ✓ Yes       |
| microservice   | 3           | ✗ No        |
| deployment     | 2           | ✗ No        |
```

## Features

The Parser export now includes:

- **File/Folder Name**: The name of the analyzed file or directory
- **Terms**: List of all found terms with their occurrence counts
- **Glossary Status**: Indicates whether each term exists in the glossary (Yes/No)
- **Statistics**: Total counts for terms, terms in glossary, and terms not in glossary
- **Export Date**: Timestamp of when the export was created

## File Naming

- JSON files: `parser_results_YYYY-MM-DD.json`
- Markdown files: `parser_results_YYYY-MM-DD.md`

Both formats include the export date for easy tracking of analyses.
