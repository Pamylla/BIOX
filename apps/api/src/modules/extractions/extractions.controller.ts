import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import {
  updateExtractionItemSchema,
  type DiscardExtractionResponse,
  type ExtractionItem,
  type ExtractionReview,
  type UpdateExtractionItem,
} from "@biox/shared";
import type { User } from "@prisma/client";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurrentUser } from "../auth/auth.decorators";
import { ExtractionsService } from "./extractions.service";

@Controller("extractions")
export class ExtractionsController {
  constructor(private readonly extractionsService: ExtractionsService) {}

  /** GET /v1/extractions/:id — Review screen payload (items + header counts). */
  @Get(":id")
  getExtraction(@CurrentUser() user: User, @Param("id") id: string): Promise<ExtractionReview> {
    return this.extractionsService.getReview(user.id, id);
  }

  /** PATCH /v1/extractions/:id/items/:itemId — persist an inline correction. */
  @Patch(":id/items/:itemId")
  updateItem(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body(new ZodValidationPipe(updateExtractionItemSchema)) patch: UpdateExtractionItem,
  ): Promise<ExtractionItem> {
    return this.extractionsService.updateItem(user.id, id, itemId, patch);
  }

  /** POST /v1/extractions/:id/discard — soft-discard the extraction under review. */
  @Post(":id/discard")
  discard(@CurrentUser() user: User, @Param("id") id: string): Promise<DiscardExtractionResponse> {
    return this.extractionsService.discard(user.id, id);
  }
}
