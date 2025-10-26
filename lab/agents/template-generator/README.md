# Template Generator Agent

AI-powered agent that generates course templates from specification files using LLM-based content generation.

## Quick Start

### 1. Setup Authentication

First, obtain a JWT token for local Supabase:

```bash
# From project root
./scripts/get-local-token.sh

# Add the token to .env.local
echo 'SUPABASE_USER_TOKEN="<your-token>"' >> .env.local
```

### 2. Generate Template

Generate a template DTO from a specification file:

```bash
# From /lab directory
npm run generate-template agents/template-generator/specs/german-greetings.yml

# With limited items (for testing)
npm run generate-template agents/template-generator/specs/german-greetings.yml -- --max-items 2
```

This creates a JSON file in `output/` directory containing template and tree DTOs.

### 3. Save to Database

Save the generated template via edge function API:

```bash
# From /lab directory
npm run admin save-template output/german-greetings-course.template.json
```

## Workflow Overview

```
┌─────────────────┐
│ Spec File (yml) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Agent  │  (LLM-powered content generation)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DTO File (json) │  (template + tree structure)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Admin CLI     │  (HTTP POST to edge functions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Database     │  (validated & persisted)
└─────────────────┘
```

## Prerequisites

- Local Supabase running (`supabase start`)
- Edge functions deployed or served locally
- Authentication token configured
- OpenAI API key in `.env.local`

## Output Format

Generated DTO files contain two objects matching edge function contracts:

```json
{
  "template": {
    "title": "Course Title",
    "description": "Course description"
  },
  "tree": {
    "templateId": "uuid",
    "treeData": {
      "id": "root-id",
      "nodeType": "container",
      "title": "Root",
      "children": [...]
    }
  }
}
```

## CLI Options

### Generate Template

```bash
npm run generate-template <spec-file> [options]

Options:
  --max-items <number>  Limit items per level (for development/testing)
```

### Save Template

```bash
npm run admin save-template <dto-file> [options]

Options:
  --token <jwt>  Override SUPABASE_USER_TOKEN env var
```

## Troubleshooting

**"No authentication token found"**
- Run `./scripts/get-local-token.sh`
- Add token to `.env.local`

**"Worker failed to boot"**
- Deploy edge functions: `supabase functions deploy templates`
- Or serve locally: `supabase functions serve`

**Validation errors**
- Check DTO structure matches edge function schemas
- Review error details in CLI output

---

# General Leaf Specification

## Core Principles

### Voice Compatibility
All reading ('reading_*') fields must be optimized for text-to-speech:
- **NO emoticons or emojis** (❌ ✅ 😊 → remove all)
- **NO slash notations** (er/sie/es → write as "er, sie, es")
- **NO special symbols** except essential punctuation (. , ! ? ; :)
- **NO bracketed annotations** during reading text (avoid [informal], (plural), etc.)
- **Write numbers as words** when under 20 (3 → drei, three)
- **Spell out abbreviations** (bzw. → beziehungsweise)

### Reading Field Guidelines
- **reading_text_short**: Maximum 4 lines, immediate recognition focus
- **reading_text_regular**: Maximum 10 lines, balanced practice
- **reading_text_long**: Maximum 15 lines, deep comprehension
- Each field must be self-contained and complete
- Progressive complexity without pure repetition
- Natural language flow for voice reading

### Quiz Questions
- Always provide exactly 16 questions
- Use progressive difficulty (4 easy, 4 medium, 4 hard, 4 expert)
- Mix question types (translation, fill-in, correction, application)
- Avoid yes/no questions when possible
- Questions should reinforce the reading material

---

# Language Vocabulary Leaf Specification

## Purpose
Language vocabulary leaves focus on memorizing individual words (primarily verbs) through progressive repetition and contextual understanding.

## Structure

### Reading Text Fields
Each field serves a specific memorization purpose with increasing complexity:

#### 1. `reading_text_short` (10 seconds, core forms)
For verbs, always follow this exact pattern:
```
[Infinitive];
Ich [present];
Ich [past];
Ich [perfect];
```

Example:
```
Sein;
Ich bin;
Ich war;
Ich bin gewesen;
```

#### 2. `reading_text_regular` (30 seconds, essential conjugations)
Structure:
- Line 1: Word with translation
- Lines 2-4: Present conjugations (all persons)
- Lines 5-7: Past conjugations (all persons)
- Line 8: Perfect form (ich + du + er/sie/es)
- Lines 9-11: Three simple example sentences

Example:
```
Sein (to be);
Präsens: ich bin, du bist, er ist, sie ist, es ist, wir sind, ihr seid, sie sind;
Präteritum: ich war, du warst, er war, sie war, es war, wir waren, ihr wart, sie waren;
Perfekt: ich bin gewesen, du bist gewesen, er ist gewesen;

"Ich bin müde." - "Er war krank." - "Wir sind dort gewesen."
```

#### 3. `reading_text_long` (60 seconds, context and usage)
Structure:
- Line 1: Word = translation (function/meaning)
- Lines 2-5: Present tense examples with translations
- Lines 6-7: Past tense examples with translations
- Lines 8-9: Perfect tense examples with translations
- Line 10: Common confusion warning (written out)

