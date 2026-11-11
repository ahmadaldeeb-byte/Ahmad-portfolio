import { describe, expect, it } from "vitest";
import { isArabic, isCorrectOrder, isMathExpression, splitLetters, stripTashkeel } from "@/lib/arabic";
import { formatNum, normalizeDigits } from "@/lib/utils";

describe("Arabic letters", () => {
  it("keeps tashkeel attached to its letter", () => {
    expect(splitLetters("قَلَم")).toEqual(["قَ", "لَ", "م"]);
    expect(splitLetters("مَدْرَسة")).toEqual(["مَ", "دْ", "رَ", "س", "ة"]);
    expect(splitLetters("بابٌ")).toEqual(["ب", "ا", "بٌ"]);
    expect(splitLetters("شَدَّ")).toEqual(["شَ", "دَّ"]);
  });
  it("checks letter order in reading order", () => {
    expect(isCorrectOrder(["قَ", "لَ", "م"], "قَلَم")).toBe(true);
    expect(isCorrectOrder(["م", "لَ", "قَ"], "قَلَم")).toBe(false);
    expect(isCorrectOrder(["ق", "ل", "م"], "قَلَم", true)).toBe(true);
  });
  it("strips tashkeel and detects Arabic", () => {
    expect(stripTashkeel("عُصْفور")).toBe("عصفور");
    expect(isArabic("أحسنت")).toBe(true);
    expect(isArabic("cat")).toBe(false);
  });
  it("detects pure math expressions (displayed left-to-right)", () => {
    expect(isMathExpression("6 + 3 = ؟")).toBe(true);
    expect(isMathExpression("١٢ ÷ ٣")).toBe(true);
    expect(isMathExpression("ما العدد بعد ٧؟")).toBe(false);
  });
});

describe("numerals", () => {
  it("formats Western and Eastern Arabic (Hindi) digits", () => {
    expect(formatNum(1205, "arabic")).toBe("1205");
    expect(formatNum(1205, "hindi")).toBe("١٢٠٥");
    expect(formatNum("3:07", "hindi")).toBe("٣:٠٧");
  });
  it("normalizes typed Eastern digits", () => {
    expect(normalizeDigits("٤٧")).toBe("47");
    expect(normalizeDigits("۱۲")).toBe("12");
  });
});
