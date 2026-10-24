---
name: textbook-to-curriculum
description: Turn a school textbook PDF into a Heroes World curriculum JSON file (units, lessons, textbook exercises, extra generated questions, game templates) that the app imports from «📚 استيراد منهج». Use when the user gives a textbook PDF or asks to add a book/curriculum.
---

# Textbook PDF → Heroes World curriculum JSON

Output: one file `curricula/<id>.json` in the format of `src/lib/curriculum/schema.ts`
(JSON Schema: `docs/curriculum.schema.json`), checked with
`node scripts/curriculum/check.mjs curricula/<id>.json` (same rules as the app).

## Rules that never bend

- **Units and lessons come only from the book.** Copy titles exactly as printed
  (same words, same tashkeel when printed). Never invent, merge, split or rename
  a unit or lesson. If a title is unreadable, keep your best reading and say so
  in your report to the user; the teacher can fix it in the import preview.
- **Every question has `origin`:**
  - `"textbook"`: an exercise that is in the book, with its `page`.
  - `"generated"`: a question you wrote for practice. It must stay inside what
    the lesson teaches, use the book's numbers and words, and suit the grade.
- **Answers must be right.** Work every answer out yourself. The checker also
  recomputes `a + b = ؟` style prompts. Do not ship a question you are unsure of.
- Only exercises that a class can answer on a smartboard by choosing or ordering
  become questions. Skip the rest (drawing, colouring, writing a sentence,
  measuring a real object) and do not fake them.
- Do not put the book's long text, pictures or whole pages in the JSON. Short
  exercises only.

## Steps

1. **Get the PDF and its facts.**
   - `pdfinfo book.pdf` gives the page count.
   - `sha256sum book.pdf` gives the fingerprint. Put it in `textbook.sha256`;
     it stops the same book from being imported twice.
   - If the official site is unreachable from the sandbox, set
     `curricula/fetch-request.json` (`name`, `url`, `fallbacks`) and push. The
     "Fetch textbook PDF" workflow downloads it as a run artifact.
2. **Find the structure.**
   - Read the contents pages (فهرس المحتويات) with the Read tool (`pages: "1-8"`).
     School books are mostly pictures, so read pages visually; `pdftotext -layout`
     helps for text-heavy books.
   - Record each unit (number, title, semester, page range) and each lesson
     (title, page range) exactly.
3. **Per lesson, read its pages.** Collect the exercises (تمارين، أتدرّب، أتحقق
   من فهمي…) that fit a question kind:
   - `mcq`: choices plus `correctIndex`. "Circle the bigger number" becomes an mcq.
   - `truefalse`: `correctIndex` 0 = صح, 1 = خطأ.
   - `arithmetic`: the prompt is just `"7 + 5"`; the app makes the choices.
   - `order`: `answer` holds the word or sentence; letters or words get shuffled.
   - `match`: `pairs`.
4. **Add generated questions** (origin `generated`) so each lesson has about
   6–10 questions in total. Keep a clear majority from the book when it has enough.
5. **Pick game templates per lesson** (`games`). The template must exist and suit
   the subject (see the table below). For a math lesson, prefer the math game
   that teaches that skill and give a `level` 1–3. Leave `games` empty to let the
   app choose (quiz / memory / word maker from the questions).
6. **Write the JSON:**
   - `id`: country-grade-subject-semester-edition, e.g. `jo-g1-math-s1-2022`.
   - Also fill `textbook`, `generatedBy` (e.g. "Claude Code from the textbook PDF")
     and `generatedAt` (ISO date).
7. **Check:** run `node scripts/curriculum/check.mjs <file>`. Fix every ✗ error
   and look at every ! warning.
8. **Report to the user:**
   - Counts of units, lessons, questions (from the book / generated) and games.
   - Pages you could not read.
   - Lessons with few questions.
   - Anything the teacher should review in the preview.

## Game templates

| template | subjects | question kinds it plays |
|---|---|---|
| quiz, wheel, balloons, teams, race, puzzle, space | all | mcq, truefalse, arithmetic |
| memory | all | match |
| words | arabic, english | order |
| numbers | math | arithmetic, mcq, truefalse |
| island, crocodile, rocket, appleBasket, factory, pirates, shapes, pizza, market, clock, measure | math: generate their own tasks (set `level`); other subjects: play mcq / truefalse | — |
| train, raceAdd | math only (generated tasks) | — |

Math skills → template:
- counting → island
- comparing numbers (> < =) → crocodile
- addition → rocket or raceAdd
- subtraction → appleBasket or pirates
- tens/ones and place value → factory
- before/after and number order → train
- shapes and solids → shapes
- fractions → pizza
- money → market
- time → clock
- length, mass and capacity → measure

## Minimal example

```json
{
  "app": "heroes-world", "kind": "curriculum", "version": 1,
  "curriculum": {
    "id": "jo-g1-math-s1-2022", "country": "الأردن", "title": "الرياضيات — الصف الأول — الفصل الأول",
    "grade": 1, "subject": "math", "semester": 1,
    "textbook": { "title": "الرياضيات، الصف الأول، الفصل الدراسي الأول، كتاب الطالب", "publisher": "المركز الوطني لتطوير المناهج", "isbn": "…", "pages": 115, "sha256": "…" },
    "generatedBy": "Claude Code from the textbook PDF", "generatedAt": "2026-10-24",
    "units": [{ "id": "u1", "number": 1, "title": "…", "semester": 1, "pages": [8, 30], "lessons": [
      { "id": "u1-l1", "title": "…", "pages": [10, 11], "games": [{ "template": "island", "level": 1 }, { "template": "quiz" }],
        "questions": [
          { "id": "u1-l1-q1", "origin": "textbook", "page": 11, "kind": "mcq", "prompt": "كم تفاحة في الصورة؟ ٣ أم ٤؟", "choices": ["3", "4"], "correctIndex": 0 },
          { "id": "u1-l1-g1", "origin": "generated", "kind": "arithmetic", "prompt": "2 + 1" }
        ] }
    ] }]
  }
}
```
