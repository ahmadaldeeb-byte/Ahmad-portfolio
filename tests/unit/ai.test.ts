import { describe, expect, it } from "vitest";
import { offlineGenerator, parseRequest } from "@/lib/ai/generator";
import { seedQuestions } from "@/content/seed";
import { validateGame } from "@/lib/questions";

describe("AI generator extension point (offline)", () => {
  const req = "أنشئ لعبة سباق سيارات للصف الثاني عن الجمع والطرح، تحتوي على 10 أسئلة وفريقين";
  it("parses an Arabic teacher request", () => {
    expect(parseRequest(req)).toMatchObject({ grade: 2, subject: "math", type: "race", count: 10, teams: 2, topic: "الجمع والطرح" });
    expect(parseRequest("عجلة للصف الأول عن الحيوانات فيها ٥ أسئلة")).toMatchObject({ grade: 1, type: "wheel", count: 5 });
  });
  it("builds a valid draft that still needs teacher review, without network", async () => {
    const d = await offlineGenerator.generate(req, seedQuestions());
    expect(offlineGenerator.requiresNetwork).toBe(false);
    expect(d.needsReview).toBe(true);
    expect(d.game.type).toBe("race");
    expect(d.game.settings.teams).toHaveLength(2);
    expect(d.game.questions.every((q) => q.grade === 2 && q.subject === "math")).toBe(true);
    expect(validateGame(d.game)).toEqual([]);
  });
});
