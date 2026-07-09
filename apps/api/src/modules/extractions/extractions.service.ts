import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  biomarkerCatalog,
  type DiscardExtractionResponse,
  type ExtractionItem as ExtractionItemDto,
  type ExtractionReview,
  type UpdateExtractionItem,
} from "@biox/shared";
import { ExtractionStatus, type Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toExtractionItemDto, toExtractionReview } from "./extraction-review.mapper";

/** Review leg of the ingestion pipeline (plan §11.3): read, correct, discard an extraction. */
@Injectable()
export class ExtractionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /v1/extractions/:id — the Review screen payload for the owner. */
  async getReview(userId: string, extractionId: string): Promise<ExtractionReview> {
    const extraction = await this.prisma.extraction.findFirst({
      where: { id: extractionId, userId },
      include: { items: { orderBy: { id: "asc" } }, reportFile: { select: { filename: true } } },
    });
    if (!extraction) throw this.notFound(extractionId);
    return toExtractionReview(extraction);
  }

  /** PATCH /v1/extractions/:id/items/:itemId — persist an inline correction. */
  async updateItem(
    userId: string,
    extractionId: string,
    itemId: string,
    patch: UpdateExtractionItem,
  ): Promise<ExtractionItemDto> {
    const extraction = await this.prisma.extraction.findFirst({
      where: { id: extractionId, userId },
      select: { status: true },
    });
    if (!extraction) throw this.notFound(extractionId);
    if (extraction.status !== ExtractionStatus.needs_review) {
      throw new ConflictException({
        code: "extraction_not_editable",
        message: `Items can only be edited while the extraction is under review (is "${extraction.status}")`,
      });
    }

    // Reassigning to an unknown catalog code would silently break the display join.
    if (patch.biomarkerKey != null && !biomarkerCatalog.findByCode(patch.biomarkerKey)) {
      throw new ConflictException({
        code: "unknown_biomarker",
        message: `No catalog biomarker with code "${patch.biomarkerKey}"`,
      });
    }

    const item = await this.prisma.extractionItem.findFirst({
      where: { id: itemId, extractionId },
      select: { id: true },
    });
    if (!item) {
      throw new NotFoundException({
        code: "item_not_found",
        message: `No item "${itemId}" in extraction "${extractionId}"`,
      });
    }

    const updated = await this.prisma.extractionItem.update({
      where: { id: itemId },
      data: { ...toItemUpdateData(patch), editedByUser: true },
    });
    return toExtractionItemDto(updated);
  }

  /** POST /v1/extractions/:id/discard — soft-discard (idempotent); a confirmed snapshot can't be undone here. */
  async discard(userId: string, extractionId: string): Promise<DiscardExtractionResponse> {
    const extraction = await this.prisma.extraction.findFirst({
      where: { id: extractionId, userId },
      select: { status: true },
    });
    if (!extraction) throw this.notFound(extractionId);
    if (extraction.status === ExtractionStatus.discarded) {
      return { id: extractionId, status: ExtractionStatus.discarded };
    }
    if (extraction.status === ExtractionStatus.confirmed) {
      throw new ConflictException({
        code: "extraction_already_confirmed",
        message: "A confirmed extraction can't be discarded; delete its snapshot instead",
      });
    }
    await this.prisma.extraction.update({
      where: { id: extractionId },
      data: { status: ExtractionStatus.discarded },
    });
    return { id: extractionId, status: ExtractionStatus.discarded };
  }

  private notFound(extractionId: string): NotFoundException {
    return new NotFoundException({
      code: "extraction_not_found",
      message: `No extraction "${extractionId}"`,
    });
  }
}

/** Maps only the fields present in the patch onto Prisma's update input. */
function toItemUpdateData(patch: UpdateExtractionItem): Prisma.ExtractionItemUpdateInput {
  const data: Prisma.ExtractionItemUpdateInput = {};
  if (patch.biomarkerKey !== undefined) data.biomarkerKey = patch.biomarkerKey;
  if (patch.value !== undefined) data.value = patch.value;
  if (patch.valueQualifier !== undefined) data.valueQualifier = patch.valueQualifier;
  if (patch.valueLabel !== undefined) data.valueLabel = patch.valueLabel;
  if (patch.unit !== undefined) data.unit = patch.unit;
  if (patch.refLow !== undefined) data.refLow = patch.refLow;
  if (patch.refHigh !== undefined) data.refHigh = patch.refHigh;
  if (patch.refRaw !== undefined) data.refRaw = patch.refRaw;
  return data;
}