Example:
```
SEIN equals to be (state or identity)

Ich bin Lehrer. (I am a teacher)
Du bist zu spät. (You are late)
Er ist dreißig Jahre alt. (He is thirty years old)
Wir sind in Berlin. (We are in Berlin)

Gestern war ich im Kino. (Yesterday I was at the cinema)
Letzte Woche waren wir krank. (Last week we were sick)

Ich bin noch nie in Japan gewesen. (I have never been to Japan)
Sie ist schon dreimal dort gewesen. (She has already been there three times)

Wichtig: Nicht verwechseln: "Ich bin" (I am) versus "Ich habe" (I have)
```

### Quiz Questions (16 total)
Progressive difficulty structure:

**Basic Recognition (Questions 1-4)**
- Word meaning
- Simple translations
- Basic form completion
- True/false comprehension

**Conjugation Practice (Questions 5-8)**
- Person-specific conjugations
- Tense transformations
- Gap fills with context

**Form Recognition (Questions 9-12)**
- Error identification
- Pattern completion
- Conjugation corrections

**Application (Questions 13-16)**
- Full sentence translation
- Context-based selection
- Complex tense usage

## Example Full Leaf:

```yaml
- title: "Sein (to be)"
  description: "Core verb for expressing states and identities"
  type: "language_vocabulary"
  target_language: "de"
  reading_text_short: |
    Sein;
    Ich bin;
    Ich war;
    Ich bin gewesen;
  reading_text_regular: |
    Sein (to be);
    Ich bin;
    Ich war;
    Ich bin gewesen;

    Examples:
    Ich bin müde.
    Er war krank.
    Wir sind dort gewesen.
  reading_text_long: |
    Sein (to be);
    Ich bin;
    Ich war;
    Ich bin gewesen;

    Examples:
    Ich bin müde.
    Du bist groß.
    Er ist Arzt.
    Sie ist schön.
    Es ist kalt.
    Wir sind hier.
    Ihr seid spät.
    Sie sind nett.
    Das ist gut.
    Ich war krank.
    Du warst dort.
    Er war jung.
    Wir waren froh.
    Das Buch ist neu.
    Die Katze ist klein.
    Der Himmel ist blau.
    Mein Name ist Anna.
    Die Suppe ist heiß.
    Der Film war lang.
    Die Kinder sind laut.
  quiz_questions: |
    What does "sein" mean in English?
    What is "ich bin" in English?
    Complete: ich ___ (present tense of sein)
    True/False: "Ich war" means "I was"
    How do you say "you are" (informal) in German?
    Complete: wir ___ (present tense of sein)
    What is the past tense of "sein" for "er"?
    Complete: ihr ___ gewesen (perfect tense)
    Which is correct: "du bist" or "du bin"?
    Transform to past: "Sie sind" → "Sie ___"
    What's wrong with: "Ich bist müde"?
    Complete the pattern: bin, war, ___ gewesen
    Translate: "We are here"
    Fill in: "___ du gestern krank?" (Were you sick yesterday?)
    Choose: "Ich ___ Arzt" (bin/habe)
    Translate: "I have never been there" (using sein + gewesen)
```

## Example 2: Citrus Fruits Vocabulary Group

```yaml
- title: "Zitrusfrüchte (Citrus fruits)"
  description: "Essential citrus fruit vocabulary"
  type: "language_vocabulary"
  target_language: "de"
  reading_text_short: |
    Zitrusfrüchte;
    Orange;
    Zitrone;
    Mandarine;
  reading_text_regular: |
    Zitrusfrüchte (citrus fruits);
    die Orange;
    die Zitrone;
    die Mandarine;

    Examples:
    Ich esse eine Orange.
    Die Zitrone ist sauer.
    Mandarinen sind süß.
  reading_text_long: |
    Zitrusfrüchte (citrus fruits);
    die Orange;
    die Zitrone; 
    die Mandarine;

    Examples:
    Die Orange ist rund.
    Ich trinke Orangensaft.
    Die Zitrone ist gelb.
    Zitronen sind sehr sauer.
    Die Mandarine ist klein.
    Mandarinen sind süß.
    Ich kaufe drei Orangen.
    Der Zitronenbaum blüht.
    Die Mandarine hat viele Kerne.
    Orangensaft ist gesund.
    Ich brauche eine Zitrone.
    Die Kinder essen Mandarinen.
    Der Orangenbaum ist groß.
    Zitronenwasser ist erfrischend.
    Mandarinen sind leicht zu schälen.
    Die Orange kommt aus Spanien.
    Ich presse eine Zitrone aus.
    Die Mandarine duftet gut.
    Orangen haben Vitamin C.
    Der Zitronenkuchen schmeckt gut.
  quiz_questions: |
    What does "Zitrusfrüchte" mean in English?
    What is "die Orange" in English?
    Complete: die ___ (German for lemon)
    True/False: "Mandarine" means "mandarin"
    How do you say "orange juice" in German?
    What is the German article for "Orange"?
    Which citrus fruit is "sauer" (sour)?
    Complete: Ich esse eine _____ (orange)
    Which is correct: "der Orange" or "die Orange"?
    Translate: "The lemon is yellow"
    What's the plural of "Orange" in German?
    Complete: Zitronen sind ___ (sour)
    Translate: "I need three oranges"
    Fill in: "Die ___ ist süß" (The mandarin is sweet)
    Choose: "Orange" is ___ (der/die/das)
    Translate: "Citrus fruits have vitamin C"
```