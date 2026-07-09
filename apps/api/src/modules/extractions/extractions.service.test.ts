import { ConflictException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtractionItem } from "@prisma/client";
import type { PrismaService } from "../../prisma/prisma.service";
import { ExtractionsService } from "./extractions.service";

function itemRow(overrides: Partial<ExtractionItem> = {}): ExtractionItem {
  return {
    id: "item-1",
    extractionId: "ext-1",
    rawLabel: "Hemoglobina",
    biomarkerKey: "hemoglobina",
    value: null,
    valueQualifier: null,
    valueLabel: null,
    unit: "g/dL",
    refLow: null,
    refHigh: null,
    lowInclusive: null,
    highInclusive: null,
    refTiers: null,
    refRaw: null,
    assayMethod: null,
    confidence: "medium",
    plausibility: "ok",
    editedByUser: false,
    ...overrides,
  };
}

describe("ExtractionsService", () => {
  const extractionFindFirst = vi.fn();
  const extractionUpdate = vi.fn();
  const itemFindFirst = vi.fn();
  const itemUpdate = vi.fn();
  const prisma = {
    extraction: { findFirst: extractionFindFirst, update: extractionUpdate },
    extractionItem: { findFirst: itemFindFirst, update: itemUpdate },
  } as unknown as PrismaService;
  const service = new ExtractionsService(prisma);

  beforeEach(() => vi.clearAllMocks());

  describe("getReview", () => {
    it("scopes the lookup to the owner and returns the mapped review", async () => {
      extractionFindFirst.mockResolvedValue({
        id: "ext-1",
        status: "needs_review",
        reportFile: { filename: "hemograma.pdf" },
        reportDate: null,
        performingLab: "Fleury",
        error: null,
        items: [itemRow()],
      });

      const review = await service.getReview("user-1", "ext-1");

      expect(extractionFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "ext-1", userId: "user-1" } }),
      );
      expect(review.counts).toEqual({ values: 1, panels: 1, toCheck: 1 });
    });

    it("404s when the extraction is missing or owned by someone else", async () => {
      extractionFindFirst.mockResolvedValue(null);

      await expect(service.getReview("user-1", "ext-x")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("updateItem", () => {
    it("persists the patch and marks the item edited", async () => {
      extractionFindFirst.mockResolvedValue({ status: "needs_review" });
      itemFindFirst.mockResolvedValue({ id: "item-1" });
      itemUpdate.mockResolvedValue(itemRow({ value: null, unit: "g/dL", editedByUser: true }));

      await service.updateItem("user-1", "ext-1", "item-1", { unit: "g/dL" });

      expect(itemUpdate).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { unit: "g/dL", editedByUser: true },
      });
    });

    it("rejects editing once the extraction has left review", async () => {
      extractionFindFirst.mockResolvedValue({ status: "confirmed" });

      await expect(
        service.updateItem("user-1", "ext-1", "item-1", { value: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(itemUpdate).not.toHaveBeenCalled();
    });

    it("rejects reassigning to a biomarker code the catalog doesn't know", async () => {
      extractionFindFirst.mockResolvedValue({ status: "needs_review" });

      await expect(
        service.updateItem("user-1", "ext-1", "item-1", { biomarkerKey: "not_a_marker" }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(itemUpdate).not.toHaveBeenCalled();
    });

    it("accepts a known catalog code", async () => {
      extractionFindFirst.mockResolvedValue({ status: "needs_review" });
      itemFindFirst.mockResolvedValue({ id: "item-1" });
      itemUpdate.mockResolvedValue(itemRow({ biomarkerKey: "ferritina" }));

      await service.updateItem("user-1", "ext-1", "item-1", { biomarkerKey: "ferritina" });

      expect(itemUpdate).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { biomarkerKey: "ferritina", editedByUser: true },
      });
    });

    it("404s when the item is not part of the extraction", async () => {
      extractionFindFirst.mockResolvedValue({ status: "needs_review" });
      itemFindFirst.mockResolvedValue(null);

      await expect(
        service.updateItem("user-1", "ext-1", "ghost", { value: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("discard", () => {
    it("soft-discards an extraction under review", async () => {
      extractionFindFirst.mockResolvedValue({ status: "needs_review" });
      extractionUpdate.mockResolvedValue({});

      const result = await service.discard("user-1", "ext-1");

      expect(extractionUpdate).toHaveBeenCalledWith({
        where: { id: "ext-1" },
        data: { status: "discarded" },
      });
      expect(result).toEqual({ id: "ext-1", status: "discarded" });
    });

    it("is idempotent when already discarded", async () => {
      extractionFindFirst.mockResolvedValue({ status: "discarded" });

      const result = await service.discard("user-1", "ext-1");

      expect(result).toEqual({ id: "ext-1", status: "discarded" });
      expect(extractionUpdate).not.toHaveBeenCalled();
    });

    it("refuses to discard a confirmed extraction", async () => {
      extractionFindFirst.mockResolvedValue({ status: "confirmed" });

      await expect(service.discard("user-1", "ext-1")).rejects.toBeInstanceOf(ConflictException);
      expect(extractionUpdate).not.toHaveBeenCalled();
    });

    it("404s when the extraction is missing", async () => {
      extractionFindFirst.mockResolvedValue(null);

      await expect(service.discard("user-1", "ext-x")).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
